import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ChatWindow.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip, faSmile, faPaperPlane, faPhone, faVideo, faInfoCircle, faArrowLeft, faTimes, faFile, faImage, faFileAlt, faSpinner, faDownload } from '@fortawesome/free-solid-svg-icons';
import MessageMenu from './MessageMenu';
import TypingIndicator from './TypingIndicator';
import GroupInfoModal from './GroupInfoModal';
import { ChatState } from '../context/ChatProvider';
import axios from 'axios';
import io from 'socket.io-client';

const ENDPOINT = "http://localhost:5000";

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { user, selectedChat, setSelectedChat, chats, setChats, notification, setNotification, onlineUsers, setOnlineUsers } = ChatState();

  // Refs
  const socketRef = useRef(null);
  const selectedChatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const lastTypingTimeRef = useRef(null);
  const fileInputRef = useRef(null);

  // Keep selectedChatRef in sync
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Socket initialization
  useEffect(() => {
    if (!user) return;

    const socket = io(ENDPOINT);
    socketRef.current = socket;

    socket.emit("setup", user);

    socket.on("connected", () => {
      console.log("Socket connected!");
      setSocketConnected(true);
    });

    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    socket.on("online users", (users) => {
      setOnlineUsers(users);
    });

    socket.on("message received", (newMessageReceived) => {
      console.log("Message received:", newMessageReceived);

      const currentChat = selectedChatRef.current;

      if (!currentChat || currentChat._id !== newMessageReceived.chat._id) {
        setNotification((prev) => {
          if (prev.some(n => n._id === newMessageReceived._id)) {
            return prev;
          }
          return [newMessageReceived, ...prev];
        });

        setChats((prevChats) => {
          const updatedChats = prevChats.map(c => {
            if (c._id === newMessageReceived.chat._id) {
              return { ...c, latestMessage: newMessageReceived };
            }
            return c;
          });
          const chatIndex = updatedChats.findIndex(c => c._id === newMessageReceived.chat._id);
          if (chatIndex > 0) {
            const [chat] = updatedChats.splice(chatIndex, 1);
            updatedChats.unshift(chat);
          }
          return updatedChats;
        });
      } else {
        setMessages((prev) => [...prev, newMessageReceived]);
      }
    });

    socket.on("added to group", (chat) => {
      setChats((prev) => [chat, ...prev]);
    });

    return () => {
      console.log("Disconnecting socket...");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, setOnlineUsers, setNotification, setChats]);

  // Fetch messages when chat changes
  useEffect(() => {
    if (selectedChat && selectedChat._id) {
      fetchMessages();
      setReplyTo(null);

      setNotification((prev) =>
        prev.filter(n => n.chat._id !== selectedChat._id)
      );
    }
  }, [selectedChat, setNotification]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const scrollToMessage = (messageId) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("highlight-message");
      setTimeout(() => {
        element.classList.remove("highlight-message");
      }, 2000);
    }
  };

  const fetchMessages = async () => {
    if (!selectedChat || !selectedChat._id) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/message/${selectedChat._id}`);
      setMessages(data);
      setLoading(false);

      if (socketRef.current) {
        socketRef.current.emit("join chat", selectedChat._id);
      }
    } catch (error) {
      console.error("Failed to load messages", error);
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`/api/message/${messageId}`);
      setMessages(prev => prev.filter((m) => m._id !== messageId));
    } catch (error) {
      console.error("Failed to delete", error);
      alert("Could not delete message");
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum size is 10MB.");
      return;
    }

    try {
      setUploading(true);

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);

      const { data: uploadData } = await axios.post("/api/upload/file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Send message with file
      const { data } = await axios.post('/api/message', {
        content: "",
        chatId: selectedChat._id,
        file: {
          url: uploadData.url,
          type: uploadData.type,
          name: uploadData.name,
          size: uploadData.size,
        }
      });

      if (socketRef.current) {
        socketRef.current.emit("new message", data);
      }

      setMessages(prev => [...prev, data]);

      setChats((prevChats) => {
        const updatedChats = prevChats.map(c => {
          if (c._id === selectedChat._id) {
            return { ...c, latestMessage: data };
          }
          return c;
        });
        return updatedChats;
      });

      setUploading(false);
    } catch (error) {
      console.error("Failed to upload file", error);
      alert("Failed to upload file");
      setUploading(false);
    }

    // Reset file input
    e.target.value = "";
  };

  const sendMessage = async () => {
    const messageContent = newMessage;
    const replyId = replyTo ? replyTo._id : null;

    if (messageContent.trim() !== '') {
      if (socketRef.current && typingRef.current) {
        socketRef.current.emit("stop typing", selectedChat._id);
        typingRef.current = false;
      }

      try {
        setNewMessage("");
        setReplyTo(null);

        const { data } = await axios.post('/api/message', {
          content: messageContent,
          chatId: selectedChat._id,
          replyTo: replyId
        });

        if (socketRef.current) {
          socketRef.current.emit("new message", data);
        }

        setMessages(prev => [...prev, data]);

        setChats((prevChats) => {
          const updatedChats = prevChats.map(c => {
            if (c._id === selectedChat._id) {
              return { ...c, latestMessage: data };
            }
            return c;
          });
          return updatedChats;
        });
      } catch (error) {
        console.error("Failed to send message", error);
      }
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketRef.current || !socketConnected || !selectedChat) return;

    lastTypingTimeRef.current = new Date().getTime();

    if (!typingRef.current) {
      typingRef.current = true;
      socketRef.current.emit("typing", selectedChat._id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const timerLength = 2000;
    typingTimeoutRef.current = setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTimeRef.current;

      if (timeDiff >= timerLength && typingRef.current && socketRef.current) {
        socketRef.current.emit("stop typing", selectedChat._id);
        typingRef.current = false;
      }
    }, timerLength);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const isUserOnline = useCallback(() => {
    if (!selectedChat || selectedChat.isGroupChat) return false;
    const otherUser = selectedChat.users.find(u => u._id !== user._id);
    return otherUser && onlineUsers && onlineUsers.includes(otherUser._id);
  }, [selectedChat, user, onlineUsers]);

  const getChatName = () => {
    if (!selectedChat) return "";
    if (selectedChat.isGroupChat) return selectedChat.chatName;
    const otherUser = selectedChat.users.find(u => u._id !== user._id);
    return otherUser ? otherUser.name : "Unknown";
  };

  const handleGroupUpdate = (updatedChat) => {
    setChats((prev) => prev.map(c => c._id === updatedChat._id ? updatedChat : c));
    if (selectedChat && selectedChat._id === updatedChat._id) {
      setSelectedChat(updatedChat);
    }
  };

  // Helper to check if we should show sender info (for grouping messages)
  const shouldShowSender = (message, index) => {
    // Don't show for own messages
    if (message.sender._id === user._id) return false;

    // Always show sender for first message
    if (index === 0) return true;

    // Show sender if different from previous message
    const prevMessage = messages[index - 1];
    if (prevMessage.sender._id !== message.sender._id) return true;

    // Also show if there's a time gap of more than 5 minutes
    const prevTime = new Date(prevMessage.createdAt).getTime();
    const currTime = new Date(message.createdAt).getTime();
    if (currTime - prevTime > 5 * 60 * 1000) return true;

    return false;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Render file attachment
  const renderFileAttachment = (file) => {
    if (!file || !file.url) return null;

    if (file.type === 'image') {
      return (
        <div className="message-image">
          <img src={file.url} alt={file.name} onClick={() => window.open(file.url, '_blank')} />
        </div>
      );
    }

    if (file.type === 'video') {
      return (
        <div className="message-video">
          <video src={file.url} controls />
        </div>
      );
    }

    // Document - Add fl_attachment to Cloudinary URL for proper download
    const getDownloadUrl = (url) => {
      // For Cloudinary URLs, add fl_attachment flag
      if (url.includes('cloudinary.com')) {
        // Insert fl_attachment before the file path
        return url.replace('/upload/', '/upload/fl_attachment/');
      }
      return url;
    };

    const downloadUrl = getDownloadUrl(file.url);

    return (
      <a
        href={downloadUrl}
        download={file.name}
        className="message-document"
        onClick={(e) => {
          e.preventDefault();
          // Create a temporary link to force download
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = file.name || 'document';
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }}
      >
        <FontAwesomeIcon icon={faFileAlt} className="doc-icon" />
        <div className="doc-info">
          <span className="doc-name">{file.name}</span>
          <span className="doc-size">{formatFileSize(file.size)}</span>
        </div>
        <FontAwesomeIcon icon={faDownload} className="download-icon" />
      </a>
    );
  };

  if (!selectedChat) {
    return (
      <div className="chat-window" style={{ justifyContent: 'center', alignItems: 'center', opacity: 0.5 }}>
        <h3>Select a user to start chatting</h3>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button className="icon-btn" onClick={() => setSelectedChat("")} style={{ marginRight: 10 }}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <div className="chat-header-info">
          <h3>{getChatName()}</h3>
          {isTyping ? (
            <TypingIndicator />
          ) : selectedChat.isGroupChat ? (
            <span className="user-status" style={{ color: 'var(--text-secondary)' }}>
              {selectedChat.users.length} members
            </span>
          ) : (
            <span
              className="user-status"
              style={{ color: isUserOnline() ? '#22c55e' : 'var(--text-secondary)' }}
            >
              {isUserOnline() ? '● Online' : 'Offline'}
            </span>
          )}
        </div>
        <div className="chat-actions">
          <button className="icon-btn" title="Voice Call (Coming Soon)">
            <FontAwesomeIcon icon={faPhone} />
          </button>
          <button className="icon-btn" title="Video Call (Coming Soon)">
            <FontAwesomeIcon icon={faVideo} />
          </button>
          <button
            className="icon-btn"
            title={selectedChat.isGroupChat ? "Group Info" : "Chat Info"}
            onClick={() => setShowGroupInfo(true)}
          >
            <FontAwesomeIcon icon={faInfoCircle} />
          </button>
        </div>
      </div>

      <div className="messages-container">
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 20 }}>Loading...</div>
        ) : (
          messages.map((m, index) => (
            <div
              key={m._id}
              id={`msg-${m._id}`}
              className={`message ${m.sender._id === user._id ? "sent" : "received"}`}
            >
              {/* Show sender avatar and name for received messages in groups */}
              {shouldShowSender(m, index) && (
                <div className="message-sender">
                  <img src={m.sender.pic} alt="" className="sender-avatar" />
                  <span className="sender-name">{m.sender.name}</span>
                </div>
              )}

              <MessageMenu
                isMyMessage={m.sender._id === user._id}
                onDelete={() => handleDeleteMessage(m._id)}
                onReply={() => setReplyTo(m)}
              />

              {m.replyTo && (
                <div
                  className="message-reply-preview"
                  onClick={() => scrollToMessage(m.replyTo._id)}
                >
                  <span className="reply-sender">{m.replyTo.sender?.name || 'Unknown'}</span>
                  <div className="reply-content">
                    {m.replyTo.content?.substring(0, 50)}
                    {m.replyTo.content?.length > 50 && "..."}
                  </div>
                </div>
              )}

              {/* File attachment */}
              {m.file && m.file.url && renderFileAttachment(m.file)}

              {/* Text content */}
              {m.content && <div className="message-text">{m.content}</div>}

              <span className="message-time">
                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area-wrapper">
        {/* Upload progress indicator */}
        {uploading && (
          <div className="upload-progress">
            <FontAwesomeIcon icon={faSpinner} spin /> Uploading file...
          </div>
        )}

        {replyTo && (
          <div className="reply-banner">
            <div className="reply-info">
              <span className="reply-label">
                Replying to {replyTo.sender._id === user._id ? "yourself" : replyTo.sender.name}
              </span>
              <span className="reply-text">{replyTo.content?.substring(0, 60) || '[File]'}...</span>
            </div>
            <button className="close-reply" onClick={() => setReplyTo(null)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}

        <div className="chat-input-area">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
          />
          <button
            className="icon-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Attach file"
          >
            <FontAwesomeIcon icon={faPaperclip} />
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={typingHandler}
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
          />
          <button className="icon-btn"><FontAwesomeIcon icon={faSmile} /></button>
          <button
            className="icon-btn send-btn"
            onClick={sendMessage}
            disabled={!newMessage.trim()}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
      </div>

      {/* Group/Chat Info Modal */}
      {showGroupInfo && (
        <GroupInfoModal
          chat={selectedChat}
          user={user}
          onClose={() => setShowGroupInfo(false)}
          onUpdate={handleGroupUpdate}
          socket={socketRef.current}
        />
      )}
    </div>
  );
};

export default ChatWindow;