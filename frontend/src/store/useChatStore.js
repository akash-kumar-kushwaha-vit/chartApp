import { create } from "zustand";
import { axiosInstance } from "../api/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { generateAESKey, encryptTextData, encryptAESKeyWithRSA, importPublicKey, decryptMessageObjects } from "../lib/crypto";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  unreadCounts: {},
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  hasMoreMessages: true,
  replyingTo: null,
  forwardMessageData: null,

  setReplyingTo: (message) => set({ replyingTo: message }),
  setForwardMessageData: (message) => set({ forwardMessageData: message }),

  getUnreadCounts: async () => {
    try {
      const res = await axiosInstance.get("/messages/unread-counts");
      set({ unreadCounts: res.data.data || {} });
    } catch (error) {
      console.error("Failed to fetch unread counts:", error);
    }
  },

  incrementUnreadCount: (userId) => {
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [userId]: (state.unreadCounts[userId] || 0) + 1 }
    }));
  },

  getUsers: async (searchQuery = "") => {
    set({ isUsersLoading: true });
    try {
      const endpoint = searchQuery ? `/auth/users?search=${encodeURIComponent(searchQuery)}` : "/auth/users";
      const res = await axiosInstance.get(endpoint);
      set({ users: res.data.data }); // Using ApiResponse pattern -> res.data.data
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  addContact: async (username) => {
    try {
        const res = await axiosInstance.post("/auth/add-contact", { query: username });
        const newContact = res.data.data;
        // Optionally prepend it or just refetch users
        get().getUsers(); 
        return newContact;
    } catch (error) {
        toast.error(error.response?.data?.message || "Failed to add contact");
        throw error;
    }
  },

  createGroup: async (formData) => {
    try {
      const res = await axiosInstance.post("/groups/create", formData);
      const newGroup = res.data.data;
      
      // format for sidebar
      const formattedGroup = {
        ...newGroup,
        fullName: newGroup.name,
        username: newGroup.members.length + " members",
        isGroup: true,
        status: ""
      };

      set({ users: [formattedGroup, ...get().users] });
      toast.success("Group created successfully!");
      return formattedGroup;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      throw error;
    }
  },

  getMessages: async (userId, pagination = { skip: 0, limit: 50, search: '' }) => {
    if (pagination.skip === 0) set({ isMessagesLoading: true, hasMoreMessages: true });
    
    try {
      const queryParams = new URLSearchParams({
        skip: pagination.skip,
        limit: pagination.limit,
      });
      if (pagination.search) queryParams.append("search", pagination.search);
      
      const { selectedUser } = get();
      if (selectedUser?.isGroup) {
        queryParams.append("isGroup", "true");
      }

      const res = await axiosInstance.get(`/messages/${userId}?${queryParams.toString()}`);
      let newMessages = res.data.data;

      const authUser = useAuthStore.getState().authUser;
      if (authUser) {
        newMessages = await decryptMessageObjects(newMessages, authUser._id || authUser.id);
      }

      set((state) => ({
        messages: pagination.skip === 0 
          ? newMessages 
          : [...newMessages, ...state.messages], // Prepend older messages
        hasMoreMessages: newMessages.length === pagination.limit
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  markMessagesAsRead: async (userId) => {
    try {
      await axiosInstance.post(`/messages/mark-read/${userId}`);
      set((state) => ({
        messages: state.messages.map(msg =>
          (msg.senderId === userId && msg.status !== "read")
            ? { ...msg, status: "read" }
            : msg
        ),
        unreadCounts: { ...state.unreadCounts, [userId]: 0 }
      }));
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, replyingTo } = get();
    try {
      if (replyingTo) {
        if (messageData instanceof FormData) messageData.append("replyTo", replyingTo._id);
        else messageData.replyTo = replyingTo._id;
      }
      
      const isGroup = selectedUser?.isGroup || false;
      const authUser = useAuthStore.getState().authUser;

      // E2EE ENCRYPTION (1-on-1 only for now)
      if (!isGroup && selectedUser.publicKey && authUser.publicKey) {
        let textToEncrypt = "";
        const isFormData = messageData instanceof FormData;
        
        if (isFormData && messageData.has("text")) {
          textToEncrypt = messageData.get("text");
        } else if (!isFormData && messageData.text) {
          textToEncrypt = messageData.text;
        }

        if (textToEncrypt) {
          try {
            const aesKey = await generateAESKey();
            const { ciphertext, iv } = await encryptTextData(textToEncrypt, aesKey);
            
            const receiverRsaKey = await importPublicKey(selectedUser.publicKey);
            const senderRsaKey = await importPublicKey(authUser.publicKey);
            
            const receiverEncKey = await encryptAESKeyWithRSA(aesKey, receiverRsaKey);
            const senderEncKey = await encryptAESKeyWithRSA(aesKey, senderRsaKey);
            
            const encKeysArray = JSON.stringify([
              { userId: selectedUser._id, encryptedKey: receiverEncKey },
              { userId: authUser._id || authUser.id, encryptedKey: senderEncKey }
            ]);
            
            if (isFormData) {
              messageData.set("text", ciphertext);
              messageData.append("iv", iv);
              messageData.append("encryptionKeys", encKeysArray);
            } else {
              messageData.text = ciphertext;
              messageData.iv = iv;
              messageData.encryptionKeys = encKeysArray;
            }
          } catch (encErr) {
            console.error("Encryption error:", encErr);
            toast.error("Failed to encrypt message. Sending unencrypted...");
          }
        }
      }

      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}?isGroup=${isGroup}`, messageData);
      
      set({ messages: [...messages, res.data.data], replyingTo: null });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  forwardMessage: async (targetId, isGroup, messageToForward) => {
    try {
      const formData = new FormData();
      if (messageToForward.text) formData.append("text", messageToForward.text);
      if (isGroup) formData.append("isGroup", "true");
      formData.append("isForwarded", "true");
      
      if (messageToForward.image) formData.append("imageURL", messageToForward.image);
      if (messageToForward.video) formData.append("videoURL", messageToForward.video);
      if (messageToForward.fileUrl) {
        formData.append("fileURL", messageToForward.fileUrl);
        formData.append("fileNameStr", messageToForward.fileName);
      }
      if (messageToForward.audioUrl) formData.append("audioURL", messageToForward.audioUrl);
      
      await axiosInstance.post(`/messages/send/${targetId}?isGroup=${isGroup}`, formData);
      toast.success("Message forwarded");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to forward message");
    }
  },

  editMessage: async (messageId, text) => {
    try {
      const res = await axiosInstance.put(`/messages/edit/${messageId}`, { text });
      // UI updates immediately via socket, but we can also handle it here.
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to edit message");
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/delete/${messageId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  reactToMessage: async (messageId, emoji) => {
    try {
      await axiosInstance.post(`/messages/react/${messageId}`, { emoji });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to react to message");
    }
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
    if (selectedUser) {
      get().markMessagesAsRead(selectedUser._id);
    }
  },
}));

