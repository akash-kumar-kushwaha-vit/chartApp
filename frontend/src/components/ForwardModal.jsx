import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Search, Check, Send } from "lucide-react";

const ForwardModal = () => {
  const { forwardMessageData, setForwardMessageData, users, forwardMessage } = useChatStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSending, setIsSending] = useState(false);

  if (!forwardMessageData) return null;

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleForward = async () => {
    if (selectedIds.length === 0) return;
    setIsSending(true);
    // Forward sequentially to avoid rate-limiting issues or overloading the server,
    // Alternatively, this could be refactored to Promise.all
    for (const id of selectedIds) {
      const targetUser = users.find(u => u._id === id);
      if (targetUser) {
        await forwardMessage(targetUser._id, targetUser.isGroup || false, forwardMessageData);
      }
    }
    setIsSending(false);
    setForwardMessageData(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setForwardMessageData(null)} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-t-2xl">
          <h2 className="font-semibold text-gray-900 dark:text-white">Forward Message</h2>
          <button onClick={() => setForwardMessageData(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts or groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredUsers.map(user => (
            <div 
              key={user._id}
              onClick={() => toggleSelect(user._id)}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl cursor-pointer transition-colors"
            >
              <div className="relative w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex flex-shrink-0 items-center justify-center overflow-hidden">
                {user.avtar ? (
                  <img src={user.avtar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {user.fullName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 font-medium text-sm text-gray-900 dark:text-white">
                {user.fullName}
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedIds.includes(user._id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}`}>
                {selectedIds.includes(user._id) && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <p className="p-4 text-center text-gray-500 text-sm">No contacts found.</p>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {selectedIds.length} selected
          </span>
          <button
            onClick={handleForward}
            disabled={selectedIds.length === 0 || isSending}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
          >
            {isSending ? "Forwarding..." : "Forward"} <Send className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;
