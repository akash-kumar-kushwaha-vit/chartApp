import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useSocketStore } from "../store/useSocketStore";
import { Loader2, Search, User } from "lucide-react";

const Sidebar = () => {
  const { users, getUsers, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useSocketStore();

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  if (isUsersLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <>
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-900 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto w-full pt-2 px-3">
        {users.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-sm">No users found</div>
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
                    <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                )}
                {onlineUsers.includes(user._id) && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
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
            </button>
          ))
        )}
      </div>
    </>
  );
};

export default Sidebar;
