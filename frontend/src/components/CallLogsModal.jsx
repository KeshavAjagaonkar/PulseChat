import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPhone, faVideo, faPhoneSlash, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { ChatState } from '../context/ChatProvider';
import axios from 'axios';
import './CallLogsModal.css';

const CallLogsModal = ({ onClose }) => {
    const [callLogs, setCallLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = ChatState();

    useEffect(() => {
        fetchCallLogs();
    }, []);

    const fetchCallLogs = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('/api/calls');
            setCallLogs(data);
        } catch (error) {
            console.error('Failed to fetch call logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds || seconds === 0) return '--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins === 0) return `${secs}s`;
        return `${mins}m ${secs}s`;
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const getOtherUser = (log) => {
        return log.caller._id === user._id ? log.callee : log.caller;
    };

    const isOutgoing = (log) => {
        return log.caller._id === user._id;
    };

    const getStatusIcon = (log) => {
        if (log.status === 'missed') {
            return <FontAwesomeIcon icon={faPhoneSlash} className="status-icon missed" />;
        }
        if (log.status === 'rejected') {
            return <FontAwesomeIcon icon={faPhoneSlash} className="status-icon rejected" />;
        }
        if (isOutgoing(log)) {
            return <FontAwesomeIcon icon={faArrowRight} className="status-icon outgoing" />;
        }
        return <FontAwesomeIcon icon={faArrowRight} className="status-icon incoming" style={{ transform: 'rotate(180deg)' }} />;
    };

    const handleDelete = async (logId) => {
        try {
            await axios.delete(`/api/calls/${logId}`);
            setCallLogs(prev => prev.filter(log => log._id !== logId));
        } catch (error) {
            console.error('Failed to delete call log:', error);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content call-logs-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📞 Call History</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="call-logs-list">
                    {loading ? (
                        <div className="loading-state">Loading call history...</div>
                    ) : callLogs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📱</div>
                            <p>No call history yet</p>
                            <span>Your calls will appear here</span>
                        </div>
                    ) : (
                        callLogs.map((log) => {
                            const otherUser = getOtherUser(log);
                            return (
                                <div key={log._id} className={`call-log-item ${log.status}`}>
                                    <div className="call-log-avatar">
                                        <img src={otherUser.pic} alt={otherUser.name} />
                                    </div>

                                    <div className="call-log-info">
                                        <div className="call-log-name">{otherUser.name}</div>
                                        <div className="call-log-details">
                                            {getStatusIcon(log)}
                                            <span className={`call-direction ${isOutgoing(log) ? 'outgoing' : 'incoming'}`}>
                                                {isOutgoing(log) ? 'Outgoing' : 'Incoming'}
                                            </span>
                                            <span className="call-type-badge">
                                                <FontAwesomeIcon icon={log.callType === 'video' ? faVideo : faPhone} />
                                                {log.callType}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="call-log-meta">
                                        <div className="call-time">{formatTime(log.createdAt)}</div>
                                        <div className="call-duration">{formatDuration(log.duration)}</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallLogsModal;
