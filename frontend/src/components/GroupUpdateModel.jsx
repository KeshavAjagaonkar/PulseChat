import React, { useState } from 'react';
import axios from 'axios';
import { ChatState } from '../context/ChatProvider';
import './SearchWindow.css'; // Reusing user-card styles

// Simple Modal UI
const GroupUpdateModal = ({ chat, onClose, fetchMessages, socket }) => {
  const [groupName, setGroupName] = useState(chat.chatName);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const { user } = ChatState();

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/users?search=${query}`);
      setLoading(false);
      setSearchResults(data);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleAddUser = async (userToAdd) => {
    if (chat.users.find((u) => u._id === userToAdd._id)) {
      alert("User already in group!");
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.put(`/api/chat/groupadd`, {
        chatId: chat._id,
        userId: userToAdd._id,
      });
      
      // Notify the added user via Socket
      socket.emit("add to group", { chat: data, userId: userToAdd._id });
      
      fetchMessages(); // Refresh UI
      setLoading(false);
      alert(`${userToAdd.name} added!`);
      onClose(); // Close modal
    } catch (error) {
      alert("Error adding user");
      setLoading(false);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h3>Group Settings: {chat.chatName}</h3>
        
        {/* Search Input */}
        <input 
            type="text" 
            placeholder="Add User (search name)" 
            className="search-input"
            style={{marginBottom: 15, marginTop: 15}}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
        />

        {/* Results List */}
        <div style={{maxHeight: 200, overflowY: 'auto'}}>
            {loading ? <div>Loading...</div> : (
                searchResults?.slice(0, 4).map(u => (
                    <div key={u._id} className="user-card" onClick={() => handleAddUser(u)} style={{background: 'rgba(255,255,255,0.05)'}}>
                        <img src={u.pic} alt="" style={{width: 30, height: 30, borderRadius: '50%', marginRight: 10}}/>
                        <div style={{color:'white'}}>{u.name}</div>
                    </div>
                ))
            )}
        </div>

        <button onClick={onClose} className="auth-button" style={{marginTop: 20, background: '#444'}}>Close</button>
      </div>
    </div>
  );
};

// Quick inline styles for the modal
const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
};
const modalContentStyle = {
    backgroundColor: '#1e1e1e', padding: 20, borderRadius: 12,
    width: 400, border: '1px solid #333', color: 'white'
};

export default GroupUpdateModal;