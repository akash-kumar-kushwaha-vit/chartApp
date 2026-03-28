import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { useChatStore } from "../store/useChatStore";
import { LogOut, MessageSquare, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import ProfileModal from "./ProfileModal";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { selectedUser } = useChatStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <nav className={`border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-40 flex-shrink-0 transition-all duration-200 ${selectedUser ? 'hidden md:block' : 'block'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-all">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="font-bold text-xl hidden sm:block">ChatApp</span>
            </Link>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {authUser && (
                <>
                  {/* Profile avatar button */}
                  <button
                    id="profile-btn"
                    onClick={() => setIsProfileOpen(true)}
                    className="relative flex items-center gap-2 group"
                    title="Edit Profile"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-transparent group-hover:ring-indigo-400 transition-all shadow-md">
                      {authUser.avtar ? (
                        <img
                          src={authUser.avtar}
                          alt={authUser.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm font-bold">
                          {getInitials(authUser.fullName)}
                        </span>
                      )}
                    </div>
                    <div className="hidden sm:flex flex-col items-start leading-tight">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {authUser.fullName?.split(" ")[0] || "You"}
                      </span>
                      {authUser.status && (
                        <span className="text-xs text-gray-400 max-w-[120px] truncate">
                          {authUser.status}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Logout */}
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};

export default Navbar;
