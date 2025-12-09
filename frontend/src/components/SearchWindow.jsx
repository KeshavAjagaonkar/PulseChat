import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SearchWindow.css';
import ChatList from './ChatList';
import { ChatState } from '../context/ChatProvider';

function SearchWindow() {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);

  const { user, setSelectedChat, chats, setChats } = ChatState();

  // 1. Function to search for users
  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) return;

    try {
      setLoading(true);
      // We don't need to manually send the token because 
      // the browser sends the HttpOnly cookie automatically!
      const { data } = await axios.get(`/api/users?search=${query}`);
      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      console.error("Error fetching search results", error);
      setLoading(false);
    }
  };

  // 2. Function to access (or create) a chat
  const accessChat = async (userId) => {
    try {
      const config = {
        headers: { "Content-type": "application/json" },
      };

      const { data } = await axios.post(`/api/chat`, { userId }, config);

      // If the chat isn't already in our list, add it
      if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);

      setSelectedChat(data); // Opens the chat window
      setSearch(""); // Clear search
      setSearchResult([]); // Clear results
    } catch (error) {
      console.error("Error creating chat", error);
    }
  };

  // 3. Fetch my chats on load
  const fetchChats = async () => {
    try {
      const { data } = await axios.get("/api/chat");
      setChats(data);
    } catch (error) {
      console.error("Error fetching chats", error);
    }
  };

  useEffect(() => {
    // Only fetch if user is logged in
    if (user) fetchChats();
  }, [user]); // Runs when user logs in

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <input
          type="text"
          placeholder="Search users..."
          className="search-input"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Pass logic down to the List */}
      <ChatList
        results={search ? searchResult : chats} // Show search results OR my chats
        isSearch={!!search} // Boolean to tell the list how to render
        handleFunction={accessChat} // What happens when clicked
        currentUser={user}
        loading={loading}
      />
    </div>
  )
}

export default SearchWindow;