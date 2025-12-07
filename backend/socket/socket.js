import { Server } from "socket.io";

const initSocket = (server) => {
  // 1. Initialize Socket.io
  const io = new Server(server, {
    pingTimeout: 60000, // Close connection if user is silent for 60s (saves bandwidth)
    cors: {
      origin: "http://localhost:5173", // Your Frontend URL
      // origin: "*", // Use this if you have trouble connecting
    },
  });

  // 2. Listen for Connections
    io.on("connection", (socket) => {
    console.log("Connected to socket.io");

    // A. SETUP: User logs in and joins their own personal room
    // The frontend will emit "setup" and send the User Data
        socket.on("setup", (userData) => {
         if (!userData || !userData._id) {
        console.log("Socket setup failed: No user data received");
        return; // Stop here, don't crash
      } 
      socket.join(userData._id);
      console.log("User Joined Room: " + userData._id);
      socket.emit("connected");
    });

    // B. JOIN CHAT: User clicks on a chat
    // They join a room specific to that Chat ID
    socket.on("join chat", (room) => {
      socket.join(room);
      console.log("User Joined Chat: " + room);
    });

    // C. TYPING: User starts typing
    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

    // D. NEW MESSAGE: User sends a message
    socket.on("new message", (newMessageRecieved) => {
      var chat = newMessageRecieved.chat;

      if (!chat.users) return console.log("chat.users not defined");

      // Loop through all users in the chat
      chat.users.forEach((user) => {
        // Don't send the message back to the sender (they already have it)
        if (user._id == newMessageRecieved.sender._id) return;

        // Send to everyone else inside their personal room
        // logic: "in user._id room, emit 'message received'"
        socket.in(user._id).emit("message received", newMessageRecieved);
      });
    });

    // E. CLEANUP
    socket.off("setup", () => {
      console.log("USER DISCONNECTED");
      socket.leave(userData._id);
    });
  });
};

export default initSocket;