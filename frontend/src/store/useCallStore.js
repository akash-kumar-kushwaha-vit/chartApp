import { create } from "zustand";
import { useSocketStore } from "./useSocketStore";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";
import toast from "react-hot-toast";

const formatDuration = (ms) => {
  if (!ms) return "Missed";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const useCallStore = create((set, get) => ({
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  
  isReceivingCall: false,
  caller: null, // { _id, fullName, avtar, offer }
  
  isCalling: false,
  callTo: null, // { _id, fullName, avtar }
  
  callAccepted: false,
  callEnded: false,
  isVideoCall: true,
  callStartTime: null,
  
  initListeners: () => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;

    socket.on("incomingCall", async ({ from, offer, isVideoCall }) => {
      // If we're already in a call, we might want to automatically reject or notify busy.
      // For now, simple state.
      set({ 
        isReceivingCall: true, 
        caller: { ...from, offer },
        isVideoCall: isVideoCall !== undefined ? isVideoCall : true
      });
    });

    socket.on("callAccepted", async ({ answer }) => {
      set({ callAccepted: true, callStartTime: Date.now() });
      const pc = get().peerConnection;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("iceCandidate", async ({ candidate }) => {
      const pc = get().peerConnection;
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding received ice candidate", e);
        }
      }
    });

    socket.on("callEnded", () => {
      get().leaveCall();
      toast.error("Call ended.");
    });
  },

  setupMediaAndConnection: async (isVideo, targetUserId) => {
    try {
      // 1. Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
      set({ localStream: stream });

      // 2. Create Peer Connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      set({ peerConnection: pc });

      // 3. Add local tracks to pc
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // 4. Handle incoming remote tracks
      pc.ontrack = (event) => {
        set({ remoteStream: event.streams[0] });
      };

      // 5. Handle ICE candidates (send them to peer)
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const socket = useSocketStore.getState().socket;
          socket.emit("iceCandidate", {
            to: targetUserId,
            candidate: event.candidate,
          });
        }
      };

      return pc;
    } catch (error) {
      console.error("Error accessing media devices.", error);
      toast.error("Could not access camera/microphone.");
      get().leaveCall();
      return null;
    }
  },

  callUser: async (userToCall, isVideoCall = true) => {
    set({ isCalling: true, callTo: userToCall, callEnded: false, isVideoCall, callStartTime: null });
    const { authUser } = useAuthStore.getState();
    const socket = useSocketStore.getState().socket;

    const pc = await get().setupMediaAndConnection(isVideoCall, userToCall._id);
    if (!pc) return;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("callUser", {
        userToCall: userToCall._id,
        offer,
        from: authUser,
        isVideoCall
      });
    } catch (err) {
      console.error(err);
      get().leaveCall();
    }
  },

  answerCall: async () => {
    set({ callAccepted: true, isReceivingCall: false, callStartTime: Date.now() });
    const { caller, isVideoCall } = get();
    const socket = useSocketStore.getState().socket;

    const pc = await get().setupMediaAndConnection(isVideoCall, caller._id);
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(caller.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answerCall", {
        to: caller._id,
        answer,
      });
    } catch (err) {
      console.error(err);
      get().leaveCall();
    }
  },

  rejectCall: () => {
    const { caller } = get();
    const socket = useSocketStore.getState().socket;
    if (caller) {
      socket.emit("endCall", { to: caller._id });
    }
    set({ isReceivingCall: false, caller: null });
  },

  leaveCall: () => {
    const { peerConnection, localStream, callTo, caller, isCalling, isVideoCall, callStartTime } = get();
    const socket = useSocketStore.getState().socket;
    
    // Notify other peer
    const targetUserId = callTo?._id || caller?._id;
    if (targetUserId && socket) {
      socket.emit("endCall", { to: targetUserId });
    }

    // Save Call History into chat
    if (isCalling && callTo) {
      const duration = callStartTime ? (Date.now() - callStartTime) : 0;
      const durationStr = formatDuration(duration);
      const callType = isVideoCall ? "📹 Video Call" : "📞 Voice Call";
      
      const text = duration > 0 ? `${callType} (${durationStr})` : `Missed ${isVideoCall ? "Video" : "Voice"} Call`;
      
      // Auto-send history log to chat window
      useChatStore.getState().sendMessage({ text });
    }

    // Stop streams
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    // Close PC
    if (peerConnection) {
      peerConnection.close();
    }

    set({
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      isReceivingCall: false,
      caller: null,
      isCalling: false,
      callTo: null,
      callAccepted: false,
      callEnded: true,
      callStartTime: null
    });
  },
  
  resetCallState: () => {
     set({ callEnded: false });
  }
}));
