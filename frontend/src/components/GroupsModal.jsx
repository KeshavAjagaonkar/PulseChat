import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus, faUsers, faChevronRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { ChatState } from '../context/ChatProvider';
import CreateGroupModal from './CreateGroupModal';
import './GroupsModal.css';

const GroupsModal = ({ onClose }) => {
    const { user, chats, setSelectedChat, setChats } = ChatState();
    const [showCreateGroup, setShowCreateGroup] = useState(false);

    // Filter only group chats
    const groupChats = chats.filter(chat => chat.isGroupChat);

    // Check if current user is admin of a group
    const isUserAdmin = (group) => {
        if (!group.groupAdmin || !user) return false;
        // groupAdmin might be an object or just an ID
        const adminId = group.groupAdmin._id || group.groupAdmin;
        return adminId === user._id;
    };

    const handleSelectGroup = (group) => {
        setSelectedChat(group);
        onClose();
    };

    // When a new group is created, go back to the groups list
    const handleGroupCreated = () => {
        setShowCreateGroup(false);
    };

    // Show Create Group Modal
    if (showCreateGroup) {
        return (
            <div className="modal-overlay" onClick={() => setShowCreateGroup(false)}>
                <div className="modal-content groups-modal" onClick={(e) => e.stopPropagation()}>
                    {/* Header with back button */}
                    <div className="modal-header">
                        <div className="header-with-back">
                            <button
                                className="back-btn"
                                onClick={() => setShowCreateGroup(false)}
                                title="Back to Groups"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} />
                            </button>
                            <h2>Create Group</h2>
                        </div>
                        <button className="close-btn" onClick={onClose}>
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    {/* Create Group Form inline */}
                    <CreateGroupForm onClose={handleGroupCreated} onFullClose={onClose} />
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content groups-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h2>Groups</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Create Group Button */}
                <div className="groups-actions">
                    <button
                        className="create-group-btn"
                        onClick={() => setShowCreateGroup(true)}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        <span>Create New Group</span>
                    </button>
                </div>

                {/* Groups List */}
                <div className="groups-list">
                    {groupChats.length === 0 ? (
                        <div className="no-groups">
                            <FontAwesomeIcon icon={faUsers} className="no-groups-icon" />
                            <p>No groups yet</p>
                            <span>Create a group to start chatting with multiple people</span>
                        </div>
                    ) : (
                        groupChats.map((group) => (
                            <div
                                key={group._id}
                                className="group-card"
                                onClick={() => handleSelectGroup(group)}
                            >
                                <div className="group-avatar">
                                    <img
                                        src="https://cdn-icons-png.flaticon.com/512/166/166258.png"
                                        alt={group.chatName}
                                    />
                                </div>
                                <div className="group-info">
                                    <div className="group-name">
                                        {group.chatName}
                                    </div>
                                    <div className="group-meta">
                                        {isUserAdmin(group) && (
                                            <span className="admin-tag">Admin</span>
                                        )}
                                        <span className="member-count">
                                            {group.users?.length || 0} members
                                        </span>
                                    </div>
                                </div>
                                <FontAwesomeIcon icon={faChevronRight} className="group-arrow" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// Inline Create Group Form Component
const CreateGroupForm = ({ onClose, onFullClose }) => {
    const { user, chats, setChats, setSelectedChat } = ChatState();
    const [groupName, setGroupName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    // Search users
    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            setSearching(true);
            const response = await fetch(`/api/users?search=${query}`);
            const data = await response.json();
            setSearchResults(data);
            setSearching(false);
        } catch (error) {
            console.error('Search error:', error);
            setSearching(false);
        }
    };

    // Add user to selection
    const addUser = (userToAdd) => {
        if (!selectedUsers.find(u => u._id === userToAdd._id)) {
            setSelectedUsers([...selectedUsers, userToAdd]);
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    // Remove user from selection
    const removeUser = (userId) => {
        setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
    };

    // Create the group
    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            alert('Please enter a group name');
            return;
        }
        if (selectedUsers.length < 1) {
            alert('Please add at least one member');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/chat/group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: groupName,
                    users: JSON.stringify(selectedUsers.map(u => u._id))
                })
            });

            const data = await response.json();
            setChats([data, ...chats]);
            setSelectedChat(data);
            setLoading(false);
            onFullClose(); // Close everything and go to the new group
        } catch (error) {
            console.error('Create group error:', error);
            alert('Failed to create group');
            setLoading(false);
        }
    };

    return (
        <div className="create-group-form">
            {/* Group Name Input */}
            <div className="form-section">
                <label>Group Name</label>
                <input
                    type="text"
                    placeholder="Enter group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="group-name-input"
                />
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
                <div className="form-section">
                    <label>Selected Members ({selectedUsers.length})</label>
                    <div className="selected-users">
                        {selectedUsers.map(u => (
                            <div key={u._id} className="selected-user-chip">
                                <img src={u.pic} alt={u.name} />
                                <span>{u.name}</span>
                                <button onClick={() => removeUser(u._id)}>&times;</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search Users */}
            <div className="form-section">
                <label>Add Members</label>
                <input
                    type="text"
                    placeholder="Search users by name or email"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="user-search-input"
                />

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="search-results">
                        {searchResults.map(u => (
                            <div
                                key={u._id}
                                className="search-result-item"
                                onClick={() => addUser(u)}
                            >
                                <img src={u.pic} alt={u.name} />
                                <div className="result-info">
                                    <span className="result-name">{u.name}</span>
                                    <span className="result-email">{u.email}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {searching && <div className="searching">Searching...</div>}
            </div>

            {/* Create Button */}
            <button
                className="create-btn"
                onClick={handleCreateGroup}
                disabled={loading || !groupName.trim() || selectedUsers.length < 1}
            >
                {loading ? 'Creating...' : 'Create Group'}
            </button>
        </div>
    );
};

export default GroupsModal;
