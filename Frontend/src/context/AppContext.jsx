import { createContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useSocketStore } from "../store/useSocketStore";
import { useNavigate } from "react-router";
import { useCallStore } from "../store/useCallStore";

export const AppContent = createContext();

export const AppContextProvider = (props) => {
  axios.defaults.withCredentials = true;
 const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
  const [isLoggedin, setIsLoggedin] = useState(false);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const {setIncomingCall} = useCallStore();

  // pull socket, connect, disconnect from store so there's a single socket instance
  const { socket, connectSocket, disconnectSocket } = useSocketStore();
  const navigate = useNavigate();

  const getAuthState = async () => {
  setAuthLoading(true);
  try {
    const { data } = await axios.get(backendUrl + "/api/auth/is-auth");
    if (data.success) {
      setIsLoggedin(true);
      await getUserData();
    } else {
      setIsLoggedin(false);
    }
  } catch (error) {
    console.log(error);
    setIsLoggedin(false);
  } finally {
    setAuthLoading(false);
  }
};

  const getUserData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/data");
      if (data.success) {
        setUserData(data.userData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
      console.log(error);
    }
  };

  const updateMyLocation = async ()=>{
    if (!navigator.geolocation){
      toast.error("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos)=>{
      try {
        const { latitude, longitude} = pos.coords;
        await axios.post(
          backendUrl + '/api/auth/location',
          { lat: latitude, lng: longitude},
          {withCredentials: true}
        );
        console.log("Location updated", latitude, longitude);
      } catch (error) {
        console.error("Error updating location:",error);
        
      }
    })
  }

  useEffect(() => {
  if (userData?._id) {
    console.log("Connecting socket with userId:", userData._id);
    const activeSocket = connectSocket(userData._id); // use returned socket

    const onIncoming = (payload) => {
      console.log("Incoming call (AppContext):", payload);
      setIncomingCall(payload)
    };

    activeSocket?.on("call:incoming", onIncoming);

    return () => {
      console.log("Disconnecting socket");
      activeSocket?.off("call:incoming", onIncoming);
      disconnectSocket();
    };
  }
}, [userData?._id]);


  useEffect(() => {
    getAuthState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    backendUrl,
    isLoggedin,
    setIsLoggedin,
    userData,
    setUserData,
    getUserData,
    socket, // expose socket so other hooks/components can use same instance
    updateMyLocation,
    authLoading,
  };

  return (
    <AppContent.Provider value={value}>
      {props.children}
    </AppContent.Provider>
  );
};
