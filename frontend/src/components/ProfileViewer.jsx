import { X, User, Users, Loader2, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { axiosInstance } from "../api/axios";

const ProfileViewer = ({ user, onClose }) => {
  const [groupDetails, setGroupDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.isGroup && user._id) {
      const fetchDetails = async () => {
        setIsLoading(true);
        try {
          const res = await axiosInstance.get(`/groups/${user._id}`);
          setGroupDetails(res.data.data);
        } catch (error) {
          console.error("Failed to load group details", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDetails();
    }
  }, [user]);

  if (!user) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div 
        className="relative bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header / Cover Area */}
        <div className="h-24 bg-indigo-600 dark:bg-indigo-900/50"></div>

        {/* Profile Info */}
        <div className="px-6 pb-6 relative">
          <div className="flex justify-center -mt-12 mb-4">
            {user.avtar ? (
              <img 
                src={user.avtar} 
                alt={user.fullName} 
                className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shadow-lg">
                {user.isGroup ? <Users className="w-12 h-12 text-indigo-600 dark:text-indigo-400" /> : <User className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />}
              </div>
            )}
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user.fullName}
            </h2>
            <p className="text-sm font-medium text-indigo-500 dark:text-indigo-400">
              {user.isGroup ? user.username : `@${user.username}`}
            </p>
          </div>

          {/* Status Message / Description */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {user.isGroup ? "Description" : "About"}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {user.isGroup ? (groupDetails?.description || "Welcome to the group!") : (user.status || "Hello! I am using this chat app.")}
            </p>
          </div>

          {/* Group Participants List */}
          {user.isGroup && (
            <div className="mt-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider p-4 border-b border-gray-100 dark:border-gray-800">
                {groupDetails ? `${groupDetails.members.length} Participants` : "Participants"}
              </h3>
              
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  {groupDetails?.members.map((member) => (
                    <div key={member._id} className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      {member.avtar ? (
                        <img src={member.avtar} alt={member.username} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                          <span className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">{member.fullName[0].toUpperCase()}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
                          {member.fullName}
                          {groupDetails.admins.includes(member._id) && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <Crown className="w-3 h-3" /> Admin
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{member.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileViewer;
