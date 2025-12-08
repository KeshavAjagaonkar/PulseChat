import React, { useState } from 'react';
import axios from 'axios';
import { ChatState } from '../context/ChatProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus, faUsers } from '@fortawesome/free-solid-svg-icons';
import './CreateGroupModal.css';

const CreateGroupModal = ({ onClose }) => {
    const [groupName, setGroupName] = useState("");
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    const { user, chats, setChats, setSelectedChat } = ChatState();

    // Search for users
    const handleSearch = async (query) => {
        setSearch(query);
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            setLoading(true);
            const { data } = await axios.get(`/api/users?search=${query}`);
            // Filter out already selected users
            const filtered = data.filter(
                (u) => !selectedUsers.some((sel) => sel._id === u._id)
            );
            setSearchResults(filtered);
            setLoading(false);
        } catch (error) {
            console.error("Error searching users:", error);
            setLoading(false);
        }
    };

    // Add user to selected list
    const handleAddUser = (userToAdd) => {
        if (selectedUsers.some((u) => u._id === userToAdd._id)) {
            return; // Already selected
        }
        setSelectedUsers([...selectedUsers, userToAdd]);
        setSearchResults(searchResults.filter((u) => u._id !== userToAdd._id));
        setSearch("");
    };

    // Remove user from selected list
    const handleRemoveUser = (userToRemove) => {
        setSelectedUsers(selectedUsers.filter((u) => u._id !== userToRemove._id));
    };

    // Create the group
    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            alert("Please enter a group name");
            return;
        }
        if (selectedUsers.length < 2) {
            alert("Please select at least 2 users for a group");
            return;
        }

        try {
            setCreating(true);
            const { data } = await axios.post("/api/chat/group", {
                name: groupName,
                users: JSON.stringify(selectedUsers.map((u) => u._id)),
            });

            // Add new group to chats list
            setChats([data, ...chats]);
            // Open the new group chat
            setSelectedChat(data);

            setCreating(false);
            onClose();
        } catch (error) {
            console.error("Error creating group:", error);
            alert("Failed to create group. Please try again.");
            setCreating(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-title">
                        <FontAwesomeIcon icon={faUsers} className="modal-icon" />
                        <h2>Create New Group</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Group Name Input */}
                <div className="form-group">
                    <label>Group Name</label>
                    <input
                        type="text"
                        placeholder="Enter group name..."
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="form-input"
                    />
                </div>

                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                    <div className="selected-users">
                        {selectedUsers.map((u) => (
                            <div key={u._id} className="selected-user-badge">
                                <img src={u.pic} alt="" className="badge-avatar" />
                                <span>{u.name}</span>
                                <button
                                    className="remove-badge"
                                    onClick={() => handleRemoveUser(u)}
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Search Users */}
                <div className="form-group">
                    <label>Add Members ({selectedUsers.length} selected)</label>
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="form-input"
                    />
                </div>

                {/* Search Results */}
                <div className="search-results">
                    {loading ? (
                        <div className="loading-text">Searching...</div>
                    ) : (
                        searchResults.slice(0, 4).map((u) => (
                            <div
                                key={u._id}
                                className="search-result-item"
                                onClick={() => handleAddUser(u)}
                            >
                                <img src={u.pic} alt="" className="result-avatar" />
                                <div className="result-info">
                                    <div className="result-name">{u.name}</div>
                                    <div className="result-email">{u.email}</div>
                                </div>
                                <FontAwesomeIcon icon={faPlus} className="add-icon" />
                            </div>
                        ))
                    )}
                </div>

                {/* Create Button */}
                <button
                    className="create-group-btn"
                    onClick={handleCreateGroup}
                    disabled={creating || !groupName.trim() || selectedUsers.length < 2}
                >
                    {creating ? "Creating..." : "Create Group"}
                </button>
            </div>
        </div>
    );
};

export default CreateGroupModal;
