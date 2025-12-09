import React from 'react';
import NavSidebar from '../components/NavSidebar.jsx';
import SearchWindow from '../components/SearchWindow.jsx';
import ChatWindow from '../components/ChatWindow.jsx';
import CallModal from '../components/CallModal.jsx';
import { ChatState } from '../context/ChatProvider';
import { SocketProvider } from '../context/SocketContext';
import { CallProvider } from '../context/CallContext';

const HomeLayout = () => {
  const { selectedChat } = ChatState();

  return (
    <SocketProvider>
      <CallProvider>
        {/* Main Chat Container */}
        <div className={`main-container ${selectedChat ? 'chat-selected' : ''}`}>
          <NavSidebar />
          <SearchWindow />
          <ChatWindow />
        </div>

        {/* Call Modal - Always rendered, shows when call is active */}
        <CallModal />
      </CallProvider>
    </SocketProvider>
  );
};

export default HomeLayout;