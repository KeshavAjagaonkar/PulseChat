import React from 'react';
import { ChatState } from '../context/ChatProvider';
// Import the CSS where we defined .notification-dot and .unread-bold
import '../components/SearchWindow.css'; 

const ChatList = ({ results, isSearch, handleFunction, currentUser }) => {
  // 1. Get notification state from Context
  const { selectedChat, setSelectedChat, notification } = ChatState();

  return (
    <div className="user-list">
      {results.map((chatOrUser) => {
        let displayName = "";
        let displayPic = "";
        
        // 2. LOGIC: Calculate unread notifications for this specific chat
        // We filter the global notification array to find messages belonging to THIS chat
        const unreadCount = !isSearch 
            ? notification.filter(n => n.chat._id === chatOrUser._id).length 
            : 0;
        
        if (isSearch) {
          // It's a User Object (from search results)
          displayName = chatOrUser.name;
          displayPic = chatOrUser.pic;
        } else {
          //It's a Chat Object (from /api/chat)
          if(chatOrUser.isGroupChat) {
             displayName = chatOrUser.chatName;
             displayPic = "https://cdn-icons-png.flaticon.com/512/166/166258.png";
          } else {
             // 1-on-1 Logic
             if(currentUser && chatOrUser.users) {
               const otherUser = chatOrUser.users.find(u => u._id !== currentUser._id);
               displayName = otherUser ? otherUser.name : "User";
               displayPic = otherUser ? otherUser.pic : "";
             }
          }
        }

        return (
          <div 
            key={chatOrUser._id} 
            className={`user-card ${!isSearch && selectedChat === chatOrUser ? 'active' : ''}`}
            onClick={() => {
                if(isSearch) {
                    handleFunction(chatOrUser._id);
                } else {
                    setSelectedChat(chatOrUser);
                }
            }}
          >
            <div className="user-avatar">
               <img src={displayPic} alt="av" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} />
               
               {/* 3. RENDER: The Red Notification Dot */}
               {unreadCount > 0 && (
                 <div className="notification-dot">
                   {unreadCount > 9 ? '9+' : unreadCount}
                 </div>
               )}
            </div>
            
            <div className="user-info">
              <div className="user-name">{displayName}</div>
              
              {!isSearch && chatOrUser.latestMessage && (
                // 4. STYLE: Apply bold style if unread
                <div className={`user-status ${unreadCount > 0 ? 'unread-bold' : ''}`}>
                   {/* If unread, add a "New:" prefix in blue */}
                   {unreadCount > 0 ? <span style={{color: '#3b82f6', marginRight: '4px'}}>New:</span> : ''}
                   
                   {chatOrUser.latestMessage.content.substring(0, 30)}
                   {chatOrUser.latestMessage.content.length > 30 && "..."}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatList;