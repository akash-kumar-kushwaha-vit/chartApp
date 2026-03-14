import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useSocketStore } from "../store/useSocketStore";
import { Loader2, User, ArrowLeft, FileText, Download } from "lucide-react";
import MessageInput from "./MessageInput";

const TypingBubble = () => (
  <div className="flex justify-start">
    <div className="flex flex-col items-start max-w-[75%]">
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  </div>
);

const ChatWindow = () => {
  const { messages, getMessages, isMessagesLoading, selectedUser, setSelectedUser } = useChatStore();
  const { authUser } = useAuthStore();
  const { onlineUsers, typingUserId } = useSocketStore();
  const messageEndRef = useRef(null);

  const getDownloadUrl = (url) => {
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
      // Add fl_attachment to force download for PDFs/generic files to bypass Cloudinary's 401 view restriction
      return url.replace('/upload/', '/upload/fl_attachment/');
    }
    return url;
  };

  const isOnline = onlineUsers.includes(selectedUser._id);
  const isTyping = typingUserId === selectedUser._id;

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser._id, getMessages]);

  useEffect(() => {
    if (messageEndRef.current && (messages || isTyping)) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const renderMessageTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex justify-between items-center sm:hidden md:flex shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden p-2 -ml-2 text-gray-500"
            onClick={() => setSelectedUser(null)}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative">
            {selectedUser.avtar ? (
              <img src={selectedUser.avtar} alt={selectedUser.username} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            )}
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">{selectedUser.fullName}</h3>
            {isTyping ? (
              <p className="text-xs text-indigo-500 font-medium animate-pulse">typing...</p>
            ) : isOnline ? (
              <p className="text-xs text-green-500 font-medium">Online</p>
            ) : (
              <p className="text-xs text-gray-400 font-medium">Offline</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages Array */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isMessagesLoading ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full flex-col text-gray-500 gap-2">
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.senderId === authUser._id;
            return (
              <div key={message._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`flex flex-col max-w-[75%] sm:max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                  
                  {message.image && (
                    <img 
                      src={message.image} 
                      alt="Attachment" 
                      className={`max-w-[200px] sm:max-w-[250px] rounded-xl mb-1 border border-gray-200 dark:border-gray-700 ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}`} 
                    />
                  )}

                  {message.video && (
                    <video
                      src={message.video}
                      controls
                      className={`max-w-[260px] sm:max-w-[300px] rounded-xl mb-1 border border-gray-200 dark:border-gray-700 ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}`}
                    />
                  )}

                  {message.fileUrl && (
                    <a
                      href={getDownloadUrl(message.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={message.fileName || "Attachment"}
                      className={`flex items-center gap-3 p-3 max-w-[260px] sm:max-w-[300px] rounded-xl mb-1 border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity ${
                        isMe 
                          ? "bg-indigo-600/80 text-white rounded-br-sm" 
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm"
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${isMe ? "bg-white/20" : "bg-indigo-100 dark:bg-indigo-800"}`}>
                        <FileText className={`w-6 h-6 ${isMe ? "text-white" : "text-indigo-600 dark:text-indigo-300"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {message.fileName || "Attachment"}
                        </p>
                        <p className={`text-xs mt-0.5 flex items-center gap-1 ${isMe ? "text-indigo-100" : "text-gray-500 dark:text-gray-400"}`}>
                          <Download className="w-3 h-3" /> Download
                        </p>
                      </div>
                    </a>
                  )}

                  {message.text && (
                    <div
                      className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-gray-700"
                      }`}
                    >
                      {message.text}
                    </div>
                  )}
                  <span className="text-[10px] text-gray-400 mt-1 px-1">
                    {renderMessageTime(message.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Typing bubble */}
        {isTyping && <TypingBubble />}

        <div ref={messageEndRef} />
      </div>

      {/* Input Field */}
      <MessageInput />
    </div>
  );
};

export default ChatWindow;
