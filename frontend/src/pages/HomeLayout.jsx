import React from 'react';
// ADJUST THESE PATHS based on where your files actually are.
// If they are in src/ folder, use '../NavSidebar' etc.
import NavSidebar from '../components/NavSidebar.jsx'; 
import SearchWindow from '../components/SearchWindow.jsx'; 
import ChatWindow from '../components/ChatWindow.jsx';

const HomeLayout = () => {
  return (
    // Reuses the main-container class from App.css for consistent Flex layout
    <div className="main-container"> 
      <NavSidebar /> 
      <SearchWindow />
      <ChatWindow />
    </div>
  );
};

export default HomeLayout;