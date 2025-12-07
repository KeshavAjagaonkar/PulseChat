import React from 'react';
import NavSidebar from '../components/NavSidebar.jsx'; 
import SearchWindow from '../components/SearchWindow.jsx'; 
import ChatWindow from '../components/ChatWindow.jsx';
import { ChatState } from '../context/ChatProvider'; // 1. Import Context

const HomeLayout = () => {
  const { selectedChat } = ChatState(); // 2. Get selectedChat state

  return (
    // 3. Add a conditional class 'chat-selected' if a chat is active
    <div className={`main-container ${selectedChat ? 'chat-selected' : ''}`}> 
      <NavSidebar /> 
      <SearchWindow />
      <ChatWindow />
    </div>
  );
};

export default HomeLayout;