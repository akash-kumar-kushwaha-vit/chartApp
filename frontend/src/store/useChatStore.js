import { create } from "zustand";
import { axiosInstance } from "../api/axios";
import toast from "react-hot-toast";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/auth/users");
      set({ users: res.data.data }); // Using ApiResponse pattern -> res.data.data
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  addContact: async (query) => {
    try {
      const res = await axiosInstance.post("/auth/users/add-contact", { query });
      const newContact = res.data.data;
      set({ users: [...get().users, newContact] });
      toast.success(`${newContact.fullName} added to contacts!`);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add contact");
      return false;
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));

