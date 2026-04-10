import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useSocketStore } from "../store/useSocketStore";
import { useCallStore } from "../store/useCallStore";
import { Loader2, User, ArrowLeft, Search, X, Video, Phone, Lock } from "lucide-react";
import MessageInput from "./MessageInput";
import MediaViewer from "./MediaViewer";
import ProfileViewer from "./ProfileViewer";
import MessageItem from "./MessageItem";

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
  const { messages, getMessages, isMessagesLoading, hasMoreMessages, selectedUser, setSelectedUser } = useChatStore();
  const { authUser } = useAuthStore();
  const { callUser } = useCallStore();
  const { onlineUsers, typingUserId } = useSocketStore();
  const messageEndRef = useRef(null);
  const observerTarget = useRef(null);
  const lastMessageIdRef = useRef(null);

  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isProfileViewerOpen, setIsProfileViewerOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [skip, setSkip] = useState(0);

  const getDownloadUrl = (url) => {
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/fl_attachment/');
    }
    return url;
  };

  const isOnline = onlineUsers.includes(selectedUser._id);
  const isTyping = typingUserId === selectedUser._id;

  // Initial Fetch & Search Fetch
  useEffect(() => {
    if (selectedUser) {
      setSkip(0);
      getMessages(selectedUser._id, { skip: 0, limit: 50, search: searchQuery });
    }
  }, [selectedUser._id, getMessages, searchQuery]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreMessages && !isMessagesLoading) {
          const newSkip = skip + 50;
          setSkip(newSkip);
          getMessages(selectedUser._id, { skip: newSkip, limit: 50, search: searchQuery });
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [observerTarget.current, hasMoreMessages, isMessagesLoading, skip, selectedUser._id, searchQuery, getMessages]);


  // Safe Bottom Scroll (Avoid scrolling up during pagination)
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    const isPaginationPrepending = messages.length > 1 && lastMessage._id === lastMessageIdRef.current && skip > 0;

    if (messageEndRef.current && (!isPaginationPrepending || isTyping)) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    
    lastMessageIdRef.current = lastMessage._id;
  }, [messages, isTyping, skip]);

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-hidden relative"
      style={authUser?.chatWallpaper ? {
        backgroundImage: `url(${authUser.chatWallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : {
        backgroundImage: 'url("https://static.whatsapp.net/rsrc.php/v3/yl/r/r_QZ3OGC0XU.png")',
        backgroundRepeat: 'repeat',
        backgroundSize: 'contain'
      }}
    >
      {/* Wallpaper overlay to guarantee text readability */}
      {authUser?.chatWallpaper ? (
         <div className="absolute inset-0 bg-white/40 dark:bg-black/50 pointer-events-none z-0" />
      ) : (
         <div className="absolute inset-0 bg-[#efeae2]/50 dark:bg-[#0b141a]/80 pointer-events-none z-0" />
      )}

      {/* Header */}
      <div className="relative z-10 h-[59px] px-4 py-2 border-b border-[#d1d7db] dark:border-[#202c33] bg-[#f0f2f5] dark:bg-[#202c33] flex items-center shadow-sm w-full flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 w-full">
          <button 
            className="md:hidden p-1.5 sm:p-2 -ml-2 text-[#54656f] dark:text-[#aebac1] flex-shrink-0"
            onClick={() => setSelectedUser(null)}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          {showSearch ? (
            <div className="flex-1 flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search messages..."
                  className="w-full pl-9 pr-3 py-1.5 bg-gray-100 dark:bg-gray-800 border-transparent rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                {selectedUser.avtar ? (
                  <img 
                    src={selectedUser.avtar} 
                    alt={selectedUser.username} 
                    className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all" 
                    onClick={() => setIsProfileViewerOpen(true)}
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                    onClick={() => setIsProfileViewerOpen(true)}
                  >
                    <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                )}
                {!selectedUser.isGroup && isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                )}
              </div>
              <div 
                className="cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0"
                onClick={() => setIsProfileViewerOpen(true)}
              >
                <h3 className="font-medium text-[16px] text-[#111b21] dark:text-[#e9edef] leading-tight truncate">{selectedUser.fullName}</h3>
                {selectedUser.isGroup ? (
                  isTyping ? (
                    <p className="text-[13px] text-[#00a884] font-medium animate-pulse">someone is typing...</p>
                  ) : (
                    <p className="text-[13px] text-[#667781] dark:text-[#8696a0]">Click here for group info</p>
                  )
                ) : (
                  isTyping ? (
                    <p className="text-[13px] text-[#00a884] font-medium animate-pulse">typing...</p>
                  ) : isOnline ? (
                    <p className="text-[13px] text-[#667781] dark:text-[#8696a0]">online</p>
                  ) : (
                    <p className="text-[13px] text-[#667781] dark:text-[#8696a0]">offline</p>
                  )
                )}
                {!selectedUser.isGroup && selectedUser.publicKey && (
                  <p className="text-[11px] text-[#667781] dark:text-[#8696a0] flex items-center gap-0.5 leading-none mt-0.5">
                    <Lock className="w-[10px] h-[10px]" /> End-to-end encrypted
                  </p>
                )}
              </div>
              
              {!selectedUser.isGroup && (
                <>
                  <button 
                    onClick={() => callUser(selectedUser, false)}
                    className="p-2 text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors ml-auto flex-shrink-0"
                    title="Voice Call"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => callUser(selectedUser, true)}
                    className="p-2 text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors flex-shrink-0"
                    title="Video Call"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                </>
              )}
              
              <button 
                onClick={() => setShowSearch(true)} 
                className={`p-2 text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors flex-shrink-0 ${selectedUser.isGroup ? 'ml-auto' : ''}`}
                title="Search Messages"
              >
                <Search className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages Array */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-6 flex flex-col">
        {hasMoreMessages && !isMessagesLoading && messages.length >= 50 && (
          <div ref={observerTarget} className="h-4 w-full flex-shrink-0" />
        )}
        {isMessagesLoading && skip > 0 && (
          <div className="w-full flex justify-center py-2 flex-shrink-0">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          </div>
        )}
        {isMessagesLoading ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full flex-col text-gray-500 gap-2">
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem 
              key={message._id}
              message={message}
              isMe={(message.senderId?._id || message.senderId) === authUser._id}
              authUser={authUser}
              selectedUser={selectedUser}
              setSelectedMedia={setSelectedMedia}
              getDownloadUrl={getDownloadUrl}
            />
          ))
        )}

        {/* Typing bubble */}
        {isTyping && <TypingBubble />}

        <div ref={messageEndRef} />
      </div>

      {/* Input Field */}
      <div className="relative z-10">
        <MessageInput />
      </div>

      {/* Viewers */}
      <MediaViewer 
        media={selectedMedia} 
        onClose={() => setSelectedMedia(null)} 
      />
      
      {isProfileViewerOpen && (
        <ProfileViewer 
          user={selectedUser} 
          onClose={() => setIsProfileViewerOpen(false)} 
        />
      )}
    </div>
  );
};

export default ChatWindow;
