import React, { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUserMinus, faCrown, faUser, faSearch, faPlus, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { ChatState } from '../context/ChatProvider';
import './GroupInfoModal.css';

const GroupInfoModal = ({ chat, user, onClose, onUpdate, socket }) => {
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    const { setSelectedChat, setChats, chats } = ChatState();

    const isAdmin = chat.groupAdmin && chat.groupAdmin._id === user._id;
    const isGroupChat = chat.isGroupChat;

    // Get the other user for 1-on-1 chats
    const getOtherUser = () => {
        if (isGroupChat) return null;
        return chat.users.find(u => u._id !== user._id);
    };

    // Search for users to add
    const handleSearch = async (query) => {
        setSearch(query);
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            setLoading(true);
            const { data } = await axios.get(`/api/users?search=${query}`);
            // Filter out users already in the group
            const filtered = data.filter(
                (u) => !chat.users.some((member) => member._id === u._id)
            );
            setSearchResults(filtered);
            setLoading(false);
        } catch (error) {
            console.error("Error searching users:", error);
            setLoading(false);
        }
    };

    // Add user to group (admin only)
    const handleAddUser = async (userToAdd) => {
        if (!isAdmin) return;

        try {
            setActionLoading(userToAdd._id);
            const { data } = await axios.put('/api/chat/groupadd', {
                chatId: chat._id,
                userId: userToAdd._id,
            });

            // Notify via socket
            if (socket) {
                socket.emit("add to group", { chat: data, userId: userToAdd._id });
            }

            onUpdate(data);
            setSearch("");
            setSearchResults([]);
            setActionLoading(null);
        } catch (error) {
            console.error("Error adding user:", error);
            alert("Failed to add user");
            setActionLoading(null);
        }
    };

    // Remove user from group (admin only)
    const handleRemoveUser = async (userToRemove) => {
        if (!isAdmin) return;
        if (userToRemove._id === user._id) {
            alert("You cannot remove yourself. Use 'Leave Group' instead.");
            return;
        }

        if (!window.confirm(`Remove ${userToRemove.name} from the group?`)) return;

        try {
            setActionLoading(userToRemove._id);
            const { data } = await axios.put('/api/chat/groupremove', {
                chatId: chat._id,
                userId: userToRemove._id,
            });

            onUpdate(data);
            setActionLoading(null);
        } catch (error) {
            console.error("Error removing user:", error);
            alert("Failed to remove user");
            setActionLoading(null);
        }
    };

    // Leave group (for any member including admin)
    const handleLeaveGroup = async () => {
        if (!window.confirm("Are you sure you want to leave this group?")) return;

        try {
            setActionLoading('leave');
            await axios.put('/api/chat/groupremove', {
                chatId: chat._id,
                userId: user._id,
            });

            // Remove this chat from the chats list
            setChats(prev => prev.filter(c => c._id !== chat._id));

            // Deselect the chat
            setSelectedChat(null);

            // Close the modal
            onClose();

            setActionLoading(null);
        } catch (error) {
            console.error("Error leaving group:", error);
            alert("Failed to leave group");
            setActionLoading(null);
        }
    };

    const otherUser = getOtherUser();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content group-info-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h2>{isGroupChat ? 'Group Info' : 'Chat Info'}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Chat/Group Avatar and Name */}
                <div className="info-header">
                    <div className="info-avatar">
                        {isGroupChat ? (
                            <div className="group-avatar">
                                <span>{chat.chatName.charAt(0).toUpperCase()}</span>
                            </div>
                        ) : (
                            <img src={otherUser?.pic} alt={otherUser?.name} />
                        )}
                    </div>
                    <div className="info-details">
                        <h3>{isGroupChat ? chat.chatName : otherUser?.name}</h3>
                        {isGroupChat && (
                            <p className="member-count">{chat.users.length} members</p>
                        )}
                        {!isGroupChat && otherUser && (
                            <p className="user-email">{otherUser.email}</p>
                        )}
                    </div>
                </div>

                {/* Group Admin Info */}
                {isGroupChat && chat.groupAdmin && (
                    <div className="admin-section">
                        <div className="section-title">
                            <FontAwesomeIcon icon={faCrown} className="crown-icon" />
                            <span>Group Admin</span>
                        </div>
                        <div className="admin-info">
                            <img src={chat.groupAdmin.pic} alt="" className="admin-avatar" />
                            <span>{chat.groupAdmin.name}</span>
                            {isAdmin && <span className="you-badge">You</span>}
                        </div>
                    </div>
                )}

                {/* Members List (Group only) */}
                {isGroupChat && (
                    <div className="members-section">
                        <div className="section-title">
                            <FontAwesomeIcon icon={faUser} />
                            <span>Members ({chat.users.length})</span>
                        </div>
                        <div className="members-list">
                            {chat.users.map((member) => (
                                <div key={member._id} className="member-item">
                                    <img src={member.pic} alt="" className="member-avatar" />
                                    <div className="member-info">
                                        <span className="member-name">
                                            {member.name}
                                            {member._id === user._id && <span className="you-tag"> (You)</span>}
                                            {member._id === chat.groupAdmin?._id && (
                                                <FontAwesomeIcon icon={faCrown} className="admin-crown" />
                                            )}
                                        </span>
                                        <span className="member-email">{member.email}</span>
                                    </div>
                                    {/* Remove button (admin only, can't remove self or other admin) */}
                                    {isAdmin && member._id !== user._id && member._id !== chat.groupAdmin?._id && (
                                        <button
                                            className="remove-member-btn"
                                            onClick={() => handleRemoveUser(member)}
                                            disabled={actionLoading === member._id}
                                            title="Remove from group"
                                        >
                                            {actionLoading === member._id ? (
                                                <span className="loading-spinner">...</span>
                                            ) : (
                                                <FontAwesomeIcon icon={faUserMinus} />
                                            )}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Add Members (Admin only) */}
                {isGroupChat && isAdmin && (
                    <div className="add-member-section">
                        <div className="section-title">
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Add Members</span>
                        </div>
                        <div className="search-wrapper">
                            <FontAwesomeIcon icon={faSearch} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search users to add..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        {loading && <div className="loading-text">Searching...</div>}
                        <div className="search-results">
                            {searchResults.slice(0, 4).map((u) => (
                                <div
                                    key={u._id}
                                    className="search-result-item"
                                    onClick={() => handleAddUser(u)}
                                >
                                    <img src={u.pic} alt="" className="result-avatar" />
                                    <div className="result-info">
                                        <span className="result-name">{u.name}</span>
                                        <span className="result-email">{u.email}</span>
                                    </div>
                                    <button
                                        className="add-btn"
                                        disabled={actionLoading === u._id}
                                    >
                                        {actionLoading === u._id ? '...' : <FontAwesomeIcon icon={faPlus} />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Leave Group Button (for all members) */}
                {isGroupChat && (
                    <button
                        className="leave-group-btn"
                        onClick={handleLeaveGroup}
                        disabled={actionLoading === 'leave'}
                    >
                        <FontAwesomeIcon icon={faSignOutAlt} />
                        {actionLoading === 'leave' ? 'Leaving...' : 'Leave Group'}
                    </button>
                )}

                {/* 1-on-1 Chat Info */}
                {!isGroupChat && otherUser && (
                    <div className="user-info-section">
                        <div className="info-row">
                            <span className="info-label">Email</span>
                            <span className="info-value">{otherUser.email}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Joined</span>
                            <span className="info-value">
                                {new Date(otherUser.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupInfoModal;
