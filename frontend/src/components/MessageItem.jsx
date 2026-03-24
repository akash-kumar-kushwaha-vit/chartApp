import { useState, useRef, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { SmilePlus, Reply, Edit2, Trash2, X, Check, CheckCheck, FileText, Download, ChevronDown, Mic } from "lucide-react";

const renderMessageTime = (dateString, isEdited, updatedAtString) => {
  const targetDate = isEdited && updatedAtString ? updatedAtString : dateString;
  const time = new Date(targetDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return isEdited ? `${time} (edited)` : time;
};

const ReactionPicker = ({ onSelect, onClose }) => {
  const emojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
  return (
    <div className="absolute top-[110%] right-0 z-50 flex gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-100">
      {emojis.map((emoji) => (
        <button
          key={emoji}
          onClick={(e) => { e.stopPropagation(); onSelect(emoji); onClose(); }}
          className="hover:scale-125 transition-transform text-2xl px-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

const MessageItem = ({ message, isMe, authUser, selectedUser, setSelectedMedia, getDownloadUrl }) => {
  const { setReplyingTo, editMessage, deleteMessage, reactToMessage } = useChatStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || "");
  const [showMenu, setShowMenu] = useState(false);
  const [showReactPicker, setShowReactPicker] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
        setShowReactPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editText.trim() && editText !== message.text) {
      editMessage(message._id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleReact = (emoji) => {
    reactToMessage(message._id, emoji);
  };

  const isDeleted = message.isDeleted;

  return (
    <div className={`flex w-full ${isMe ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
        
        <div className="relative group flex items-start gap-1" ref={menuRef}>
          {/* Reaction Picker Trigger (WhatsApp Style - shows on hover next to bubble) */}
          {!isDeleted && isMe && (
            <div className={`opacity-0 group-hover:opacity-100 transition-opacity self-center mr-1 relative`}>
              <button 
                onClick={() => setShowReactPicker(!showReactPicker)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-full transition-colors"
                title="React"
              >
                <SmilePlus className="w-4 h-4" />
              </button>
              {showReactPicker && (
                <ReactionPicker onSelect={handleReact} onClose={() => setShowReactPicker(false)} />
              )}
            </div>
          )}

          {/* Actual Message Bubble */}
          <div className={`relative flex flex-col ${isMe ? "items-end" : "items-start"}`}>
            
            {/* The Bubble Container */}
            <div 
              className={`relative flex flex-col group/bubble shadow-sm ${
                isDeleted 
                  ? "bg-transparent border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-2xl italic text-gray-400 dark:text-gray-500 text-sm"
                  : isMe
                    ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-2xl rounded-tr-none px-2 pt-2 pb-1 min-w-[120px]"
                    : "bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-2xl rounded-tl-none px-2 pt-2 pb-1 min-w-[120px]"
              }`}
            >
              
              {/* WhatsApp-style Dropdown Icon (Shows on Hover inside bubble) */}
              {!isDeleted && (
                <div className={`absolute top-1 right-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity z-10 ${isMe ? 'bg-gradient-to-l from-[#d9fdd3] dark:from-[#005c4b]' : 'bg-gradient-to-l from-white dark:from-[#202c33]'} pl-2 pb-2 rounded-bl-xl`}>
                  <button 
                    onClick={() => {setShowMenu(!showMenu); setShowReactPicker(false)}}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                  
                  {/* Context Menu Dropdown */}
                  {showMenu && (
                    <div className={`absolute top-full mt-1 ${isMe ? "right-0" : "left-0"} w-36 bg-white dark:bg-[#233138] rounded-lg shadow-xl py-2 z-50 border border-gray-100 dark:border-gray-700/50`}>
                      <button 
                        onClick={() => { setReplyingTo(message); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-[#111b21] dark:text-[#d1d7db] hover:bg-gray-100 dark:hover:bg-[#182229] transition-colors"
                      >
                        Reply
                      </button>
                      <button 
                        onClick={() => { setShowReactPicker(true); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-[#111b21] dark:text-[#d1d7db] hover:bg-gray-100 dark:hover:bg-[#182229] transition-colors"
                      >
                        React
                      </button>
                      {isMe && (
                        <>
                          <button 
                            onClick={() => { setIsEditing(true); setShowMenu(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-[#111b21] dark:text-[#d1d7db] hover:bg-gray-100 dark:hover:bg-[#182229] transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => { deleteMessage(message._id); setShowMenu(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-[#182229] transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Sender Name in Group Chats */}
              {selectedUser.isGroup && !isMe && !isDeleted && message.senderId && (
                <div className="text-[12px] font-bold text-indigo-500 mb-0.5 whitespace-nowrap">
                  {message.senderId.fullName || "User"}
                </div>
              )}

              {/* Reply Block (WhatsApp style inside bubble) */}
              {message.replyTo && !isDeleted && (
                <div 
                  className={`mb-1 p-2 rounded-lg border-l-4 text-xs max-w-full truncate ${
                    isMe 
                      ? "bg-[#cfe9ba] dark:bg-[#025043] border-[#1d9a5b] dark:border-[#20b082] text-white" 
                      : "bg-[#f0f2f5] dark:bg-[#111b21] border-[#34B7F1] dark:border-[#35897E] text-white"
                  }`}
                >
                  <div className={`font-semibold mb-0.5 ${isMe ? "text-[#1d9a5b] dark:text-[#20b082]" : "text-[#34B7F1] dark:text-[#35897E]"}`}>
                    {message.replyTo.senderId?._id === selectedUser?._id ? selectedUser.fullName : message.replyTo.senderId?.fullName || 'You'}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">
                    {message.replyTo.text || (message.replyTo.image ? '📷 Photo' : message.replyTo.video ? '🎥 Video' : '📄 Document')}
                  </div>
                </div>
              )}

              {/* Deleted Message */}
              {isDeleted && (
                <span className="flex items-center gap-1">🚫 {message.text}</span>
              )}

              {/* Media Attachments */}
              {!isDeleted && message.image && (
                <img 
                  src={message.image} 
                  alt="Attachment" 
                  className="max-w-[200px] sm:max-w-[280px] rounded-xl mb-1 cursor-pointer" 
                  onClick={() => setSelectedMedia({ url: message.image, type: 'image' })}
                />
              )}
              {!isDeleted && message.video && (
                <video
                  src={message.video}
                  className="max-w-[200px] sm:max-w-[280px] rounded-xl mb-1 cursor-pointer"
                  onClick={() => setSelectedMedia({ url: message.video, type: 'video' })}
                />
              )}
              {!isDeleted && message.fileUrl && (
                <a
                  href={getDownloadUrl(message.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-black/5 dark:bg-white/5 rounded-xl mb-1 hover:bg-black/10 transition-colors"
                >
                  <FileText className="w-8 h-8 text-indigo-500" />
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm truncate">{message.fileName || "Document"}</p>
                    <p className="text-xs opacity-70">Download</p>
                  </div>
                </a>
              )}

              {!isDeleted && message.audioUrl && (
                <div className="mb-1 py-1">
                  <audio controls src={message.audioUrl} className={`w-[200px] sm:w-[250px] h-10`} />
                </div>
              )}

              {/* Text Area or Inline Edit */}
              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="flex flex-col gap-2 mt-1 min-w-[200px] max-w-[300px]">
                  <input 
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full text-sm p-2 rounded-lg bg-white dark:bg-[#2a3942] border-none focus:outline-none focus:ring-1 focus:ring-green-500 text-[#111b21] dark:text-[#e9edef]"
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setIsEditing(false)} className="p-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10">
                      <X className="w-4 h-4" />
                    </button>
                    <button type="submit" className="p-1.5 rounded-full bg-[#00a884] text-white hover:bg-[#008f6f]">
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                !isDeleted && message.text && (
                  <div className="px-1 py-0.5 text-[15px] leading-snug whitespace-pre-wrap pr-10">
                    {message.text}
                  </div>
                )
              )}

              {/* Time and Edited Tag */}
              <div className="flex justify-end items-center gap-1 mt-0.5 px-1 pb-0.5">
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  {renderMessageTime(message.createdAt, message.isEdited && !message.isDeleted, message.updatedAt)}
                </span>
                {/* Read Receipts */}
                {isMe && !isDeleted && (
                  <span className="-ml-0.5">
                    {message.status === 'sent' && <Check className="w-[14px] h-[14px] text-gray-400" />}
                    {message.status === 'delivered' && <CheckCheck className="w-[14px] h-[14px] text-gray-400" />}
                    {message.status === 'read' && <CheckCheck className="w-[14px] h-[14px] text-blue-500" />}
                  </span>
                )}
              </div>

            </div> {/* End Bubble Container */}

            {/* Reactions Display (WhatsApp style floating at bottom boundary of bubble) */}
            {!isDeleted && message.reactions && message.reactions.length > 0 && (
              <div className={`absolute -bottom-3 ${isMe ? "right-2" : "left-2"} flex items-center gap-0.5 bg-white dark:bg-[#202c33] px-1.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 shadow flex-wrap max-w-full z-20`}>
                {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emj => (
                  <span key={emj} className="text-[13px] leading-none">{emj}</span>
                ))}
                {message.reactions.length > 1 && (
                  <span className="text-[11px] text-gray-500 font-bold ml-0.5 leading-none">
                    {message.reactions.length}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Reaction Picker Trigger (WhatsApp Style - shows on hover next to bubble for receiver) */}
          {!isDeleted && !isMe && (
            <div className={`opacity-0 group-hover:opacity-100 transition-opacity self-center ml-1 relative`}>
              <button 
                onClick={() => setShowReactPicker(!showReactPicker)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-full transition-colors"
                title="React"
              >
                <SmilePlus className="w-4 h-4" />
              </button>
              {showReactPicker && (
                <ReactionPicker onSelect={handleReact} onClose={() => setShowReactPicker(false)} />
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MessageItem;
