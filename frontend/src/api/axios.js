import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:4000/api" : "https://helloapp-dcrh.onrender.com/api",
  withCredentials: true, // IMPORTANT: Allows cookies (JWT) to be sent with requests
});

// Automatically clear stale auth state on 401 responses
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear if it's NOT the checkAuth/me ping itself (to avoid redirect loops)
      const url = error.config?.url || "";
      if (!url.includes("/auth/me") && !url.includes("/auth/login") && !url.includes("/auth/register")) {
        localStorage.removeItem("chat-user");
        // Redirect to login if not already there
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);
