// src/pages/CallPage.jsx
import React, { useEffect, useRef, useState, useContext } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { useSocketStore } from "../store/useSocketStore";
import { useCallStore } from "../store/useCallStore";
import { AppContent } from "../context/AppContext";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  PhoneCall,
  User,
  Loader2,
} from "lucide-react";

const ICE_CONFIG = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

const CallPage = () => {
  const { callId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { userData } = useContext(AppContent);
  const { socket } = useSocketStore();
  const { setActiveCall, clearActiveCall, setIncomingCall, clearIncomingCall, incomingCall } = useCallStore();

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]); // queued ICE candidates that arrived early

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null); // for audio-only calls
  const micAnalyzeRef = useRef(null);

  const [isCaller, setIsCaller] = useState(location.state?.isCaller || false);
  const [peerId, setPeerId] = useState(location.state?.peerId || null);
  const [callType, setCallType] = useState(location.state?.callType || "audio");

  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [callStatus, setCallStatus] = useState("connecting");
  const [callDuration, setCallDuration] = useState(0);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);

  // -------------------- Helpers --------------------

  const ensureLocalStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const constraints =
        callType === "video"
          ? { audio: true, video: { width: 640, height: 480 } }
          : { audio: true, video: false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      // attach to local video element if present (only meaningful for video calls)
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // mic analyzer (keeps running)
      try {
        const AudioCtx = window.AudioContext || window.AudioContext;
        const audioContext = new AudioCtx();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        micAnalyzeRef.current = analyser;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMicLevel = () => {
          if (!micAnalyzeRef.current) return;
          micAnalyzeRef.current.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          const level = Math.min(sum / (dataArray.length * 256), 1);
          setMicLevel(level);
          requestAnimationFrame(updateMicLevel);
        };
        updateMicLevel();
      } catch (e) {
        console.warn("Mic analyzer init failed", e);
      }

      return stream;
    } catch (err) {
      console.error("getUserMedia error", err);
      throw err;
    }
  };

  const flushPendingCandidates = async () => {
    if (!pcRef.current || !pendingCandidatesRef.current?.length) return;
    const queue = pendingCandidatesRef.current.splice(0);
    for (const c of queue) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
      } catch (err) {
        console.warn("Failed to flush candidate", err);
      }
    }
  };

  const createPeerConnection = async () => {
    if (pcRef.current) return;
    pcRef.current = new RTCPeerConnection(ICE_CONFIG);

    // attach local tracks if we already have them
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) =>
        pcRef.current.addTrack(t, localStreamRef.current)
      );
    }

    // prepare remote stream object
    remoteStreamRef.current = new MediaStream();

    // attach remote stream to HTML elements (video + audio)
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStreamRef.current;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStreamRef.current;

    // pcRef.current.ontrack = (event) => {
    //   // attach tracks to the remote MediaStream
    //   try {
    //     const [stream] = event.streams;
    //     if (stream) {
    //       stream.getTracks().forEach((t) => {
    //         remoteStreamRef.current.addTrack(t);
    //       });
    //     } else {
    //       event.track && remoteStreamRef.current.addTrack(event.track);
    //     }
    //     // ensure elements are updated
    //     if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStreamRef.current;
    //     if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStreamRef.current;
    //   } catch (e) {
    //     console.warn("ontrack error", e);
    //   }
    // };

    pcRef.current.ontrack = (event) => {
  const [stream] = event.streams;

  if (stream) {
    console.log("🎥 Remote stream received:", stream);
    remoteStreamRef.current = stream;

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }

    // Reactively mark video as on/off
    const hasVideo = stream.getVideoTracks().some((track) => track.readyState === "live");
    setRemoteHasVideo(hasVideo);

    // Listen for later changes (like camera toggle)
    stream.getVideoTracks().forEach((track) => {
      track.onended = () => setRemoteHasVideo(false);
      track.onmute = () => setRemoteHasVideo(false);
      track.onunmute = () => setRemoteHasVideo(true);
    });
  }
};


    pcRef.current.onicecandidate = (evt) => {
      if (evt.candidate && peerId) {
        // include from so backend can attribute
        socket.emit("call:ice", { callId, to: peerId, from: userData._id, candidate: evt.candidate });
      }
    };

    pcRef.current.onconnectionstatechange = () => {
      try {
        const state = pcRef.current.connectionState;
        if (state === "connected") {
          setCallStatus("connected");
          flushPendingCandidates();
        } else if (state === "disconnected" || state === "closed" || state === "failed") {
          // cleanup
          closeCall();
        }
      } catch (e) {
        console.warn("connectionstatechange error", e);
      }
    };

    // flush any queued candidates now that pc exists
    await flushPendingCandidates();
  };

  const startCall = async () => {
    setIsConnecting(true);
    await ensureLocalStream();
    await createPeerConnection();

    // ensure local tracks are present
    try {
      localStreamRef.current.getTracks().forEach((t) => {
        // avoid adding duplicate tracks
        // addTrack will throw if track already added via same stream/object, but it's safe to call
        try {
          pcRef.current.addTrack(t, localStreamRef.current);
        } catch (e) {
          // ignore duplicate track errors
        }
      });
    } catch (e) {
      console.warn("startCall adding tracks error", e);
    }

    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    socket.emit("call:offer", { callId, to: peerId, from: userData._id, offer });
    setActiveCall({ callId, peerId, callType });
    setIsConnecting(false);
  };

  const closeCall = () => {
    try {
      pcRef.current?.close();
    } catch (e) {}
    pcRef.current = null;

    try {
      localStreamRef.current?.getTracks()?.forEach((t) => t.stop());
    } catch (e) {}
    localStreamRef.current = null;

    try {
      remoteStreamRef.current?.getTracks()?.forEach((t) => t.stop());
    } catch (e) {}
    remoteStreamRef.current = null;

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;

    pendingCandidatesRef.current = [];
    clearActiveCall();
  };

  // -------------------- Actions --------------------

  const acceptCall = async () => {
    if (!peerId) return;
    setIsAccepting(true);
    socket.emit("call:accept", {
      callId,
      callerId: peerId,
      receiverId: userData._id,
      receiver: { _id: userData._id, name: userData.name },
    });
    setActiveCall({ callId, peerId, callType });
    clearIncomingCall();
    setIsAccepting(false);
  };

  const rejectCall = () => {
    socket.emit("call:reject", { callId, callerId: peerId });
    clearIncomingCall();
    navigate(-1);
  };

  const hangUp = () => {
    socket.emit("call:hangup", { callId, to: peerId });
    closeCall();
    navigate(-1);
  };

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setMuted(!muted);
  };

  const toggleCamera = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setCamOff(!camOff);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // -------------------- Effects --------------------

  useEffect(() => {
    let interval;
    if (callStatus === "connected") {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  // init local stream right away so mic analyzer and local preview work
  useEffect(() => {
    ensureLocalStream().catch(() => {});
  }, []);

  // caller sends call:request when component mounts
  useEffect(() => {
    if (isCaller && peerId && userData && socket) {
      console.log("🚀 Sending call request to", peerId);
      setCallStatus("ringing");
      socket.emit("call:request", {
        receiverId: peerId,
        callType,
        callId,
        caller: { _id: userData._id, name: userData.name },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCaller, peerId, userData, callId, callType, socket]);

  // signaling handlers
  useEffect(() => {
    if (!socket) return;

    const onIncoming = (payload) => {
      if (payload.callId !== callId) return;
      setIncomingCall(payload);
      setPeerId(payload.caller._id);
      setCallType(payload.callType);
      setCallStatus("ringing");
    };

    const onAccepted = (payload) => {
      if (payload.callId !== callId) return;
      // caller side: start flow to create offer
      startCall().catch((e) => console.error("startCall failed", e));
    };

    const onOffer = async ({ callId: cid, offer, from }) => {
      if (cid !== callId) return;
      try {
        await ensureLocalStream();
        await createPeerConnection();
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit("call:answer", { callId, to: from, from: userData._id, answer });
        // flush any candidates that arrived while we were creating pc/setting remote desc
        await flushPendingCandidates();
      } catch (err) {
        console.error("onOffer error", err);
      }
    };

    const onAnswer = async ({ callId: cid, answer }) => {
      if (cid !== callId) return;
      try {
        if (!pcRef.current) {
          console.warn("Received answer but pcRef is null - creating pc and setting remote later");
          await createPeerConnection();
        }
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        await flushPendingCandidates();
      } catch (err) {
        console.warn("onAnswer error", err);
      }
    };

    const onIce = async ({ callId: cid, candidate }) => {
      if (cid !== callId) return;
      try {
        // if pcRef exists add directly, otherwise queue
        if (pcRef.current) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
      } catch (err) {
        console.warn("Failed to add ICE", err);
      }
    };

    const onHangup = ({ callId: cid }) => {
      if (cid !== callId) return;
      closeCall();
      navigate(-1);
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:accepted", onAccepted);
    socket.on("call:offer", onOffer);
    socket.on("call:answer", onAnswer);
    socket.on("call:ice", onIce);
    socket.on("call:hangup", onHangup);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:offer", onOffer);
      socket.off("call:answer", onAnswer);
      socket.off("call:ice", onIce);
      socket.off("call:hangup", onHangup);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, callId, userData, peerId]);

  // -------------------- JSX --------------------

  const isSpeaking = micLevel > 0.1;

  return (
    <div className="h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-100 flex flex-col p-4">
      {/* Status bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm">
          {callType === "video" ? <Video size={16} /> : <Phone size={16} />}
          <span className="capitalize font-medium">{callType}</span>
          {callStatus === "connected" && (
            <>
              <span>•</span>
              <span>{formatDuration(callDuration)}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isConnecting && <Loader2 className="animate-spin" size={16} />}
          <span className="text-xs badge badge-outline">
            {callStatus === "connecting" && "Connecting..."}
            {callStatus === "ringing" && (isCaller ? "Ringing..." : "Incoming Call")}
            {callStatus === "connected" && "Connected"}
          </span>
        </div>
      </div>

      {/* Video / Audio area */}
      <div className="flex-1 relative bg-base-100 rounded-2xl shadow-2xl overflow-hidden">
        {callType === "video" ? (
          <div className="h-full lg:grid lg:grid-cols-2">
            <div className="relative bg-neutral h-full lg:h-full">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4">
                <div className="badge badge-neutral">Remote</div>
              </div>
              {!remoteHasVideo && (
  <div className="absolute inset-0 bg-neutral flex items-center justify-center">
    <div className="text-center">
      <div className="avatar placeholder mb-2">
        <div className="bg-neutral-focus text-neutral-content rounded-full w-20">
          <User size={40} />
        </div>
      </div>
      <p className="text-neutral-content">Camera is off</p>
    </div>
  </div>
)}

            </div>

            <div className="absolute top-4 right-4 w-32 h-48 lg:relative lg:top-0 lg:right-0 lg:w-full lg:h-full bg-base-300 rounded-lg lg:rounded-none overflow-hidden shadow-lg lg:shadow-none z-10">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 lg:top-4 lg:left-4">
                <div className="badge badge-primary badge-sm lg:badge-md">You</div>
              </div>
              {camOff && (
                <div className="absolute inset-0 bg-base-300 flex items-center justify-center">
                  <div className="text-center">
                    <div className="avatar placeholder mb-1 lg:mb-2">
                      <div className="bg-base-content text-base-100 rounded-full w-8 lg:w-20">
                        <User size={16} className="lg:hidden" />
                        <User size={40} className="hidden lg:block" />
                      </div>
                    </div>
                    <p className="text-base-content text-xs lg:text-base">Camera is off</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/10 to-secondary/10">
            <div className="text-center">
              <div className="avatar placeholder mb-4">
                <div className="bg-primary text-primary-content rounded-full w-24">
                  <User size={48} />
                </div>
              </div>
              <p className="text-base-content/70">{callStatus === "connected" ? "Call in progress" : "Connecting..."}</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden audio element for audio-only or as fallback */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />

      {/* Controls */}
      <div className="mt-4 pb-2">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center gap-3 bg-base-100 rounded-full px-4 py-2 shadow-lg">
            <div className={`relative ${isSpeaking ? "animate-pulse" : ""}`}>
              {muted ? <MicOff size={18} className="text-error" /> : <Mic size={18} className={isSpeaking ? "text-success" : "text-base-content"} />}
              {isSpeaking && !muted && <div className="absolute -inset-2 bg-success/20 rounded-full animate-ping" />}
            </div>
            <div className="w-20 bg-base-300 rounded-full h-1.5 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-100 ${isSpeaking ? "bg-success" : "bg-base-content/30"}`} style={{ width: `${Math.min(micLevel * 100, 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button onClick={toggleMute} className={`btn btn-circle btn-lg ${muted ? "btn-error" : "btn-neutral"}`}>
            {muted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {callType === "video" && (
            <button onClick={toggleCamera} className={`btn btn-circle btn-lg ${camOff ? "btn-error" : "btn-neutral"}`}>
              {camOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
          )}

          {!isCaller && callStatus === "ringing" && (
            <>
              <button onClick={acceptCall} disabled={isAccepting} className="btn btn-circle btn-lg btn-success">
                {isAccepting ? <Loader2 className="animate-spin" size={24} /> : <PhoneCall size={24} />}
              </button>
              <button onClick={rejectCall} className="btn btn-circle btn-lg btn-error">
                <PhoneOff size={24} />
              </button>
            </>
          )}

          {(isCaller || callStatus === "connected") && (
            <button onClick={hangUp} className="btn btn-circle btn-lg btn-error">
              <PhoneOff size={24} />
            </button>
          )}
        </div>

        {isConnecting && (
          <div className="text-center mt-2">
            <div className="flex items-center justify-center gap-2 text-base-content/70 text-sm">
              <Loader2 className="animate-spin" size={14} />
              <span>Establishing connection...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallPage;
