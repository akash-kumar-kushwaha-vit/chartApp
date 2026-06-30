import { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import ForwardModal from "../components/ForwardModal";
import { useChatStore } from "../store/useChatStore";

const ChatDashboard = () => {
  const { selectedUser, getUnreadCounts } = useChatStore();

  useEffect(() => {
    getUnreadCounts();
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [getUnreadCounts]);

  return (
    // Full-screen container — no inner card on mobile, card only on desktop
    <div className="h-full w-full relative overflow-hidden bg-[#e3e2de] dark:bg-[#0b141a] flex justify-center items-center">
      
      {/* Green top bar — desktop only */}
      <div className="absolute top-0 left-0 w-full h-[127px] bg-[#00a884] dark:bg-[#202c33] hidden md:block" />

      {/* 
        Main container
        - Mobile: full screen, no padding, no rounded corners
        - Desktop: card with margin & rounded corners (WhatsApp Web style)
      */}
      <div className="
        w-full h-full
        md:w-[calc(100%-2rem)] md:h-[calc(100%-2rem)]
        xl:w-[calc(100%-4rem)] xl:h-[calc(100%-4rem)]
        max-w-[1600px]
        flex overflow-hidden shadow-none md:shadow-2xl
        bg-white dark:bg-[#111b21] relative z-10
        md:rounded-sm
      ">

        {/* ── SIDEBAR ─────────────────────────────────────────────
          Mobile  : full-screen, slides away when a chat is selected
          Desktop : fixed-width column always visible
        */}
        <div
          className={`
            /* Layout */
            flex flex-col h-full
            /* Mobile: full width, absolute, slide in/out */
            absolute inset-0
            /* Desktop: static column */
            md:relative md:inset-auto
            md:w-[350px] lg:w-[400px] xl:w-[450px] md:flex-shrink-0
            border-r border-[#d1d7db] dark:border-[#202c33]
            bg-white dark:bg-[#111b21]
            /* Transition for mobile swipe feel */
            transition-transform duration-300 ease-in-out
            z-20
            ${selectedUser
              ? '-translate-x-full md:translate-x-0'   // hidden on mobile when chat open
              : 'translate-x-0'                          // visible
            }
          `}
        >
          <Sidebar />
        </div>

        {/* ── CHAT WINDOW ──────────────────────────────────────────
          Mobile  : full-screen, slides in from the right when a chat is selected
          Desktop : fills remaining space
        */}
        <div
          className={`
            /* Layout */
            flex-1 flex flex-col min-w-0 h-full
            bg-[#efeae2] dark:bg-[#0b141a]
            /* Mobile: absolute overlay, slides in */
            absolute inset-0
            /* Desktop: static */
            md:relative md:inset-auto
            transition-transform duration-300 ease-in-out
            z-10
            ${selectedUser
              ? 'translate-x-0'            // visible
              : 'translate-x-full md:translate-x-0'  // off-screen on mobile, visible on desktop
            }
          `}
        >
          {!selectedUser ? (
            /* Desktop empty state — not visible on mobile since translate-x-full hides it */
            <div className="flex-1 flex items-center justify-center flex-col gap-6 text-center p-8 bg-[#f0f2f5] dark:bg-[#222e35] border-b-[6px] border-[#00a884]">
              <div>
                <h3 className="text-[32px] font-light text-[#41525d] dark:text-[#e9edef] mt-8 mb-4">
                  Chat App
                </h3>
                <p className="text-[#667781] dark:text-[#8696a0] max-w-md mx-auto text-[14px] leading-relaxed">
                  Send and receive messages without keeping your phone online.<br />
                  Select a chat from the sidebar to start messaging.
                </p>
              </div>
              <div className="absolute bottom-10 text-[#8696a0] text-[13px] flex items-center gap-1">
                🔒 Your personal messages are end-to-end encrypted
              </div>
            </div>
          ) : (
            <ChatWindow />
          )}
        </div>

        <ForwardModal />
      </div>
    </div>
  );
};

export default ChatDashboard;
