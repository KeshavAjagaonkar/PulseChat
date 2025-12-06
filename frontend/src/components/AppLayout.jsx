import React from 'react';
// Import your existing components
import SearchWindow from './SearchWindow'; 
import ChatWindow from './ChatWindow';
// Import the new navigation sidebar
import NavSidebar from './NavSidebar'; 

// IMPORTANT: Assuming you have a global CSS file (like index.css or App.css) 
// that sets up the main dark background and the overall layout.
// For demonstration, let's create a minimal style block here.

const layoutStyle = {
  display: 'flex',
  height: '100vh', 
  width: '100vw',
  color: 'white',
  // You would typically have a background gradient here
  background: 'linear-gradient(135deg, #101010, #0a0a0a)', 
  fontFamily: 'sans-serif'
};

const AppLayout = () => {
  return (
    <div style={layoutStyle}>
      {/* 1. Primary Navigation Sidebar */}
      <NavSidebar /> 
      
      {/* 2. Existing Search/User List Sidebar */}
      <SearchWindow />
      
      {/* 3. Existing Main Chat Window */}
      <ChatWindow />
    </div>
  );
};

export default AppLayout;