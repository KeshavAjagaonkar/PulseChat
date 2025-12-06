import React from 'react'
import './SearchWindow.css';
import ChatList from './ChatList';

function SearchWindow() {
  return (
    <div className="sidebar">
        
        {/* 1. The Header with Search Input */}
        <div className="sidebar-header">
            <input type="text" placeholder="Search users..." className="search-input" />
        </div>

        <ChatList></ChatList>
    </div>
  )
}

export default SearchWindow;