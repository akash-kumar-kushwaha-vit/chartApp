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
    <div className="h-full w-full relative overflow-hidden bg-[#e3e2de] dark:bg-[#0b141a] flex justify-center items-center">
      {/* Background graphic for WhatsApp Desktop effect */}
      <div className="absolute top-0 left-0 w-full h-[127px] bg-[#00a884] dark:bg-[#202c33] hidden md:block" />

      {/* Container - WhatsApp Web style: shadow-xl bounded on huge screens, full edge-to-edge on regular screens */}
      <div className="w-full h-full md:w-[calc(100%-2rem)] md:h-[calc(100%-2rem)] xl:w-[calc(100%-4rem)] xl:h-[calc(100%-4rem)] max-w-[1600px] flex overflow-hidden shadow-2xl bg-white dark:bg-[#111b21] relative z-10 md:rounded-sm">
        
        {/* Sidebar container - WhatsApp specifically uses ~30% width minimum */}
        <div className={`w-full md:w-[350px] lg:w-[400px] xl:w-[450px] border-r border-[#d1d7db] dark:border-[#202c33] flex-shrink-0 flex flex-col bg-white dark:bg-[#111b21] h-full ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
          <Sidebar />
        </div>

        {/* Chat window container */}
        <div className={`flex-1 flex flex-col min-w-0 h-full bg-[#efeae2] dark:bg-[#0b141a] relative ${selectedUser ? 'flex' : 'hidden md:flex'}`}>
          {!selectedUser ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-6 text-center p-8 bg-[#f0f2f5] dark:bg-[#222e35] border-b-[6px] border-[#00a884]">
              {/* WhatsApp empty state */}
              <div>
                <h3 className="text-[32px] font-light text-[#41525d] dark:text-[#e9edef] mt-8 mb-4">WebChat App</h3>
                <p className="text-[#667781] dark:text-[#8696a0] max-w-md mx-auto text-[14px] leading-relaxed">
                  Send and receive messages without keeping your phone online.<br/>
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
