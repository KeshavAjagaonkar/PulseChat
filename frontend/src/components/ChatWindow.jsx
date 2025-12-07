import React, { useState, useEffect, useRef } from 'react';
import './ChatWindow.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip, faSmile, faPaperPlane, faPhone, faVideo, faInfoCircle, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import MessageMenu from './MessageMenu'; 
import TypingIndicator from './TypingIndicator'; 
import { ChatState } from '../context/ChatProvider';
import axios from 'axios';
import io from 'socket.io-client';

// GLOBAL SOCKET VARIABLE
const ENDPOINT = "http://localhost:5000"; // Change if deploying
var socket, selectedChatCompare;

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const { user, selectedChat, setSelectedChat, notification, setNotification } = ChatState();
  
  // Ref to auto-scroll to bottom
  const messagesEndRef = useRef(null);

  // 1. INITIALIZE SOCKET (Run once on load)
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

  // 2. FETCH MESSAGES (Run when chat changes)
  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat; // Backup for notification logic
  }, [selectedChat]);

  // 3. LISTEN FOR NEW MESSAGES
  useEffect(() => {
    if (!socket) return;
    socket.on("message received", (newMessageRecieved) => {
      if (
        !selectedChatCompare || 
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        // NOTIFICATION LOGIC
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          // You can also add a visual badge here or play a sound
        }
      } else {
        // WE ARE IN THE CHAT -> ADD MESSAGE
        setMessages([...messages, newMessageRecieved]);
      }
    });
  });

  // Helper: Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => { scrollToBottom() }, [messages, isTyping]);


  const fetchMessages = async () => {
    if (!selectedChat) return;

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

  const sendMessage = async () => {
    // 1. Capture the message text in a local variable immediately
    const messageContent = newMessage;

    if (messageContent.trim() !== '') {
      try {
        // 2. Clear the input field
        setNewMessage(""); 

        // 3. DEBUG: Print exactly what we are sending
        console.log("Attempting to send:", {
            content: messageContent,
            chatId: selectedChat?._id // Use optional chaining to see if ID is missing
        });

        // 4. Send the request using the LOCAL variable, not the state
        const { data } = await axios.post('/api/message', {
          content: messageContent,
          chatId: selectedChat._id,
        });

        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        console.error("Failed to send message", error);
        // Optional: specific error logging
        if (error.response) {
            console.error("Server responded with:", error.response.data);
        }
      }
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    // FIX: Check if socket exists before using it
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
      
      // FIX: Check socket again inside the timeout
      if (timeDiff >= timerLength && typing && socket) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  // --- RENDER LOGIC ---
  
  // If no chat is selected, show a Welcome Placeholder
  if (!selectedChat) {
    return (
      <div className="chat-window" style={{justifyContent:'center', alignItems:'center', opacity:0.5}}>
        <h3>Select a user to start chatting</h3>
      </div>
    );
  }

  return (
    <div className="chat-window">
      
      {/* Header */}
      <div className="chat-header">
        {/* Back Button (Mobile Only usually, but good to have) */}
        <button className="icon-btn" onClick={() => setSelectedChat("")} style={{marginRight:10}}>
             <FontAwesomeIcon icon={faArrowLeft} />
        </button>

        <div className="chat-header-info">
          {/* DYNAMIC NAME */}
          <h3>
             {selectedChat.isGroupChat 
                ? selectedChat.chatName 
                : (selectedChat.users[0]._id === user._id ? selectedChat.users[1].name : selectedChat.users[0].name)
             }
          </h3>
          
          {isTyping ? (
            <TypingIndicator />
          ) : (
            <span className="user-status" style={{color: 'var(--accent-color)'}}>Online</span>
          )}
        </div>
        
        <div className="chat-actions">
           <button className="icon-btn" title="Voice Call"><FontAwesomeIcon icon={faPhone} /></button>
           <button className="icon-btn" title="Video Call"><FontAwesomeIcon icon={faVideo} /></button>
           <button className="icon-btn" title="Details"><FontAwesomeIcon icon={faInfoCircle} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {loading ? (
             <div style={{textAlign:'center', marginTop:20}}>Loading...</div>
        ) : (
             messages.map((m, i) => (
                <div 
                   key={m._id} 
                   className={`message ${m.sender._id === user._id ? "sent" : "received"}`}
                >
                   {/* Only show menu for my messages or if admin (future logic) */}
                   <MessageMenu />
                   
                   <div className="message-text">{m.content}</div>
                   <span className="message-time">
                      {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </span>
                </div>
             ))
        )}
        {/* Invisible div to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
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
  );
};

export default ChatWindow;