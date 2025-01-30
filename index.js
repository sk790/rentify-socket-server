import { Server } from "socket.io";
import http from "http";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.SOCKET_PORT || 4001; // Use a different port for WebSockets
const users = {}; // Stores userId -> socketId mapping

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (change for production)
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Register user with socket
  socket.on("registerUser", (userId) => {
    users[userId] = socket.id;
    console.log(`User registered: ${userId} -> ${socket.id}`);
    io.emit("getOnlineUsers", Object.keys(users)); // Notify all users
  });

  // Handle incoming messages
  socket.on("sendMessage", ({ senderId, receiverId, message }) => {
    console.log(`Message from ${senderId} to ${receiverId}: ${message}`);

    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", { senderId, message });
      console.log(`Sent message to ${receiverSocketId}`);
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        break;
      }
    }
    io.emit("getOnlineUsers", Object.keys(users));
  });
});

server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});
