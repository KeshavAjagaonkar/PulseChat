import { Server } from "socket.io";

// Track online users: { odId: socketId }
const onlineUsers = new Map();

// Track active calls: { odId: { peerId, callType } }
const activeCalls = new Map();

const initSocket = (server) => {
  const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Connected to socket.io:", socket.id);

    // A. SETUP: User logs in and joins their own personal room
    socket.on("setup", (userData) => {
      if (!userData || !userData._id) {
        console.log("Socket setup failed: No user data received");
        return;
      }

      // Store user data on socket instance for cleanup
      socket.userData = userData;
      socket.join(userData._id);

      // Track user as online
      onlineUsers.set(userData._id, socket.id);

      console.log("User Joined Room:", userData._id);
      console.log("Online Users:", Array.from(onlineUsers.keys()));

      // Emit connected confirmation
      socket.emit("connected");

      // Broadcast online users list to all connected clients
      io.emit("online users", Array.from(onlineUsers.keys()));
    });

    // B. JOIN CHAT: User clicks on a chat
    socket.on("join chat", (room) => {
      socket.join(room);
      console.log("User Joined Chat:", room);
    });

    // C. TYPING: User starts/stops typing
    socket.on("typing", (room) => {
      socket.in(room).emit("typing");
    });

    socket.on("stop typing", (room) => {
      socket.in(room).emit("stop typing");
    });

    // D. NEW MESSAGE: User sends a message
    socket.on("new message", (newMessageReceived) => {
      const chat = newMessageReceived.chat;

      if (!chat || !chat.users) {
        console.log("chat.users not defined");
        return;
      }

      // Send to all users in the chat except sender
      chat.users.forEach((user) => {
        if (user._id === newMessageReceived.sender._id) return;
        socket.in(user._id).emit("message received", newMessageReceived);
      });
    });

    // E. GROUP MANAGEMENT
    socket.on("add to group", ({ chat, userId }) => {
      // Notify the specific user they've been added
      socket.in(userId).emit("added to group", chat);
    });

    // ============================================
    // F. WEBRTC CALLING SIGNALING
    // ============================================

    // F1. Initiate a call (includes offer)
    socket.on("call:initiate", ({ calleeId, callerInfo, callType, offer }) => {
      console.log(`Call initiated: ${callerInfo.name} -> ${calleeId} (${callType})`);

      // Check if callee is online
      const calleeSocketId = onlineUsers.get(calleeId);
      if (!calleeSocketId) {
        socket.emit("call:user-offline", { calleeId });
        return;
      }

      // Check if callee is already in a call
      if (activeCalls.has(calleeId)) {
        socket.emit("call:user-busy", { calleeId });
        return;
      }

      // Store caller as in active call
      if (socket.userData) {
        activeCalls.set(socket.userData._id, { peerId: calleeId, callType });
      }

      // Send incoming call to callee WITH the offer
      io.to(calleeId).emit("call:incoming", {
        callerId: socket.userData._id,
        callerInfo: callerInfo,
        callType: callType,
        offer: offer, // Include the WebRTC offer
      });
    });

    // F2. Answer a call (callee sends answer to caller)
    socket.on("call:answer", ({ callerId, answer }) => {
      console.log(`Call answered by ${socket.userData?._id}`);

      // Mark callee as in active call
      if (socket.userData) {
        activeCalls.set(socket.userData._id, { peerId: callerId, callType: 'active' });
      }

      // Forward answer to caller
      io.to(callerId).emit("call:answer", {
        calleeId: socket.userData._id,
        answer: answer,
      });
    });

    // F3. Reject a call
    socket.on("call:reject", ({ callerId }) => {
      console.log(`Call rejected by ${socket.userData?._id}`);

      // Remove caller from active calls
      activeCalls.delete(callerId);

      // Notify caller that call was rejected
      io.to(callerId).emit("call:rejected", {
        calleeId: socket.userData._id,
      });
    });

    // F4. End a call
    socket.on("call:end", ({ peerId }) => {
      console.log(`Call ended by ${socket.userData?._id}`);

      // Remove both parties from active calls
      if (socket.userData) {
        activeCalls.delete(socket.userData._id);
      }
      activeCalls.delete(peerId);

      // Notify peer that call ended
      io.to(peerId).emit("call:ended", {
        endedBy: socket.userData?._id,
      });
    });

    // F5. ICE Candidate exchange
    socket.on("webrtc:ice-candidate", ({ peerId, candidate }) => {
      io.to(peerId).emit("webrtc:ice-candidate", {
        senderId: socket.userData?._id,
        candidate: candidate,
      });
    });

    // ============================================
    // G. DISCONNECT: User closes browser/tab
    // ============================================
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      if (socket.userData && socket.userData._id) {
        // End any active call
        const activeCall = activeCalls.get(socket.userData._id);
        if (activeCall) {
          io.to(activeCall.peerId).emit("call:ended", {
            endedBy: socket.userData._id,
            reason: "disconnected",
          });
          activeCalls.delete(socket.userData._id);
        }

        // Remove from online users
        onlineUsers.delete(socket.userData._id);
        socket.leave(socket.userData._id);

        console.log("User went offline:", socket.userData._id);
        console.log("Online Users:", Array.from(onlineUsers.keys()));

        // Broadcast updated online users list
        io.emit("online users", Array.from(onlineUsers.keys()));
      }
    });
  });
};

export default initSocket;