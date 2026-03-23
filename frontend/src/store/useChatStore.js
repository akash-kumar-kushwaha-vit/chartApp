import { create } from "zustand";
import { axiosInstance } from "../api/axios";
import toast from "react-hot-toast";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  unreadCounts: {},
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  hasMoreMessages: true,
  replyingTo: null,

  setReplyingTo: (message) => set({ replyingTo: message }),

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
        const res = await axiosInstance.post("/auth/add-contact", { username });
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
      const newMessages = res.data.data;

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
        messageData.replyTo = replyingTo._id;
      }
      
      const isGroup = selectedUser?.isGroup || false;
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}?isGroup=${isGroup}`, messageData);
      
      set({ messages: [...messages, res.data.data], replyingTo: null });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
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

