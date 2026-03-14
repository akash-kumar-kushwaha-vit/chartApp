import { create } from "zustand";
import { io } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:4000" : "/";

export const useSocketStore = create((set, get) => ({
  socket: null,
  onlineUsers: [],
  typingUserId: null, // ID of the user who is currently typing to us

  connectSocket: () => {
    const { authUser } = useAuthStore.getState();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();
    set({ socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages } = useChatStore.getState();
      
      // Update global message state only if we are currently chatting with the sender
      if (selectedUser && selectedUser._id === newMessage.senderId) {
        useChatStore.setState({ messages: [...messages, newMessage] });
      }
    });

    // Typing events from the server
    socket.on("typing", ({ senderId }) => {
      set({ typingUserId: senderId });
    });

    socket.on("stopTyping", ({ senderId }) => {
      // Only clear if the person who stopped typing is the same one who was shown
      if (get().typingUserId === senderId) {
        set({ typingUserId: null });
      }
    });
  },
  
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
    set({ socket: null, typingUserId: null });
  },
}));

