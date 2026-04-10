import { X, User, Users, Loader2, Crown, Edit2, Check, Camera, ShieldOff, Shield, BellOff, Bell } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { axiosInstance } from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

const ProfileViewer = ({ user, onClose }) => {
  const [groupDetails, setGroupDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user?.fullName || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isActioning, setIsActioning] = useState(false);
  const fileInputRef = useRef(null);
  const { authUser } = useAuthStore();
  const { blockUser, unblockUser, muteUser, selectedUser } = useChatStore();

  // isBlocked / isMuted come from the user object (populated by the sidebar query)
  const isBlocked = user?.isBlocked || false;
  const isMuted = selectedUser?._id === user?._id ? (selectedUser?.isMuted ?? user?.isMuted ?? false) : (user?.isMuted || false);
  const isBlockedByThem = user?.isBlockedByThem || false;

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

  const isAdmin = user.isGroup && groupDetails?.admins?.includes(authUser?._id);

  const handleUpdateName = async () => {
    if (!editName.trim() || editName === user.fullName) {
      setIsEditingName(false);
      return;
    }
    setIsUpdating(true);
    try {
      await axiosInstance.put(`/groups/${user._id}/update`, { name: editName });
      toast.success("Group name updated");
      setIsEditingName(false);
      // user.fullName will update from socket event independently
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update name");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUpdating(true);
    const formData = new FormData();
    formData.append("avtar", file);

    try {
      const res = await axiosInstance.put(`/groups/${user._id}/update`, formData);
      setGroupDetails(prev => ({ ...prev, avtar: res.data.data.avtar }));
      toast.success("Group picture updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update picture");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMakeAdmin = async (memberId) => {
    try {
      await axiosInstance.put(`/groups/${user._id}/assign-admin/${memberId}`);
      toast.success("Admin assigned");
      setGroupDetails(prev => ({
        ...prev,
        admins: [...prev.admins, memberId]
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign admin");
    }
  };

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
          <div className="flex justify-center -mt-12 mb-4 relative group w-max mx-auto">
            {user.avtar || groupDetails?.avtar ? (
              <img 
                src={groupDetails?.avtar || user.avtar} 
                alt={user.fullName} 
                className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shadow-lg">
                {user.isGroup ? <Users className="w-12 h-12 text-indigo-600 dark:text-indigo-400" /> : <User className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />}
              </div>
            )}
            
            {isAdmin && (
              <>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUpdating}
                  className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                  <span className="text-[10px] font-medium mt-1 uppercase">Change</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </>
            )}
          </div>

          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2 max-w-[200px] mx-auto">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1 rounded-lg text-lg font-bold outline-none ring-1 ring-indigo-500"
                    autoFocus
                  />
                  <button 
                    onClick={handleUpdateName}
                    disabled={isUpdating}
                    className="p-1.5 text-white bg-green-500 hover:bg-green-600 rounded-lg flex-shrink-0 transition-colors"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {user.fullName}
                  {isAdmin && (
                    <button 
                      onClick={() => setIsEditingName(true)}
                      className="p-1 text-gray-400 hover:text-indigo-500 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </h2>
              )}
            </div>
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
                    <div key={member._id} className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
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
                      
                      {isAdmin && !groupDetails.admins.includes(member._id) && (
                        <button
                          onClick={() => handleMakeAdmin(member._id)}
                          className="px-2 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                        >
                          Make Admin
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Block / Mute actions — for individual contacts only */}
          {!user.isGroup && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {/* Mute / Unmute */}
              <button
                onClick={async () => {
                  setIsActioning(true);
                  await muteUser(user._id);
                  setIsActioning(false);
                }}
                disabled={isActioning || isBlocked}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 ${
                  isMuted
                    ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                }`}
              >
                {isActioning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isMuted ? (
                  <><Bell className="w-4 h-4" /> Unmute</>
                ) : (
                  <><BellOff className="w-4 h-4" /> Mute</>
                )}
              </button>

              {/* Block / Unblock */}
              <button
                onClick={async () => {
                  setIsActioning(true);
                  if (isBlocked) {
                    await unblockUser(user._id);
                  } else {
                    await blockUser(user._id);
                    onClose();
                  }
                  setIsActioning(false);
                }}
                disabled={isActioning}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 ${
                  isBlocked
                    ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800"
                    : "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800"
                }`}
              >
                {isActioning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isBlocked ? (
                  <><Shield className="w-4 h-4" /> Unblock</>
                ) : (
                  <><ShieldOff className="w-4 h-4" /> Block</>
                )}
              </button>
            </div>
          )}

          {/* Blocked-by-them notice */}
          {!user.isGroup && isBlockedByThem && (
            <div className="mt-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <p className="text-xs text-amber-700 dark:text-amber-400 text-center font-medium">
                ⚠️ This user has restricted who can message them
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileViewer;
