import React from 'react';
import './ChatWindow.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip, faSmile, faPaperPlane, faPhone, faVideo, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

// 1. IMPORT YOUR NEW MENU
import MessageMenu from './MessageMenu'; 

// 2. IMPORT THE NEW TYPING INDICATOR
import TypingIndicator from './TypingIndicator'; 

const ChatWindow = () => {
  
  // Example state for dynamic display (Future use)
  const isUserTyping = true; 
  
  return (
    <div className="chat-window">
      
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <h3>Project Team</h3>
          
          {/* 3. CONDITIONAL RENDER: Use the indicator if someone is typing, otherwise show Online */}
          {isUserTyping ? (
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
        
        {/* --- EXAMPLE MESSAGE 1 --- */}
        <div className="message received">
           {/* 2. ADD THE MENU COMPONENT HERE */}
           <MessageMenu />
           
           <div className="message-text">
             Hello! Has everyone reviewed the latest UI changes?
           </div>
           <span className="message-time">10:30 AM</span>
        </div>

        {/* --- EXAMPLE MESSAGE 2 --- */}
        <div className="message sent">
           <MessageMenu />
           <div className="message-text">
             Yes, I just pushed the new dark theme updates.
           </div>
           <span className="message-time">10:32 AM</span>
        </div>

      </div>

      {/* Input Area (No changes) */}
      <div className="chat-input-area">
        <button className="icon-btn"><FontAwesomeIcon icon={faPaperclip} /></button>
        <input type="text" placeholder="Type a message..." />
        <button className="icon-btn"><FontAwesomeIcon icon={faSmile} /></button>
        <button className="icon-btn send-btn"><FontAwesomeIcon icon={faPaperPlane} /></button>
      </div>

    </div>
  );
};

export default ChatWindow;