import React from 'react';
import { ChatState } from '../context/ChatProvider';
import '../components/SearchWindow.css';

const ChatList = ({ results, isSearch, handleFunction, currentUser, loading }) => {
  const { selectedChat, setSelectedChat, notification } = ChatState();

  // Show empty state message
  if (!loading && results.length === 0) {
    return (
      <div className="user-list">
        <div className="empty-state-message">
          {isSearch ? (
            <>
              <span className="empty-icon">🔍</span>
              <p>No users found</p>
            </>
          ) : (
            <>
              <span className="empty-icon">💬</span>
              <p>No chats yet</p>
              <span className="empty-hint">Search for users to start chatting</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="user-list">
      {results.map((chatOrUser) => {
        let displayName = "";
        let displayPic = "";

        // Calculate unread notifications for this chat
        const unreadCount = !isSearch
          ? notification.filter(n => n.chat._id === chatOrUser._id).length
          : 0;

        if (isSearch) {
          displayName = chatOrUser.name;
          displayPic = chatOrUser.pic;
        } else {
          if (chatOrUser.isGroupChat) {
            displayName = chatOrUser.chatName;
            displayPic = "https://cdn-icons-png.flaticon.com/512/166/166258.png";
          } else {
            if (currentUser && chatOrUser.users) {
              const otherUser = chatOrUser.users.find(u => u._id !== currentUser._id);
              displayName = otherUser ? otherUser.name : "User";
              displayPic = otherUser ? otherUser.pic : "";
            }
          }
        }

        // Get latest message preview - WhatsApp style
        const getLatestMessagePreview = () => {
          const msg = chatOrUser.latestMessage;
          if (!msg) return null;

          if (msg.content) {
            return (
              <>
                {msg.content.substring(0, 30)}
                {msg.content.length > 30 && "..."}
              </>
            );
          }

          // WhatsApp-style file preview - clean icons
          if (msg.file) {
            const fileType = msg.file.type || 'document';
            if (fileType === 'image') {
              return <span className="file-preview">📷 Photo</span>;
            } else if (fileType === 'video') {
              return <span className="file-preview">🎬 Video</span>;
            } else {
              return <span className="file-preview">📎 Document</span>;
            }
          }

          return <span className="empty-preview">Start chatting</span>;
        };

        return (
          <div
            key={chatOrUser._id}
            className={`user-card ${!isSearch && selectedChat?._id === chatOrUser._id ? 'active' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`}
            onClick={() => {
              if (isSearch) {
                handleFunction(chatOrUser._id);
              } else {
                setSelectedChat(chatOrUser);
              }
            }}
          >
            <div className="user-avatar">
              <img src={displayPic} alt="av" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />

              {unreadCount > 0 && (
                <div className="notification-dot">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </div>

            <div className="user-info">
              <div className="user-name">{displayName}</div>

              {!isSearch && chatOrUser.latestMessage && (
                <div className={`user-status ${unreadCount > 0 ? 'unread-bold' : ''}`}>
                  {unreadCount > 0 ? <span style={{ color: '#3b82f6', marginRight: '4px' }}>New:</span> : ''}
                  {getLatestMessagePreview()}
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