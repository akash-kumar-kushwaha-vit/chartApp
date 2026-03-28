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
    <div className="h-full w-full max-w-7xl mx-auto sm:px-6 lg:px-8 sm:py-6 relative">
      <div className="bg-white dark:bg-gray-900 sm:border border-gray-200 dark:border-gray-800 sm:rounded-2xl shadow-xl overflow-hidden h-full flex flex-col md:flex-row shadow-gray-200 dark:shadow-black/50">
        
        {/* Sidebar container - hides on mobile when a user is selected */}
        <div className={`w-full md:w-80 border-r-0 md:border-r border-gray-200 dark:border-gray-800 flex-shrink-0 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
          <Sidebar />
        </div>

        {/* Chat window container - hides on mobile when NO user is selected */}
        <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-900/50 ${selectedUser ? 'flex' : 'hidden md:flex'}`}>
          {!selectedUser ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center p-8">
              <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                <span className="text-4xl">👋</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Welcome to WebChat!</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                  Select a conversation from the sidebar to start messaging.
                </p>
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
