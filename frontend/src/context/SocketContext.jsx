import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { ChatState } from './ChatProvider';

const ENDPOINT = "http://localhost:5000";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user, setOnlineUsers } = ChatState();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!user) {
            // Disconnect if user logs out
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        // Create socket connection
        const newSocket = io(ENDPOINT);
        socketRef.current = newSocket;
        setSocket(newSocket);

        // Setup user
        newSocket.emit("setup", user);

        newSocket.on("connected", () => {
            console.log("Socket connected!");
            setIsConnected(true);
        });

        newSocket.on("online users", (users) => {
            setOnlineUsers(users);
        });

        // Cleanup on unmount
        return () => {
            console.log("Disconnecting socket...");
            newSocket.disconnect();
        };
    }, [user, setOnlineUsers]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
