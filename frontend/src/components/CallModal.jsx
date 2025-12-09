import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPhone,
    faPhoneSlash,
    faMicrophone,
    faMicrophoneSlash,
    faVideo,
    faVideoSlash,
    faPhoneVolume
} from '@fortawesome/free-solid-svg-icons';
import { useCall } from '../context/CallContext';
import './CallModal.css';

const CallModal = () => {
    const {
        callState,
        callType,
        remoteUser,
        callDuration,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
    } = useCall();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const remoteAudioRef = useRef(null); // For audio-only calls

    // Attach local stream to video element (for video calls)
    useEffect(() => {
        if (localVideoRef.current && localStream && callType === 'video') {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, callType]);

    // Attach remote stream to video element (for video calls)
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream && callType === 'video') {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, callType]);

    // Attach remote stream to audio element (for audio-only calls)
    useEffect(() => {
        if (remoteAudioRef.current && remoteStream && callType === 'audio') {
            console.log('Attaching remote audio stream');
            remoteAudioRef.current.srcObject = remoteStream;
            // Ensure audio plays
            remoteAudioRef.current.play().catch(e => console.log('Audio play error:', e));
        }
    }, [remoteStream, callType]);

    // Format duration
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Don't render if no active call
    if (callState === 'idle') {
        return null;
    }

    return (
        <div className="call-modal-overlay">
            <div className={`call-modal ${callType === 'video' ? 'video-call' : 'audio-call'}`}>

                {/* Hidden audio element for audio-only calls */}
                {callType === 'audio' && (
                    <audio
                        ref={remoteAudioRef}
                        autoPlay
                        playsInline
                        style={{ display: 'none' }}
                    />
                )}

                {/* Video Elements for Video Calls */}
                {callType === 'video' && (
                    <div className="video-container">
                        {/* Remote Video (Full Screen) */}
                        <video
                            ref={remoteVideoRef}
                            className="remote-video"
                            autoPlay
                            playsInline
                        />

                        {/* Local Video (Small) */}
                        <video
                            ref={localVideoRef}
                            className="local-video"
                            autoPlay
                            playsInline
                            muted
                        />

                        {/* Show avatar overlay if video is off */}
                        {isVideoOff && (
                            <div className="video-off-overlay">
                                <img
                                    src={remoteUser?.pic}
                                    alt={remoteUser?.name}
                                    className="call-avatar-large"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Audio Call / Calling / Incoming UI */}
                {(callType === 'audio' || callState === 'calling' || callState === 'incoming') && (
                    <div className="call-info">
                        <img
                            src={remoteUser?.pic}
                            alt={remoteUser?.name}
                            className="call-avatar-large"
                        />
                        <h2 className="call-name">{remoteUser?.name}</h2>

                        {/* Status Text */}
                        <p className="call-status">
                            {callState === 'incoming' && (
                                <>
                                    <FontAwesomeIcon icon={faPhoneVolume} className="ringing-icon" />
                                    Incoming {callType} call...
                                </>
                            )}
                            {callState === 'calling' && 'Calling...'}
                            {callState === 'connecting' && 'Connecting...'}
                            {callState === 'connected' && formatDuration(callDuration)}
                        </p>
                    </div>
                )}

                {/* Call Duration for Video Calls (overlay) */}
                {callType === 'video' && callState === 'connected' && (
                    <div className="call-duration-overlay">
                        {formatDuration(callDuration)}
                    </div>
                )}

                {/* Control Buttons */}
                <div className="call-controls">
                    {/* Incoming Call: Accept/Reject */}
                    {callState === 'incoming' && (
                        <>
                            <button
                                className="call-btn reject-btn"
                                onClick={rejectCall}
                                title="Decline"
                            >
                                <FontAwesomeIcon icon={faPhoneSlash} />
                            </button>
                            <button
                                className="call-btn accept-btn"
                                onClick={acceptCall}
                                title="Accept"
                            >
                                <FontAwesomeIcon icon={faPhone} />
                            </button>
                        </>
                    )}

                    {/* Active Call: Mute, Video Toggle, End */}
                    {(callState === 'calling' || callState === 'connecting' || callState === 'connected') && (
                        <>
                            <button
                                className={`call-btn control-btn ${isMuted ? 'active' : ''}`}
                                onClick={toggleMute}
                                title={isMuted ? 'Unmute' : 'Mute'}
                            >
                                <FontAwesomeIcon icon={isMuted ? faMicrophoneSlash : faMicrophone} />
                            </button>

                            {callType === 'video' && (
                                <button
                                    className={`call-btn control-btn ${isVideoOff ? 'active' : ''}`}
                                    onClick={toggleVideo}
                                    title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                                >
                                    <FontAwesomeIcon icon={isVideoOff ? faVideoSlash : faVideo} />
                                </button>
                            )}

                            <button
                                className="call-btn end-btn"
                                onClick={endCall}
                                title="End call"
                            >
                                <FontAwesomeIcon icon={faPhoneSlash} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallModal;
