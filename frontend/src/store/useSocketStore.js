import { create } from "zustand";
import { io } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";
import { useCallStore } from "./useCallStore";
import { decryptMessageObjects } from "../lib/crypto";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:4000" : "https://helloapp-dcrh.onrender.com";

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

    // Initialize WebRTC Call Listeners
    useCallStore.getState().initListeners();

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on("newGroupCreated", (newGroup) => {
      // Immediately join the socket room for the new group so we can receive messages
      socket.emit("joinGroup", newGroup._id);
      
      // Refresh the contacts list so the new group appears in the Sidebar natively
      const { getUsers } = useChatStore.getState();
      getUsers();
    });

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages, markMessagesAsRead, incrementUnreadCount } = useChatStore.getState();
      
      const senderString = newMessage.senderId?._id || newMessage.senderId;
      const isMessageForCurrentChat = selectedUser && (
        (newMessage.groupId && selectedUser._id === newMessage.groupId) || 
        (!newMessage.groupId && selectedUser._id === senderString)
      );

      (async () => {
        let decryptedMsg = newMessage;
        if (newMessage.iv && newMessage.encryptionKeys?.length) {
          const { authUser } = useAuthStore.getState();
          const uid = authUser?._id || authUser?.id;
          if (uid) {
            try {
              decryptedMsg = await decryptMessageObjects(newMessage, uid);
            } catch (e) {
              console.error("Socket message decrypt failed", e);
            }
          }
        }

        if (isMessageForCurrentChat) {
          useChatStore.setState({ messages: [...messages, decryptedMsg] });
          markMessagesAsRead(newMessage.groupId ? newMessage.groupId : senderString);
        } else {
          const badgeId = newMessage.groupId ? newMessage.groupId : senderString;
          incrementUnreadCount(badgeId);

          if (Notification.permission === "granted") {
            const title = newMessage.groupId ? "New Group Message" : "New Message";
            const body = decryptedMsg.text || "Sent an attachment";
            new Notification(title, { body });
          }
        }
      })();
    });

    socket.on("messagesRead", ({ readerId }) => {
      const { selectedUser, messages } = useChatStore.getState();
      // If we are chatting with the person who read our messages, update our locally stored messages status
      if (selectedUser && selectedUser._id === readerId) {
        useChatStore.setState({
          messages: messages.map(msg =>
            (msg.receiverId === readerId && msg.status !== "read")
              ? { ...msg, status: "read" }
              : msg
          )
        });
      }
    });

    socket.on("messageEdited", (editedMessage) => {
      const { selectedUser, messages } = useChatStore.getState();
      const sId = editedMessage.senderId?._id || editedMessage.senderId;
      const rId = editedMessage.receiverId?._id || editedMessage.receiverId;
      
      const isCurrent = selectedUser && (
        (editedMessage.groupId && selectedUser._id === editedMessage.groupId) ||
        (!editedMessage.groupId && (selectedUser._id === sId || selectedUser._id === rId))
      );
      if (isCurrent) {
        useChatStore.setState({ 
          messages: messages.map(msg => msg._id === editedMessage._id ? editedMessage : msg) 
        });
      }
    });

    socket.on("messageDeleted", (deletedMessage) => {
      const { selectedUser, messages } = useChatStore.getState();
      const sId = deletedMessage.senderId?._id || deletedMessage.senderId;
      const rId = deletedMessage.receiverId?._id || deletedMessage.receiverId;
      
      const isCurrent = selectedUser && (
        (deletedMessage.groupId && selectedUser._id === deletedMessage.groupId) ||
        (!deletedMessage.groupId && (selectedUser._id === sId || selectedUser._id === rId))
      );
      if (isCurrent) {
        useChatStore.setState({ 
          messages: messages.map(msg => msg._id === deletedMessage._id ? deletedMessage : msg) 
        });
      }
    });

    socket.on("messageReacted", (reactedMessage) => {
      const { selectedUser, messages } = useChatStore.getState();
      const sId = reactedMessage.senderId?._id || reactedMessage.senderId;
      const rId = reactedMessage.receiverId?._id || reactedMessage.receiverId;
      
      const isCurrent = selectedUser && (
        (reactedMessage.groupId && selectedUser._id === reactedMessage.groupId) ||
        (!reactedMessage.groupId && (selectedUser._id === sId || selectedUser._id === rId))
      );
      if (isCurrent) {
        useChatStore.setState({ 
          messages: messages.map(msg => msg._id === reactedMessage._id ? reactedMessage : msg) 
        });
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

