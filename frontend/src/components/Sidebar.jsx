import { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useSocketStore } from "../store/useSocketStore";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { Loader2, Search, User, UserPlus, Users, X, MoreVertical, Moon, Sun, MessageSquare, LogOut, BellOff, Ban } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";
import ProfileModal from "./ProfileModal";

const Sidebar = () => {
  const { users, getUsers, selectedUser, setSelectedUser, isUsersLoading, addContact, unreadCounts } = useChatStore();
  const { onlineUsers } = useSocketStore();
  const { authUser, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const [showAddContact, setShowAddContact] = useState(false);
  const [contactQuery, setContactQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      getUsers(searchFilter);
    }, 400); // Debounce search
    return () => clearTimeout(timer);
  }, [searchFilter, getUsers]);

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!contactQuery.trim()) return;
    setIsAdding(true);
    const success = await addContact(contactQuery.trim());
    setIsAdding(false);
    if (success) {
      setContactQuery("");
      setShowAddContact(false);
    }
  };

  // Local filtering removed: `users` array is now filtered globally via backend API

  if (isUsersLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <>
      {/* WhatsApp Sidebar Header */}
      <div className="h-[59px] px-4 py-2 bg-[#f0f2f5] dark:bg-[#202c33] flex justify-between items-center border-b border-[#d1d7db] dark:border-[#202c33] flex-shrink-0 relative z-20">
        <button onClick={() => setIsProfileOpen(true)} className="w-10 h-10 rounded-full overflow-hidden hover:opacity-80 transition-opacity">
          {authUser?.avtar ? (
            <img src={authUser.avtar} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
        </button>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setShowAddContact((v) => !v); setShowCreateGroup(false); }} 
            className="p-2 text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors flex items-center justify-center"
            title="New Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button 
            onClick={() => { setShowCreateGroup((v) => !v); setShowAddContact(false); }} 
            className="p-2 text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors flex items-center justify-center"
            title="Communities / Groups"
          >
            <Users className="w-5 h-5" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)} 
              className={`p-2 rounded-full flex items-center justify-center transition-colors ${showDropdown ? 'bg-black/10 dark:bg-white/10 text-[#54656f] dark:text-[#aebac1]' : 'text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#233138] rounded shadow-xl py-2 z-50">
                <button
                  onClick={() => { setIsProfileOpen(true); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-3 text-[14.5px] text-[#3b4a54] dark:text-[#d1d7db] hover:bg-[#f5f6f6] dark:hover:bg-[#111b21]"
                >
                  Profile
                </button>
                <button
                  onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-3 text-[14.5px] text-[#3b4a54] dark:text-[#d1d7db] hover:bg-[#f5f6f6] dark:hover:bg-[#111b21] flex justify-between items-center"
                >
                  Theme {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-3 text-[14.5px] text-[#3b4a54] dark:text-[#d1d7db] hover:bg-[#f5f6f6] dark:hover:bg-[#111b21]"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar - WhatsApp Style */}
      <div className="px-3 py-2 border-b border-[#f0f2f5] dark:border-[#202c33] bg-white dark:bg-[#111b21] flex-shrink-0 transition-all">
        <div className="relative flex items-center bg-[#f0f2f5] dark:bg-[#202c33] rounded-lg h-9">
          <button className="absolute left-3 text-[#54656f] dark:text-[#8696a0]">
             <Search className="w-4 h-4" />
          </button>
          <input
            type="text"
            placeholder="Search or start new chat"
            className="w-full bg-transparent pl-12 pr-4 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-[#54656f] dark:placeholder-[#8696a0] outline-none"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="relative bg-white dark:bg-[#111b21]">
        {/* Create Group Modal */}
        {showCreateGroup && (
          <CreateGroupModal onClose={(newGroup) => {
            setShowCreateGroup(false);
            if (newGroup) setSelectedUser(newGroup);
          }} />
        )}

        {/* Add Contact Form */}
        {showAddContact && (
          <div className="px-3 pb-2 pt-1 border-b border-[#f0f2f5] dark:border-[#202c33]">
            <form onSubmit={handleAddContact} className="flex gap-2">
              <input
                type="text"
                placeholder="Username or email..."
                value={contactQuery}
                onChange={(e) => setContactQuery(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm bg-[#f0f2f5] dark:bg-[#202c33] rounded-lg outline-none text-[#111b21] dark:text-[#e9edef] placeholder-[#8696a0] focus:ring-1 focus:ring-[#00a884] transition-all"
                autoFocus
              />
              <button
                type="submit"
                disabled={isAdding || !contactQuery.trim()}
                className="px-3 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddContact(false); setContactQuery(""); }}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto w-full bg-white dark:bg-[#111b21]">
        {users.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-sm space-y-2">
            <p>{searchFilter ? "No users found globally." : "No contacts yet."}</p>
            {!searchFilter && (
              <button
                onClick={() => setShowAddContact(true)}
                className="text-indigo-500 hover:underline text-xs"
              >
                Add your first contact →
              </button>
            )}
          </div>
        ) : (
          users.map((user) => (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`w-full p-0 flex items-center transition-all cursor-pointer ${
                selectedUser?._id === user._id
                  ? "bg-[#f0f2f5] dark:bg-[#2a3942]"
                  : "hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]"
              }`}
            >
              <div className="pl-3 pr-3 py-3">
                <div className="relative">
                  {user.avtar ? (
                    <img src={user.avtar} alt={user.username} className="w-[49px] h-[49px] rounded-full object-cover" />
                  ) : (
                    <div className="w-[49px] h-[49px] rounded-full bg-[#dfe5e7] dark:bg-[#667781] flex items-center justify-center flex-shrink-0">
                      {user.isGroup ? <Users className="w-6 h-6 text-white" /> : <User className="w-6 h-6 text-white" />}
                    </div>
                  )}
                  {!user.isGroup && onlineUsers.includes(user._id) && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00a884] border-2 border-white dark:border-[#111b21] rounded-full" />
                  )}
                </div>
              </div>

              <div className="flex-1 text-left min-w-0 pr-4 py-3 border-b border-[#f0f2f5] dark:border-[#202c33] h-full flex flex-col justify-center">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[17px] text-[#111b21] dark:text-[#e9edef] truncate leading-tight flex items-center gap-1.5">
                    {user.fullName}
                    {user.isBlocked && (
                      <Ban className="w-3.5 h-3.5 text-red-500 flex-shrink-0" title="Blocked" />
                    )}
                  </span>
                  <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
                    {user.isMuted && (
                      <BellOff className="w-3.5 h-3.5 text-[#8696a0]" title="Muted" />
                    )}
                    {unreadCounts[user._id] > 0 && selectedUser?._id !== user._id && (
                      <div className={`min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center ${
                        user.isMuted
                          ? "bg-[#8696a0]"
                          : "bg-[#00a884]"
                      }`}>
                        <span className="text-[11px] text-white font-bold leading-none">{unreadCounts[user._id]}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-[13px] text-[#667781] dark:text-[#8696a0] truncate leading-tight">
                  {user.isGroup ? "Group chat" : `@${user.username}`}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};

export default Sidebar;
