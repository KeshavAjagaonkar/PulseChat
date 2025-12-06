import React from 'react';
import './NavSidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Import icons for the navigation items
import { faMessage, faUserGroup, faCog, faVideo } from '@fortawesome/free-solid-svg-icons';

function NavSidebar() {
  // Use 'active' class to indicate the currently selected view (e.g., Chats)
  return (
    <div className="nav-sidebar">
      
      {/* Top Section - Navigation */}
      <div className="nav-top">
        <div className="app-logo">C</div> {/* Simple logo placeholder */}
        
        <div className="nav-links">
          {/* Chats - Active */}
          <div className="nav-item active" title="Chats">
            <FontAwesomeIcon icon={faMessage} />
          </div>

          {/* Groups */}
          <div className="nav-item" title="Groups">
            <FontAwesomeIcon icon={faUserGroup} />
          </div>

          {/* Calls/Video (Future proofing) */}
          <div className="nav-item" title="Calls">
            <FontAwesomeIcon icon={faVideo} />
          </div>
        </div>
      </div>
      
      {/* Bottom Section - Settings/User */}
      <div className="nav-bottom">
        <div className="nav-item" title="Settings">
          <FontAwesomeIcon icon={faCog} />
        </div>
        
        {/* User Profile Avatar placeholder */}
        <div className="user-profile-icon"></div> 
      </div>
    </div>
  );
}

export default NavSidebar;