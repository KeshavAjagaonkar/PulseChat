import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPalette, faBell, faShieldAlt, faSignOutAlt, faCheck, faSpinner, faCamera } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { ChatState } from '../context/ChatProvider';
import axios from 'axios';
import './SettingsModal.css';

const SettingsModal = ({ onClose }) => {
    const { user, setUser, setSelectedChat, setChats } = ChatState();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('appearance');

    // Profile state
    const [displayName, setDisplayName] = useState(user?.name || '');
    const [statusMessage, setStatusMessage] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSaved, setProfileSaved] = useState(false);
    const [uploadingPic, setUploadingPic] = useState(false);

    const fileInputRef = useRef(null);

    // Settings state (stored in localStorage)
    const [settings, setSettings] = useState({
        theme: 'dark',
        accentColor: '#3b82f6',
        messageDensity: 'comfortable',
        desktopNotifications: true,
        soundEffects: true,
        messagePreview: true,
        showOnlineStatus: true,
        readReceipts: true,
        typingIndicator: true,
    });

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('pulsechat_settings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    // Save settings to localStorage whenever they change
    const updateSetting = (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        localStorage.setItem('pulsechat_settings', JSON.stringify(newSettings));
    };

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            localStorage.removeItem("userInfo");
            setUser(null);
            setSelectedChat(null);
            setChats([]);
            onClose();
            navigate("/login");
        }
    };

    const handleProfilePicUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert("Please select an image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("Image too large. Maximum size is 5MB.");
            return;
        }

        try {
            setUploadingPic(true);

            // Upload to Cloudinary
            const formData = new FormData();
            formData.append("image", file);

            const { data: uploadData } = await axios.post("/api/upload/profile-pic", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            // Update user profile with new pic
            const { data } = await axios.put('/api/users/profile', {
                pic: uploadData.url,
            });

            // Update user in context and localStorage
            const updatedUser = { ...user, pic: data.pic };
            setUser(updatedUser);
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));

            setUploadingPic(false);
        } catch (error) {
            console.error("Error uploading profile picture:", error);
            alert("Failed to upload profile picture");
            setUploadingPic(false);
        }

        e.target.value = "";
    };

    const handleSaveProfile = async () => {
        if (!displayName.trim()) {
            alert("Display name cannot be empty");
            return;
        }

        try {
            setProfileLoading(true);
            const { data } = await axios.put('/api/users/profile', {
                name: displayName,
                status: statusMessage,
            });

            // Update user in context and localStorage
            const updatedUser = { ...user, name: data.name, status: data.status };
            setUser(updatedUser);
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));

            setProfileSaved(true);
            setTimeout(() => setProfileSaved(false), 2000);
            setProfileLoading(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile. Please try again.");
            setProfileLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        alert("Account deletion is not implemented yet. Please contact support.");
    };

    const tabs = [
        { id: 'appearance', label: 'Appearance', icon: faPalette },
        { id: 'notifications', label: 'Notifications', icon: faBell },
        { id: 'privacy', label: 'Privacy', icon: faShieldAlt },
    ];

    const colorOptions = [
        { color: '#3b82f6', name: 'Blue' },
        { color: '#8b5cf6', name: 'Purple' },
        { color: '#22c55e', name: 'Green' },
        { color: '#f59e0b', name: 'Amber' },
        { color: '#ef4444', name: 'Red' },
        { color: '#ec4899', name: 'Pink' },
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h2>Settings</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="settings-layout">
                    {/* Sidebar with Profile + Navigation */}
                    <div className="settings-nav">
                        {/* Profile Section at Top */}
                        <div className="settings-profile">
                            <div className="settings-profile-avatar">
                                <img src={user?.pic} alt={user?.name} />
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    onChange={handleProfilePicUpload}
                                />
                                <button
                                    className="change-pic-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingPic}
                                >
                                    {uploadingPic ? (
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                    ) : (
                                        <FontAwesomeIcon icon={faCamera} />
                                    )}
                                </button>
                            </div>
                            <input
                                type="text"
                                className="profile-name-input"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your name"
                            />
                            <span className="profile-email">{user?.email}</span>
                            <button
                                className={`save-profile-btn ${profileSaved ? 'saved' : ''}`}
                                onClick={handleSaveProfile}
                                disabled={profileLoading || displayName === user?.name}
                            >
                                {profileLoading ? (
                                    <FontAwesomeIcon icon={faSpinner} spin />
                                ) : profileSaved ? (
                                    <FontAwesomeIcon icon={faCheck} />
                                ) : (
                                    'Save'
                                )}
                            </button>
                        </div>

                        <div className="nav-divider"></div>

                        {/* Tab Navigation */}
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <FontAwesomeIcon icon={tab.icon} />
                                <span>{tab.label}</span>
                            </button>
                        ))}

                        <button className="settings-nav-item logout" onClick={handleLogout}>
                            <FontAwesomeIcon icon={faSignOutAlt} />
                            <span>Logout</span>
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="settings-content">
                        {/* Appearance Tab */}
                        {activeTab === 'appearance' && (
                            <div className="settings-section">
                                <h3>Appearance</h3>

                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span className="setting-label">Theme</span>
                                        <span className="setting-description">Choose your preferred theme</span>
                                    </div>
                                    <select
                                        className="settings-select"
                                        value={settings.theme}
                                        onChange={(e) => updateSetting('theme', e.target.value)}
                                    >
                                        <option value="dark">Dark</option>
                                        <option value="light" disabled>Light (Coming Soon)</option>
                                    </select>
                                </div>

                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span className="setting-label">Accent Color</span>
                                        <span className="setting-description">Customize your accent color</span>
                                    </div>
                                    <div className="color-options">
                                        {colorOptions.map((opt) => (
                                            <button
                                                key={opt.color}
                                                className={`color-btn ${settings.accentColor === opt.color ? 'active' : ''}`}
                                                style={{ background: opt.color }}
                                                onClick={() => {
                                                    updateSetting('accentColor', opt.color);
                                                    document.documentElement.style.setProperty('--accent-color', opt.color);
                                                }}
                                                title={opt.name}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span className="setting-label">Message Density</span>
                                        <span className="setting-description">Adjust message spacing</span>
                                    </div>
                                    <select
                                        className="settings-select"
                                        value={settings.messageDensity}
                                        onChange={(e) => updateSetting('messageDensity', e.target.value)}
                                    >
                                        <option value="comfortable">Comfortable</option>
                                        <option value="compact">Compact</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="settings-section">
                                <h3>Notifications</h3>

                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span className="setting-label">Desktop Notifications</span>
                                        <span className="setting-description">Show notifications on your desktop</span>
                                    </div>
                                    <label className="toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.desktopNotifications}
                                            onChange={(e) => {
                                                updateSetting('desktopNotifications', e.target.checked);
                                                if (e.target.checked && Notification.permission === 'default') {
                                                    Notification.requestPermission();
                                                }
                                            }}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span className="setting-label">Sound Effects</span>
                                        <span className="setting-description">Play sounds for new messages</span>
                                    </div>
                                    <label className="toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.soundEffects}
                                            onChange={(e) => updateSetting('soundEffects', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span className="setting-label">Message Preview</span>
                                        <span className="setting-description">Show message content in notifications</span>
                                    </div>
                                    <label className="toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.messagePreview}
                                            onChange={(e) => updateSetting('messagePreview', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Privacy Tab */}
                        {activeTab === 'privacy' && (
                            <div className="settings-section">
                                <h3>Privacy & Security</h3>

                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span className="setting-label">Online Status</span>
                                        <span className="setting-description">Show when you're online</span>
                                    </div>
                                    <label className="toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.showOnlineStatus}
                                            onChange={(e) => updateSetting('showOnlineStatus', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span className="setting-label">Read Receipts</span>
                                        <span className="setting-description">Let others know when you've read their messages</span>
                                    </div>
                                    <label className="toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.readReceipts}
                                            onChange={(e) => updateSetting('readReceipts', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span className="setting-label">Typing Indicator</span>
                                        <span className="setting-description">Show when you're typing</span>
                                    </div>
                                    <label className="toggle">
                                        <input
                                            type="checkbox"
                                            checked={settings.typingIndicator}
                                            onChange={(e) => updateSetting('typingIndicator', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="danger-zone">
                                    <h4>Danger Zone</h4>
                                    <button className="danger-btn" onClick={handleDeleteAccount}>
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
