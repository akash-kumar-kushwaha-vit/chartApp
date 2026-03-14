import { create } from "zustand";
import { axiosInstance } from "../api/axios";
import toast from "react-hot-toast";
import { useSocketStore } from "./useSocketStore";
export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isLoggingIn: false,
  isSigningUp: false,
  isUpdatingProfile: false,

  googleLogin: async (credential) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/google-auth", { credential });
      const userObj = { isAuthenticated: true, _id: res.data.data?.user?._id || "placeholder_id", ...res.data.data?.user };
      localStorage.setItem("chat-user", JSON.stringify(userObj));
      set({ authUser: userObj });
      useSocketStore.getState().connectSocket();
      
      toast.success("Successfully logged in with Google");
    } catch (error) {
      toast.error(error.response?.data?.message || "Google Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  checkAuth: async () => {
    try {
      const user = localStorage.getItem("chat-user");
      if (user) {
        // ping an endpoint to verify the cookie is still valid
        const res = await axiosInstance.get("/auth/users");
        set({ authUser: JSON.parse(user) });
        useSocketStore.getState().connectSocket();
      } else {
        set({ authUser: null });
      }
    } catch (error) {
      console.log("Error in checkAuth:", error);
      // If 401 unauthorized, the cookie expired or was cleared, but localStorage still has the user
      localStorage.removeItem("chat-user");
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/register", data);
      // Backend automatically sets cookie? Wait, register doesn't set cookie in user.js controller, only login does!
      // So we should redirect to login OR call login immediately after
      toast.success("Account created successfully! Please log in.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating account");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      
      // Store minimal user info in local storage so it persists across refreshes
      // We don't have user info in login response rn (only accessToken/refreshToken)
      // So we'll save email as a proxy or fetch users. Wait, the backend login only returns tokens!
      // Let's modify the frontend to assume login success = authUser is true, or we update the backend.
      // For now, I'll store authUser as true/the email.
      const userObj = { email: data.email, isAuthenticated: true, _id: res.data.data?.user?._id || "placeholder_id", ...res.data.data?.user };
      localStorage.setItem("chat-user", JSON.stringify(userObj));
      set({ authUser: userObj });
      useSocketStore.getState().connectSocket();
      
      toast.success("Logged in successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid credentials");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      localStorage.removeItem("chat-user");
      set({ authUser: null });
      useSocketStore.getState().disconnectSocket();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error logging out");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/profile/update", data);
      const updatedUser = { ...get().authUser, ...res.data.data };
      localStorage.setItem("chat-user", JSON.stringify(updatedUser));
      set({ authUser: updatedUser });
      toast.success("Profile updated successfully!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
      return false;
    } finally {
      set({ isUpdatingProfile: false });
    }
  },
}));
