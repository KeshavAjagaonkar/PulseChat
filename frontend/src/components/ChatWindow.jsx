import React, { useState, useEffect, useRef } from 'react';
import './ChatWindow.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip, faSmile, faPaperPlane, faPhone, faVideo, faInfoCircle, faArrowLeft, faTimes } from '@fortawesome/free-solid-svg-icons';
import MessageMenu from './MessageMenu'; 
import TypingIndicator from './TypingIndicator'; 
import { ChatState } from '../context/ChatProvider';
import axios from 'axios';
import io from 'socket.io-client';

const ENDPOINT = "http://localhost:5000"; 
var socket, selectedChatCompare;

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const [replyTo, setReplyTo] = useState(null); 

  const { user, selectedChat, setSelectedChat, notification, setNotification } = ChatState();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
    return () => {
      socket.disconnect();
    }
  }, [user]);

  useEffect(() => {
    fetchMessages();
    setReplyTo(null); 
    selectedChatCompare = selectedChat; 
  }, [selectedChat]);

  useEffect(() => {
    if (!socket) return;
    socket.on("message received", (newMessageRecieved) => {
      if (!selectedChatCompare || selectedChatCompare._id !== newMessageRecieved.chat._id) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
        }
      } else {
        setMessages(prev => [...prev, newMessageRecieved]);
      }
    });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Scroll to bottom only when messages change (and not actively scrolling to a reply)
  useEffect(() => { scrollToBottom() }, [messages, isTyping, replyTo]);

  // --- NEW FUNCTION: Scroll to specific message ---
  const scrollToMessage = (messageId) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      // 1. Scroll to the element
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      
      // 2. Add a highlight effect
      element.classList.add("highlight-message");
      
      // 3. Remove highlight after 2 seconds
      setTimeout(() => {
        element.classList.remove("highlight-message");
      }, 2000);
    } else {
      console.warn("Message not found (might be older and not loaded)");
    }
  };

  const fetchMessages = async () => {
    if (!selectedChat || !selectedChat._id) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/message/${selectedChat._id}`);
      setMessages(data);
      setLoading(false);
      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      console.error("Failed to load messages", error);
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
        await axios.delete(`/api/message/${messageId}`);
        setMessages(messages.filter((m) => m._id !== messageId));
    } catch (error) {
        console.error("Failed to delete", error);
        alert("Could not delete message");
    }
  };

  const sendMessage = async () => {
    const messageContent = newMessage;
    const replyId = replyTo ? replyTo._id : null; 

    if (messageContent.trim() !== '') {
      try {
        setNewMessage(""); 
        setReplyTo(null); 

        const { data } = await axios.post('/api/message', {
          content: messageContent,
          chatId: selectedChat._id,
          replyTo: replyId 
        });

        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        console.error("Failed to send message", error);
      }
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !socketConnected) return;
    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing && socket) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  if (!selectedChat) {
    return (
      <div className="chat-window" style={{justifyContent:'center', alignItems:'center', opacity:0.5}}>
        <h3>Select a user to start chatting</h3>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button className="icon-btn" onClick={() => setSelectedChat("")} style={{marginRight:10}}>
             <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <div className="chat-header-info">
          <h3>
             {selectedChat.isGroupChat 
                ? selectedChat.chatName 
                : (selectedChat.users[0]._id === user._id ? selectedChat.users[1].name : selectedChat.users[0].name)
             }
          </h3>
          {isTyping ? <TypingIndicator /> : <span className="user-status" style={{color: 'var(--accent-color)'}}>Online</span>}
        </div>
        <div className="chat-actions">
           <button className="icon-btn"><FontAwesomeIcon icon={faPhone} /></button>
           <button className="icon-btn"><FontAwesomeIcon icon={faVideo} /></button>
           <button className="icon-btn"><FontAwesomeIcon icon={faInfoCircle} /></button>
        </div>
      </div>

      <div className="messages-container">
        {loading ? (
             <div style={{textAlign:'center', marginTop:20}}>Loading...</div>
        ) : (
             messages.map((m, i) => (
                <div 
                   key={m._id}
                   /* ADDED ID HERE for scrolling targeting */
                   id={`msg-${m._id}`} 
                   className={`message ${m.sender._id === user._id ? "sent" : "received"}`}
                >
                   <MessageMenu 
                      isMyMessage={m.sender._id === user._id}
                      onDelete={() => handleDeleteMessage(m._id)}
                      onReply={() => setReplyTo(m)}
                   />
                   
                   {m.replyTo && (
                     <div 
                       className="message-reply-preview"
                       /* ADDED ON CLICK HERE */
                       onClick={() => scrollToMessage(m.replyTo._id)}
                     >
                        <span className="reply-sender">{m.replyTo.sender.name}</span>
                        <div className="reply-content">
                            {m.replyTo.content.substring(0, 50)}
                            {m.replyTo.content.length > 50 && "..."}
                        </div>
                     </div>
                   )}

                   <div className="message-text">{m.content}</div>
                   <span className="message-time">
                      {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </span>
                </div>
             ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area-wrapper">
        {replyTo && (
          <div className="reply-banner">
             <div className="reply-info">
                <span className="reply-label">Replying to {replyTo.sender._id === user._id ? "yourself" : replyTo.sender.name}</span>
                <span className="reply-text">{replyTo.content.substring(0, 60)}...</span>
             </div>
             <button className="close-reply" onClick={() => setReplyTo(null)}>
                <FontAwesomeIcon icon={faTimes} />
             </button>
          </div>
        )}

        <div className="chat-input-area">
          <button className="icon-btn"><FontAwesomeIcon icon={faPaperclip} /></button>
          <input 
              type="text" 
              placeholder="Type a message..." 
              value={newMessage}  
              onChange={typingHandler} 
              onKeyDown={(e)=>{if(e.key==='Enter') sendMessage()}} 
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
    </div>
  );
};

export default ChatWindow;