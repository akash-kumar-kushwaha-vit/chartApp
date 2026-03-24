import { Server } from "socket.io";
import { Group } from "../model/group.model.js";
import http from "http";
import express from "express";
import mongoose from "mongoose";

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ORIGIN_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId != "undefined") {
    userSocketMap[userId] = socket.id;

    // Join all groups this user is a member of
    Group.find({ members: new mongoose.Types.ObjectId(userId) }).then(groups => {
      groups.forEach(group => {
        socket.join(group._id.toString());
      });
    }).catch(err => console.error("Error joining group rooms:", err));
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Dynamic explicit group join (e.g., just created or added to a group)
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
  });

  // Relay typing events
  socket.on("typing", ({ receiverId, isGroup }) => {
    if (isGroup) {
      // Broadcast to room members except sender
      socket.to(receiverId).emit("typing", { senderId: userId });
    } else {
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", { senderId: userId });
      }
    }
  });

  socket.on("stopTyping", ({ receiverId, isGroup }) => {
    if (isGroup) {
      socket.to(receiverId).emit("stopTyping", { senderId: userId });
    } else {
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("stopTyping", { senderId: userId });
      }
    }
  });

  // --- WebRTC Video Calling Signaling ---
  socket.on("callUser", ({ userToCall, offer, from, isVideoCall }) => {
    const receiverSocketId = userSocketMap[userToCall];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incomingCall", { from, offer, isVideoCall });
    }
  });

  socket.on("answerCall", ({ to, answer }) => {
    const callerSocketId = userSocketMap[to];
    if (callerSocketId) {
      io.to(callerSocketId).emit("callAccepted", { answer });
    }
  });

  socket.on("iceCandidate", ({ to, candidate }) => {
    const peerSocketId = userSocketMap[to];
    if (peerSocketId) {
      io.to(peerSocketId).emit("iceCandidate", { candidate });
    }
  });

  socket.on("endCall", ({ to }) => {
    const peerSocketId = userSocketMap[to];
    if (peerSocketId) {
      io.to(peerSocketId).emit("callEnded");
    }
  });

  // listen to events
  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, io, server };
