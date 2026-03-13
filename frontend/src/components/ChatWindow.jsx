import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Loader2, User, ArrowLeft } from "lucide-react";
import MessageInput from "./MessageInput";

const ChatWindow = () => {
  const { messages, getMessages, isMessagesLoading, selectedUser, setSelectedUser } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser._id, getMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">{selectedUser.fullName}</h3>
            <p className="text-xs text-green-500 font-medium">Online</p>
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
        <div ref={messageEndRef}></div>
      </div>

      {/* Input Field */}
      <MessageInput />
    </div>
  );
};

export default ChatWindow;
