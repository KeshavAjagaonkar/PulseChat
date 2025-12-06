import React from 'react';
// Note: This component assumes SearchWindow.css is imported in SearchWindow, 
// so we don't need a separate CSS file for the list items.

// Dummy data for example
const chats = [
    { name: "Keshav Ajagaonkar", status: "Typing...", online: true, active: false },
    { name: "Project Team", status: "Sent an attachment", online: false, active: true },
    { name: "John Doe", status: "Hey, are we still on?", online: false, active: false },
    { name: "Jane Smith", status: "Received a file", online: true, active: false },
];

const ChatList = () => {
  return (
    <div className="user-list">
      {chats.map((chat, index) => (
        // Apply classes dynamically based on the dummy data
        <div 
          key={index} 
          className={`user-card ${chat.active ? 'active' : ''}`}
        >
          <div className="user-avatar">
            {/* Show online dot conditionally */}
            {chat.online && <span className="online-dot"></span>}
          </div>
          <div className="user-info">
            <div className="user-name">{chat.name}</div>
            <div className="user-status">{chat.status}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatList;