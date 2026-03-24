import { useEffect, useRef, useState } from "react";
import { useCallStore } from "../store/useCallStore";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";

const VideoCallManager = () => {
  const { 
    isReceivingCall, caller, isCalling, callTo, callAccepted, callEnded, 
    localStream, remoteStream, answerCall, rejectCall, leaveCall, resetCallState,
    isVideoCall
  } = useCallStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    if (callEnded) {
      setTimeout(() => resetCallState(), 2000);
    }
  }, [callEnded, resetCallState]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callAccepted, isCalling]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callAccepted]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = isVideoOff;
      setIsVideoOff(!isVideoOff);
    }
  };

  // 1. INCOMING CALL MODAL
  if (isReceivingCall && !callAccepted && !callEnded) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 flex flex-col items-center shadow-2xl w-full max-w-sm text-center">
          <div className="relative mb-6">
            {caller?.avtar ? (
              <img src={caller.avtar} alt="caller" className="w-28 h-28 rounded-full object-cover shadow-lg border-4 border-indigo-500 animate-pulse" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-indigo-500 flex items-center justify-center text-4xl text-white font-bold animate-pulse">
                {caller?.fullName?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 rounded-full ring-4 ring-indigo-500 animate-ping opacity-30"></div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{caller?.fullName}</h2>
          <p className="text-sm font-medium text-gray-500 mb-8">Incoming {isVideoCall ? "video" : "voice"} call...</p>
          
          <div className="flex gap-8 w-full justify-center">
            <button 
              onClick={rejectCall} 
              className="flex flex-col items-center gap-2 group"
            >
              <div className="bg-red-500 text-white p-4 rounded-full shadow-lg group-hover:bg-red-600 transition-colors">
                <PhoneOff className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Decline</span>
            </button>
            <button 
              onClick={answerCall} 
              className="flex flex-col items-center gap-2 group animate-bounce"
            >
              <div className="bg-green-500 text-white p-4 rounded-full shadow-lg group-hover:bg-green-600 transition-colors">
                {isVideoCall ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
              </div>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Accept</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE VIDEO CALL OR OUTGOING CALL UI
  if (isCalling || callAccepted || callEnded) {
    const activeTarget = callTo || caller;

    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
        
        {/* Remote Video Background */}
        {callAccepted && remoteStream && isVideoCall ? (
          <video 
            playsInline 
            autoPlay 
            ref={remoteVideoRef} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
             {activeTarget?.avtar ? (
                <img src={activeTarget.avtar} alt="contact" className="w-32 h-32 rounded-full object-cover shadow-lg mb-6 border-4 border-gray-700" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center text-5xl text-white mb-6">
                  {activeTarget?.fullName?.[0]?.toUpperCase()}
                </div>
              )}
             <h2 className="text-3xl font-bold text-white mb-2">{activeTarget?.fullName}</h2>
             <p className="text-gray-400">
               {callEnded ? "Call ended." : (callAccepted ? (isVideoCall ? "Video Call connected" : "Voice Call connected") : "Calling...")}
             </p>
          </div>
        )}

        {/* Local Video Picture-in-Picture */}
        {localStream && !callEnded && isVideoCall && (
          <div className="absolute bottom-32 right-6 w-32 sm:w-48 overflow-hidden rounded-2xl shadow-2xl border-2 border-gray-600 bg-gray-900 z-10 transition-all hover:scale-105">
            <video 
              playsInline 
              muted 
              autoPlay 
              ref={localVideoRef} 
              className={`w-full h-full object-cover ${isVideoOff ? 'opacity-0' : 'opacity-100'} transform scale-x-[-1]`}
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                 <VideoOff className="w-8 h-8 text-gray-500" />
              </div>
            )}
          </div>
        )}

        {/* Call Controls Overlay */}
        {!callEnded && (
           <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-gray-900/80 backdrop-blur-md px-8 py-4 rounded-full shadow-2xl z-20">
             <button 
               onClick={toggleMute} 
               className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
             >
               {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
             </button>
             
             <button 
               onClick={leaveCall} 
               className="p-5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-transform hover:scale-110"
             >
               <PhoneOff className="w-8 h-8" />
             </button>
             
             {isVideoCall && (
               <button 
                 onClick={toggleVideo} 
                 className={`p-4 rounded-full transition-colors ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
               >
                 {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
               </button>
             )}
           </div>
        )}
      </div>
    );
  }

  return null;
};

export default VideoCallManager;
