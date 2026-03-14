import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { X, Camera, User, Pencil, CheckCircle2, Loader2 } from "lucide-react";

const ProfileModal = ({ isOpen, onClose }) => {
  const { authUser, updateProfile, isUpdatingProfile } = useAuthStore();

  const [fullName, setFullName] = useState("");
  const [status, setStatus] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarBase64, setAvatarBase64] = useState(null);
  const fileInputRef = useRef(null);

  // Sync current user data whenever modal opens
  useEffect(() => {
    if (isOpen && authUser) {
      setFullName(authUser.fullName || "");
      setStatus(authUser.status || "");
      setAvatarPreview(authUser.avtar || null);
      setAvatarBase64(null);
    }
  }, [isOpen, authUser]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setAvatarBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const payload = {};

    if (fullName.trim() !== (authUser?.fullName || "")) {
      payload.fullName = fullName.trim();
    }
    if (status !== (authUser?.status || "")) {
      payload.status = status;
    }
    if (avatarBase64) {
      payload.avatar = avatarBase64;
    }

    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    const success = await updateProfile(payload);
    if (success) onClose();
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-modal-in">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-6 pt-8 pb-16">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <h2 className="text-white font-bold text-xl">Edit Profile</h2>
          <p className="text-white/70 text-sm mt-0.5">Update your info anytime</p>
        </div>

        {/* Avatar overlapping header */}
        <div className="flex justify-center -mt-12 mb-4 relative z-10">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full ring-4 ring-white dark:ring-gray-900 overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {getInitials(fullName || authUser?.fullName)}
                </span>
              )}
            </div>

            {/* Camera overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>

            {/* Camera badge */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center shadow-md transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                maxLength={60}
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              />
              <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Status
            </label>
            <div className="relative">
              <input
                type="text"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Hey there! I'm using ChatApp"
                maxLength={150}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              />
            </div>
            <p className="text-xs text-right text-gray-400">{status.length}/150</p>
          </div>

          {/* Username & Email (read-only info) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Username</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                @{authUser?.username || "—"}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Email</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                {authUser?.email || "—"}
              </p>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isUpdatingProfile || !fullName.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all flex items-center justify-center gap-2"
          >
            {isUpdatingProfile ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-in {
          animation: modal-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ProfileModal;
