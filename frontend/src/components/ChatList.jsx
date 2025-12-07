import React from 'react';
import { ChatState } from '../context/ChatProvider';


const ChatList = ({ results, isSearch, handleFunction, currentUser }) => {
  const { selectedChat, setSelectedChat } = ChatState();

  
  const getSender = (loggedUser, users) => {
    
    if(!users || users.length < 2) return "Unknown User";
    // If user[0] is me, return user[1].name
    return users[0]._id === loggedUser._id ? users[1].name : users[0].name;
  };

  return (
    <div className="user-list">
      {results.map((chatOrUser) => {
        
        
        let displayName = "";
        let displayPic = "";
        
        if (isSearch) {
          // It's a User Object (from search results)
          displayName = chatOrUser.name;
          displayPic = chatOrUser.pic;
        } else {
          // It's a Chat Object (from /api/chat)
          if(chatOrUser.isGroupChat) {
             displayName = chatOrUser.chatName;
             // Use a default group icon or generic pic
             displayPic = "https://cdn-icons-png.flaticon.com/512/166/166258.png";
          } else {
             // 1-on-1: Need to find the "other" person
             // We pass 'currentUser' from parent to help with this
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
                // If search, we pass the User ID. If Chat, we might just set it directly.
                // But SearchWindow's 'accessChat' expects a UserID.
                // Let's handle it:
                if(isSearch) {
                    handleFunction(chatOrUser._id);
                } else {
                    setSelectedChat(chatOrUser);
                }
            }}
          >
            <div className="user-avatar">
               <img src={displayPic} alt="av" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} />
               {/* Online dot logic would go here with Socket.io later */}
            </div>
            <div className="user-info">
              <div className="user-name">{displayName}</div>
              {/* Show latest message only if it's a Chat object */}
              {!isSearch && chatOrUser.latestMessage && (
                <div className="user-status">
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