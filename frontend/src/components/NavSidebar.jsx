import React, { useState } from 'react';
import './NavSidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage, faUserGroup, faCog, faVideo, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { ChatState } from '../context/ChatProvider';
import CreateGroupModal from './CreateGroupModal';
import SettingsModal from './SettingsModal';

function NavSidebar() {
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { user, setUser, setSelectedChat, setChats } = ChatState();
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    setUser(null);
    setSelectedChat(null);
    setChats([]);
    navigate("/login");
  };

  return (
    <>
      <div className="nav-sidebar">
        {/* Top Section - Navigation */}
        <div className="nav-top">
          <div className="app-logo">P</div>

          <div className="nav-links">
            {/* Chats - Active */}
            <div className="nav-item active" title="Chats">
              <FontAwesomeIcon icon={faMessage} />
            </div>

            {/* Create Group */}
            <div
              className="nav-item"
              title="Create Group"
              onClick={() => setShowCreateGroup(true)}
            >
              <FontAwesomeIcon icon={faUserGroup} />
            </div>

            {/* Calls/Video (Future proofing) */}
            <div className="nav-item" title="Calls (Coming Soon)">
              <FontAwesomeIcon icon={faVideo} />
            </div>
          </div>
        </div>

        {/* Bottom Section - Settings/User */}
        <div className="nav-bottom">
          {/* Settings Button */}
          <div
            className="nav-item"
            title="Settings"
            onClick={() => setShowSettings(true)}
          >
            <FontAwesomeIcon icon={faCog} />
          </div>

          {/* Logout Button */}
          <div
            className="nav-item logout-btn"
            title="Logout"
            onClick={handleLogout}
          >
            <FontAwesomeIcon icon={faRightFromBracket} />
          </div>

          {/* User Profile Avatar */}
          {user && (
            <div
              className="user-profile-icon"
              title={user.name}
              onClick={() => setShowSettings(true)}
            >
              <img
                src={user.pic}
                alt={user.name}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}

export default NavSidebar;