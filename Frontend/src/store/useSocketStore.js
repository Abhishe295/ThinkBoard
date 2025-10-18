import { create } from 'zustand';
import { io } from 'socket.io-client';

const BASE_URL = import.meta.env.MODE === "development"
  ? "http://localhost:5001"
  : import.meta.env.VITE_BACKEND_URL;


export const useSocketStore = create((set,get)=>({
    socket: null,
    onlineUsers : [],

    connectSocket: (userId) => {
  if (!userId) {
    console.log("⚠️ No userId provided to connectSocket");
    return;
  }
  if (get().socket?.connected) {
    console.log("⚠️ Socket already connected");
    return;
  }

  console.log("🚀 Connecting socket to", BASE_URL, "with userId", userId);

  const socket = io(BASE_URL, {
    query: { userId },
    transports: ["websocket", "polling"]
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket connect error:", err.message);
  });

  // socket.connect();

  set({ socket: socket });

  socket.on("getOnlineUsers", (userIds) => {
    console.log("📡 Online users:", userIds);
    set({ onlineUsers: userIds });
  });
  return socket;
},


    disconnectSocket: ()=>{
        if (get().socket?.connected) get().socket.disconnect();
        

    },
    
}))