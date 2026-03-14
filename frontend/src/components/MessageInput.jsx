import { useState, useRef, useCallback } from "react";
import { useChatStore } from "../store/useChatStore";
import { useSocketStore } from "../store/useSocketStore";
import { Send, Image as ImageIcon, X, Film, File as FileIcon } from "lucide-react";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileData, setFileData] = useState(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { sendMessage, selectedUser } = useChatStore();
  const { socket } = useSocketStore();

  const emitStopTyping = useCallback(() => {
    if (socket && selectedUser) {
      socket.emit("stopTyping", { receiverId: selectedUser._id });
    }
  }, [socket, selectedUser]);

  const handleTextChange = (e) => {
    setText(e.target.value);

    // Emit typing event
    if (socket && selectedUser) {
      socket.emit("typing", { receiverId: selectedUser._id });
    }

    // Clear previous timeout and set a new one to stop typing after 2s
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(emitStopTyping, 2000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVideoFile(null);
    setVideoPreview(null);
    setFileData(null);
    setFilePreview(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(null);
    setImagePreview(null);
    setFileData(null);
    setFilePreview(null);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
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

  const handleGenericFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(null);
    setImagePreview(null);
    setVideoFile(null);
    setVideoPreview(null);
    setFileData(file);
    setFilePreview(file.name);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imageFile && !videoFile && !fileData) return;

    // Stop typing indicator on send
    emitStopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const formData = new FormData();
    if (text.trim()) formData.append("text", text.trim());
    if (imageFile) formData.append("image", imageFile);
    if (videoFile) formData.append("video", videoFile);
    if (fileData) formData.append("file", fileData);

    await sendMessage(formData);

    setText("");
    removeMedia();
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
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

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        {/* Image button */}
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          title="Attach image"
          className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
        >
          <ImageIcon className="w-6 h-6" />
        </button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={imageInputRef}
          onChange={handleImageChange}
        />

        {/* Video button */}
        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          title="Attach video"
          className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
        >
          <Film className="w-6 h-6" />
        </button>
        <input
          type="file"
          accept="video/*"
          className="hidden"
          ref={videoInputRef}
          onChange={handleVideoChange}
        />

        {/* File button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
          className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
        >
          <FileIcon className="w-6 h-6" />
        </button>
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleGenericFileChange}
        />

        <input
          type="text"
          className="w-full bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-900 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none py-3 px-4"
          placeholder="Type a message..."
          value={text}
          onChange={handleTextChange}
        />

        <button
          type="submit"
          disabled={!text.trim() && !imageFile && !videoFile && !fileData}
          className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
