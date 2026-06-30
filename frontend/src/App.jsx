import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { Toaster } from "react-hot-toast";

import VideoCallManager from "./components/VideoCallManager";
import ChatDashboard from "./pages/ChatDashboard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

function App() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if(theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center bg-white dark:bg-[#111b21]" style={{ height: '100dvh' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-[20px] bg-[#00a884] flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-none stroke-current" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="w-full flex flex-col transition-colors duration-200 bg-white dark:bg-gray-900 text-black dark:text-white overflow-hidden" style={{ height: '100dvh' }}>
        <VideoCallManager />
        <main className="flex-1 overflow-hidden relative flex flex-col">
          <Routes>
            <Route path="/" element={authUser ? <ChatDashboard /> : <Navigate to="/login" />} />
            <Route path="/register" element={!authUser ? <RegisterPage /> : <Navigate to="/" />} />
            <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </BrowserRouter>
  );
}

export default App;
