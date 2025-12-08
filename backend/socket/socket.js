import { Server } from "socket.io";

// Track online users: { odId: socketId }
const onlineUsers = new Map();

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

    // F. DISCONNECT: User closes browser/tab
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      if (socket.userData && socket.userData._id) {
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