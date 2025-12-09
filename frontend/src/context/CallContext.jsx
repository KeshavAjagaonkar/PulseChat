import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { ChatState } from './ChatProvider';
import { useSocket } from './SocketContext';
import axios from 'axios';

const CallContext = createContext();

export const CallProvider = ({ children }) => {
    const { user } = ChatState();
    const { socket } = useSocket();

    // Call state
    const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'incoming' | 'connected'
    const [callType, setCallType] = useState(null); // 'audio' | 'video'
    const [remoteUser, setRemoteUser] = useState(null);
    const [callDuration, setCallDuration] = useState(0);

    // Media streams
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

    // Control states
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    // WebRTC refs
    const peerConnection = useRef(null);
    const durationInterval = useRef(null);
    const pendingOffer = useRef(null); // Store incoming offer
    const pendingCallerId = useRef(null); // Store caller ID for offer
    const callStartTime = useRef(null);
    const isCaller = useRef(false); // Track if this user initiated the call

    // ICE servers configuration (free STUN servers)
    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
        ],
    };

    // Save call to call log - only called by the caller
    const saveCallLog = useCallback(async (calleeInfo, type, duration, status) => {
        try {
            await axios.post('/api/calls', {
                calleeId: calleeInfo._id, // The person who was called
                callType: type,
                duration: duration,
                status: status, // 'completed' | 'missed' | 'rejected'
            });
        } catch (error) {
            console.error('Failed to save call log:', error);
        }
    }, []);

    // Cleanup function
    const cleanupCall = useCallback((saveLog = false, status = 'completed') => {
        console.log('Cleaning up call...');

        // Calculate duration and save log if needed - ONLY if we are the caller
        if (saveLog && isCaller.current && remoteUser && callStartTime.current) {
            const duration = Math.floor((Date.now() - callStartTime.current) / 1000);
            saveCallLog(remoteUser, callType, duration, status);
        }

        // Stop local stream tracks
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        // Close peer connection
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }

        // Clear duration interval
        if (durationInterval.current) {
            clearInterval(durationInterval.current);
            durationInterval.current = null;
        }

        // Reset refs
        pendingOffer.current = null;
        pendingCallerId.current = null;
        callStartTime.current = null;
        isCaller.current = false;

        // Reset state
        setLocalStream(null);
        setRemoteStream(null);
        setCallState('idle');
        setCallType(null);
        setRemoteUser(null);
        setCallDuration(0);
        setIsMuted(false);
        setIsVideoOff(false);
    }, [localStream, remoteUser, callType, saveCallLog]);

    // Get user media
    const getUserMedia = useCallback(async (type) => {
        try {
            const constraints = {
                audio: true,
                video: type === 'video',
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            return stream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            alert('Could not access camera/microphone. Please check permissions.');
            return null;
        }
    }, []);

    // Create peer connection
    const createPeerConnection = useCallback((stream, remoteUserId) => {
        console.log('Creating peer connection...');
        const pc = new RTCPeerConnection(iceServers);

        // Add local tracks to connection
        stream.getTracks().forEach(track => {
            console.log('Adding track:', track.kind);
            pc.addTrack(track, stream);
        });

        // Handle incoming tracks
        pc.ontrack = (event) => {
            console.log('Received remote track:', event.track.kind);
            console.log('Remote streams:', event.streams);
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && socket && remoteUserId) {
                console.log('Sending ICE candidate');
                socket.emit('webrtc:ice-candidate', {
                    peerId: remoteUserId,
                    candidate: event.candidate,
                });
            }
        };

        // ICE connection state
        pc.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', pc.iceConnectionState);
        };

        // Connection state changes
        pc.onconnectionstatechange = () => {
            console.log('Connection state:', pc.connectionState);
            if (pc.connectionState === 'connected') {
                console.log('WebRTC Connected!');
                setCallState('connected');
                callStartTime.current = Date.now();
                // Start duration timer
                if (!durationInterval.current) {
                    durationInterval.current = setInterval(() => {
                        setCallDuration(prev => prev + 1);
                    }, 1000);
                }
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                console.log('Connection failed/disconnected');
                cleanupCall(true);
            }
        };

        peerConnection.current = pc;
        return pc;
    }, [socket, cleanupCall]);

    // Start a call (CALLER)
    const startCall = useCallback(async (targetUser, type) => {
        if (!socket || !user) return;

        console.log(`Starting ${type} call to ${targetUser.name}`);
        isCaller.current = true; // Mark that we are the caller
        setCallType(type);
        setRemoteUser(targetUser);
        setCallState('calling');

        // Get local media
        const stream = await getUserMedia(type);
        if (!stream) {
            cleanupCall();
            return;
        }
        setLocalStream(stream);

        // Create peer connection
        const pc = createPeerConnection(stream, targetUser._id);

        // Create and send offer
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Notify callee and send offer
            socket.emit('call:initiate', {
                calleeId: targetUser._id,
                callerInfo: {
                    _id: user._id,
                    name: user.name,
                    pic: user.pic,
                },
                callType: type,
                offer: offer, // Include offer in initiate
            });
        } catch (error) {
            console.error('Error creating offer:', error);
            cleanupCall();
        }
    }, [socket, user, getUserMedia, createPeerConnection, cleanupCall]);

    // Accept incoming call (CALLEE)
    const acceptCall = useCallback(async () => {
        if (!socket || !remoteUser || !pendingOffer.current) {
            console.error('Cannot accept call: missing data');
            return;
        }

        console.log('Accepting call from', remoteUser.name);
        setCallState('connecting');

        // Get local media
        const stream = await getUserMedia(callType);
        if (!stream) {
            rejectCall();
            return;
        }
        setLocalStream(stream);

        // Create peer connection
        const pc = createPeerConnection(stream, remoteUser._id);

        try {
            // Set remote description (the offer)
            await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer.current));

            // Create and send answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Send answer to caller
            socket.emit('call:answer', {
                callerId: pendingCallerId.current,
                answer: answer,
            });

            console.log('Sent answer to caller');
        } catch (error) {
            console.error('Error accepting call:', error);
            cleanupCall();
        }
    }, [socket, remoteUser, callType, getUserMedia, createPeerConnection, cleanupCall]);

    // Reject incoming call
    const rejectCall = useCallback(() => {
        if (!socket || !remoteUser) return;

        console.log('Rejecting call from', remoteUser.name);

        socket.emit('call:reject', {
            callerId: remoteUser._id,
        });

        // Save as rejected
        if (remoteUser) {
            saveCallLog(remoteUser, callType, 0, 'rejected');
        }

        cleanupCall();
    }, [socket, remoteUser, callType, saveCallLog, cleanupCall]);

    // End active call
    const endCall = useCallback(() => {
        if (!socket || !remoteUser) {
            cleanupCall();
            return;
        }

        console.log('Ending call with', remoteUser.name);

        socket.emit('call:end', {
            peerId: remoteUser._id,
        });

        cleanupCall(true, 'completed');
    }, [socket, remoteUser, cleanupCall]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    }, [localStream]);

    // Toggle video
    const toggleVideo = useCallback(() => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    }, [localStream]);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        // Handle incoming call (for CALLEE)
        const handleIncomingCall = ({ callerId, callerInfo, callType: type, offer }) => {
            console.log('Incoming call from:', callerInfo.name);

            // Store the offer for when user accepts
            pendingOffer.current = offer;
            pendingCallerId.current = callerId;

            setCallType(type);
            setRemoteUser(callerInfo);
            setCallState('incoming');
        };

        // Handle call answer (for CALLER)
        const handleCallAnswer = async ({ calleeId, answer }) => {
            console.log('Received answer from:', calleeId);

            if (peerConnection.current && peerConnection.current.signalingState !== 'stable') {
                try {
                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
                    console.log('Set remote description (answer)');
                } catch (error) {
                    console.error('Error setting remote description:', error);
                }
            }
        };

        // Handle ICE candidate
        const handleIceCandidate = async ({ senderId, candidate }) => {
            if (peerConnection.current && candidate) {
                try {
                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log('Added ICE candidate');
                } catch (error) {
                    console.error('Error adding ICE candidate:', error);
                }
            }
        };

        // Handle call rejected
        const handleCallRejected = ({ calleeId }) => {
            console.log('Call rejected');
            alert('Call was rejected');
            cleanupCall();
        };

        // Handle call ended
        const handleCallEnded = ({ endedBy, reason }) => {
            console.log('Call ended by:', endedBy, reason);
            cleanupCall(true, 'completed');
        };

        // Handle user offline
        const handleUserOffline = ({ calleeId }) => {
            console.log('User is offline');
            alert('User is offline');
            cleanupCall();
        };

        // Handle user busy
        const handleUserBusy = ({ calleeId }) => {
            console.log('User is busy');
            alert('User is busy on another call');
            cleanupCall();
        };

        socket.on('call:incoming', handleIncomingCall);
        socket.on('call:answer', handleCallAnswer);
        socket.on('webrtc:ice-candidate', handleIceCandidate);
        socket.on('call:rejected', handleCallRejected);
        socket.on('call:ended', handleCallEnded);
        socket.on('call:user-offline', handleUserOffline);
        socket.on('call:user-busy', handleUserBusy);

        return () => {
            socket.off('call:incoming', handleIncomingCall);
            socket.off('call:answer', handleCallAnswer);
            socket.off('webrtc:ice-candidate', handleIceCandidate);
            socket.off('call:rejected', handleCallRejected);
            socket.off('call:ended', handleCallEnded);
            socket.off('call:user-offline', handleUserOffline);
            socket.off('call:user-busy', handleUserBusy);
        };
    }, [socket, cleanupCall]);

    const value = {
        // State
        callState,
        callType,
        remoteUser,
        callDuration,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        // Actions
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
    };

    return (
        <CallContext.Provider value={value}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) {
        throw new Error('useCall must be used within a CallProvider');
    }
    return context;
};
