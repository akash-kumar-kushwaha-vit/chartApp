import { X } from "lucide-react";

const MediaViewer = ({ media, onClose }) => {
  if (!media) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div 
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {media.type === 'video' ? (
          <video 
            src={media.url} 
            controls 
            autoPlay
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
          />
        ) : (
          <img 
            src={media.url} 
            alt="Viewed full screen" 
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain pointer-events-none"
          />
        )}
      </div>
    </div>
  );
};

export default MediaViewer;
