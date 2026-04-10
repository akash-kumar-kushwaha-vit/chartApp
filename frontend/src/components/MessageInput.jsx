import { useState, useRef, useCallback, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useSocketStore } from "../store/useSocketStore";
import { Send, Image as ImageIcon, X, Film, File as FileIcon, Mic, Plus, ShieldOff, Shield } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const attachmentMenuRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const { sendMessage, selectedUser, replyingTo, setReplyingTo, blockUser, unblockUser } = useChatStore();
  const { socket } = useSocketStore();

  const isBlocked = selectedUser?.isBlocked || false;
  const isBlockedByThem = selectedUser?.isBlockedByThem || false;
  const isAnyBlock = isBlocked || isBlockedByThem;

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRecording]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleGenericFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileData(file);
    setFilePreview(file.name);
  };

  const removeMedia = () => {
    setImagePreview(null);
    setImageFile(null);
    setVideoPreview(null);
    setVideoFile(null);
    setFilePreview(null);
    setFileData(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    
    // Typing indicator logic
    if (socket && selectedUser && !isRecording && !audioBlob) {
      socket.emit("typing", { 
        receiverId: selectedUser._id, 
        isGroup: selectedUser.isGroup 
      });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { 
          receiverId: selectedUser._id, 
          isGroup: selectedUser.isGroup 
        });
      }, 2000);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        clearInterval(recordingTimerRef.current);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Microphone permission denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imageFile && !videoFile && !fileData && !audioBlob) return;

    try {
      if (imageFile || videoFile || fileData || audioBlob) {
        const formData = new FormData();
        if (text.trim()) formData.append("text", text.trim());
        if (imageFile) formData.append("image", imageFile);
        if (videoFile) formData.append("video", videoFile);
        if (fileData) formData.append("file", fileData);
        if (audioBlob) formData.append("audio", audioBlob, "voice-note.webm");
        
        await sendMessage(formData);
      } else {
        await sendMessage({ text: text.trim() });
      }

      setText("");
      removeMedia();
      setAudioBlob(null);
      setIsRecording(false);
    } catch (error) {
       console.error("Failed to send message:", error);
    }
  };

  // If blocked in either direction, show a banner instead of the input
  if (isAnyBlock && !selectedUser?.isGroup) {
    return (
      <div className="px-3 py-3 sm:px-4 sm:py-4 bg-[#f0f2f5] dark:bg-[#202c33] pb-[max(0.75rem,env(safe-area-inset-bottom))] flex-shrink-0">
        <div className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl border ${
          isBlocked
            ? "bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-800/50"
            : "bg-amber-50 dark:bg-amber-900/15 border-amber-200 dark:border-amber-800/50"
        }`}>
          <ShieldOff className={`w-4 h-4 flex-shrink-0 ${isBlocked ? "text-red-500" : "text-amber-500"}`} />
          <p className={`text-sm font-medium ${isBlocked ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
            {isBlocked
              ? "You have blocked this user."
              : "You can't send messages to this user."}
          </p>
          {isBlocked && (
            <button
              onClick={() => unblockUser(selectedUser._id)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg transition-colors flex-shrink-0"
            >
              <Shield className="w-3.5 h-3.5" />
              Unblock
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-2.5 sm:px-4 sm:py-3 bg-[#f0f2f5] dark:bg-[#202c33] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-3 flex-shrink-0">
      
      {/* Replying Banner */}
      {replyingTo && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-indigo-500 relative flex flex-col gap-1 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Replying to {replyingTo.senderId === selectedUser?._id ? selectedUser.fullName : 'Yourself'}
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-full italic">
            {replyingTo.text || (replyingTo.image ? '📷 Image' : replyingTo.video ? '🎥 Video' : '📄 File')}
          </p>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
            />
            <button
              onClick={removeMedia}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-red-500 border border-gray-300 dark:border-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Video Preview */}
      {videoPreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <video
              src={videoPreview}
              className="w-32 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              muted
            />
            <button
              onClick={removeMedia}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-red-500 border border-gray-300 dark:border-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded">VIDEO</div>
          </div>
        </div>
      )}

      {/* File Preview */}
      {filePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative bg-gray-100 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-3 pr-8">
            <FileIcon className="w-8 h-8 text-indigo-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[150px] truncate">
              {filePreview}
            </span>
            <button
              onClick={removeMedia}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-red-500 border border-gray-300 dark:border-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-1 sm:gap-2">
        {/* Mobile-friendly Attachment Menu */}
        <div className="relative" ref={attachmentMenuRef}>
          <button
            type="button"
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            className="p-1.5 sm:p-2 text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-transform duration-200 flex-shrink-0"
            style={{ transform: showAttachmentMenu ? 'rotate(45deg)' : 'rotate(0deg)' }}
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {showAttachmentMenu && (
            <div className="absolute bottom-[calc(100%+0.5rem)] left-0 min-w-[160px] bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-bottom-2">
              <button
                type="button"
                onClick={() => { imageInputRef.current?.click(); setShowAttachmentMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400">
                  <ImageIcon className="w-[18px] h-[18px]" />
                </div>
                Gallery
              </button>
              <button
                type="button"
                onClick={() => { videoInputRef.current?.click(); setShowAttachmentMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="p-1.5 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400">
                  <Film className="w-[18px] h-[18px]" />
                </div>
                Video
              </button>
              <button
                type="button"
                onClick={() => { fileInputRef.current?.click(); setShowAttachmentMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="p-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400">
                  <FileIcon className="w-[18px] h-[18px]" />
                </div>
                Document
              </button>
            </div>
          )}
        </div>

        {/* Hidden Data Inputs */}
        <input type="file" accept="image/*" className="hidden" ref={imageInputRef} onChange={handleImageChange} />
        <input type="file" accept="video/*" className="hidden" ref={videoInputRef} onChange={handleVideoChange} />
        <input type="file" className="hidden" ref={fileInputRef} onChange={handleGenericFileChange} />

        {isRecording ? (
          <div className="flex-1 flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-xl py-3 px-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-500">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium">Recording {formatDuration(recordingDuration)}</span>
            </div>
            <button type="button" onClick={stopRecording} className="text-sm font-semibold text-red-600 dark:text-red-400 hover:underline">
              Stop
            </button>
          </div>
        ) : audioBlob ? (
          <div className="flex-1 flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl py-2 px-4 border border-indigo-200 dark:border-indigo-800">
             <audio controls src={URL.createObjectURL(audioBlob)} className="h-8 max-w-full" />
             <button type="button" onClick={() => setAudioBlob(null)} className="p-1 rounded-full text-gray-500 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
               <X className="w-4 h-4" />
             </button>
          </div>
        ) : (
          <input
            type="text"
            className="w-full bg-white dark:bg-[#2a3942] border-transparent rounded-lg text-sm text-[#111b21] dark:text-[#e9edef] placeholder-[#8696a0] focus:ring-1 focus:ring-[#00a884] transition-all outline-none py-2.5 px-4"
            placeholder="Type a message"
            value={text}
            onChange={handleTextChange}
            disabled={isRecording || audioBlob}
          />
        )}

        {(!text.trim() && !imageFile && !videoFile && !fileData && !audioBlob) && !isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="p-2 sm:p-2.5 text-[#54656f] dark:text-[#aebac1] hover:text-[#00a884] rounded-full transition-colors flex-shrink-0"
            title="Record Voice Note"
          >
            <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!text.trim() && !imageFile && !videoFile && !fileData && !audioBlob}
            className="p-2 sm:p-2.5 text-[#00a884] hover:text-[#008f6f] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </form>
    </div>
  );
};

export default MessageInput;
