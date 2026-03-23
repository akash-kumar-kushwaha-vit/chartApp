import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useSocketStore } from "../store/useSocketStore";
import { Loader2, Search, User, UserPlus, Users, X } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";

const Sidebar = () => {
  const { users, getUsers, selectedUser, setSelectedUser, isUsersLoading, addContact, unreadCounts } = useChatStore();
  const { onlineUsers } = useSocketStore();

  const [showAddContact, setShowAddContact] = useState(false);
  const [contactQuery, setContactQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);

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
      {/* Search and Add Contact */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-900 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
          </div>
          <button
            onClick={() => { setShowCreateGroup((v) => !v); setShowAddContact(false); }}
            title="Create group"
            className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
              showCreateGroup
                ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                : "text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-gray-800"
            }`}
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setShowAddContact((v) => !v); setShowCreateGroup(false); }}
            title="Add contact"
            className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
              showAddContact
                ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                : "text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-gray-800"
            }`}
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>

        {/* Create Group Modal */}
        {showCreateGroup && (
          <CreateGroupModal onClose={(newGroup) => {
            setShowCreateGroup(false);
            if (newGroup) setSelectedUser(newGroup);
          }} />
        )}

        {/* Add Contact Form */}
        {showAddContact && (
          <form onSubmit={handleAddContact} className="flex gap-2">
            <input
              type="text"
              placeholder="Username or email..."
              value={contactQuery}
              onChange={(e) => setContactQuery(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none border-transparent focus:bg-white dark:focus:bg-gray-900 transition-all"
              autoFocus
            />
            <button
              type="submit"
              disabled={isAdding || !contactQuery.trim()}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex-shrink-0"
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
            </button>
            <button
              type="button"
              onClick={() => { setShowAddContact(false); setContactQuery(""); }}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto w-full pt-2 px-3">
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
              className={`w-full p-3 flex items-center gap-3 rounded-xl transition-all ${
                selectedUser?._id === user._id
                  ? "bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-100 dark:ring-indigo-500/30"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:pl-4"
              }`}
            >
              <div className="relative">
                {user.avtar ? (
                  <img src={user.avtar} alt={user.username} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                    {user.isGroup ? <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> : <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                )}
                {!user.isGroup && onlineUsers.includes(user._id) && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                )}
              </div>

              <div className="flex-1 text-left min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white truncate">
                  {user.fullName}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  @{user.username}
                </div>
              </div>

              {/* Unread Badge */}
              {unreadCounts[user._id] > 0 && selectedUser?._id !== user._id && (
                <div className="ml-auto min-w-[20px] h-5 px-1.5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] text-white font-bold leading-none">{unreadCounts[user._id]}</span>
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </>
  );
};

export default Sidebar;
