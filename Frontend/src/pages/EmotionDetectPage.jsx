import React, { useContext, useState, useRef, useEffect } from "react";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import { Camera, Mic, FileText, Play, Square, AlertCircle, CheckCircle, Loader2, TrendingUp, Calendar, BarChart3, History } from "lucide-react";
import Navbar from "../components/Navbar";
// import VoiceRecognitionPage from "../components/VoiceReco";

const PHQ9_ITEMS = [
  "Little interest or pleasure in doing things.",
  "Feeling down, depressed, or hopeless.",
  "Trouble falling or staying asleep, or sleeping too much.",
  "Feeling tired or having little energy.",
  "Poor appetite or overeating.",
  "Feeling bad about yourself – or that you are a failure or have let yourself or your family down.",
  "Trouble concentrating on things, such as reading the newspaper or watching television.",
  "Moving or speaking so slowly that other people could have noticed. Or the opposite – being so fidgety or restless that you have been moving around a lot more than usual.",
  "Thoughts that you would be better off dead, or of hurting yourself in some way."
];

const GAD7_ITEMS = [
  "Feeling nervous, anxious or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it's hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen"
];

const DIFFICULTY_OPTIONS = [
  "Not difficult at all",
  "Somewhat difficult",
  "Very difficult",
  "Extremely difficult"
];

// Mapping for numeric emotion codes to string emotions
const EMOTION_CODES = {
  0: 'neutral',
  1: 'happy',
  2: 'sad',
  3: 'angry',
  4: 'fear',
  5: 'surprise',
  6: 'disgust',
  7: 'excited',
  8: 'frustrated',
  9: 'anxious',
  10: 'worried',
  11: 'depressed',
  12: 'content',
  13: 'calm',
  14: 'confused',
  15: 'tired',
  16: 'stressed'
};

// Emoji mapping for emotions
const EMOTION_EMOJIS = {
  'happy': '😊',
  'joy': '😄',
  'excited': '🤩',
  'content': '😌',
  'calm': '😇',
  'neutral': '😐',
  'sad': '😢',
  'angry': '😠',
  'frustrated': '😤',
  'anxious': '😰',
  'worried': '😟',
  'depressed': '😞',
  'fear': '😨',
  'disgust': '🤢',
  'surprise': '😲',
  'confused': '😕',
  'tired': '😴',
  'stressed': '😣'
};

// Helper function to normalize emotions
const normalizeEmotion = (emotion) => {
  if (emotion === null || emotion === undefined) {
    return null;
  }
  
  // If it's a number, convert using the emotion codes
  if (typeof emotion === 'number') {
    return EMOTION_CODES[emotion] || null;
  }
  
  // If it's a string, return it as is (but lowercase for consistency)
  if (typeof emotion === 'string') {
    return emotion.toLowerCase();
  }
  
  return null;
};

const getEmotionEmoji = (emotion) => {
  const normalizedEmotion = normalizeEmotion(emotion);
  if (!normalizedEmotion) return '😐';
  return EMOTION_EMOJIS[normalizedEmotion] || '😐';
};

const getEmotionColor = (emotion) => {
  const normalizedEmotion = normalizeEmotion(emotion);
  if (!normalizedEmotion) return '#94a3b8';
  
  const positiveEmotions = ['happy', 'joy', 'excited', 'content', 'calm'];
  const negativeEmotions = ['sad', 'angry', 'frustrated', 'anxious', 'worried', 'depressed', 'fear'];
  
  if (positiveEmotions.includes(normalizedEmotion)) {
    return '#22c55e'; // green
  } else if (negativeEmotions.includes(normalizedEmotion)) {
    return '#ef4444'; // red
  }
  return '#f59e0b'; // yellow for neutral
};

const EmotionDetectPage = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeMethod, setActiveMethod] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { userData, backendUrl } = useContext(AppContent);

  // recording refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const videoRef = useRef(null);

  // form states
  const [phq9, setPhq9] = useState(Array(PHQ9_ITEMS.length).fill(0));
  const [gad7, setGad7] = useState(Array(GAD7_ITEMS.length).fill(0));
  const [difficulty, setDifficulty] = useState(DIFFICULTY_OPTIONS[0]);

  const phq9Total = phq9.reduce((a, b) => a + b, 0);
  const gad7Total = gad7.reduce((a, b) => a + b, 0);

  // Load emotion history automatically when page loads
  React.useEffect(() => {
    if (userData && userData._id) {
      fetchEmotionHistory();
    }
  }, [userData]);

  // Fetch Emotion History
  const fetchEmotionHistory = async () => {
    if (!userData || !userData._id) return;

    setHistoryLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/emotion/history/${userData._id}`);
      const data = res.data;
      console.log("Fetched emotion history:", data);

      if (!data.message) {
        setHistoryData(data);
      }
    } catch (error) {
      console.error("Error fetching emotion history:", error.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  // -------------------------
  // Camera Detection
  // -------------------------
// const handleCameraDetect = async () => {
//   if (!userData || !userData._id) {
//     setResult({ error: "Please log in first." });
//     return;
//   }

//   setResult(null);
//   setLoading(true);
//   setActiveMethod('camera');

//   try {
//     const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//     videoRef.current.srcObject = stream;

//     // Wait for video to load
//     await new Promise(resolve => setTimeout(resolve, 1000));

//     // Capture image from video
//     const canvas = document.createElement('canvas');
//     canvas.width = videoRef.current.videoWidth;
//     canvas.height = videoRef.current.videoHeight;
//     canvas.getContext('2d').drawImage(videoRef.current, 0, 0);

//     const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
//     const formData = new FormData();
//     formData.append('user_id', userData._id);
//     formData.append('image', blob, 'snapshot.jpg');

//     const res = await axios.post(`${backendUrl}/api/emotion/camera-image`, formData);
//     setResult(res.data);
//     fetchEmotionHistory();
//   } catch (err) {
//     console.error("Camera detection error:", err);
//     setResult({ error: "Camera detection failed." });
//   } finally {
//     stopCamera();
//     setLoading(false);
//     setActiveMethod(null);
//   }
// };

// useEffect(() => {
//   const startCamera = async () => {
//     if (activeMethod !== 'camera' || !videoRef.current) return;

//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//       videoRef.current.srcObject = stream;

//       // Now trigger backend detection
//       const res = await axios.post(
//         `${backendUrl}/api/emotion/camera`,
//         { userId: userData._id },
//         { headers: { "Content-Type": "application/json" } }
//       );
//       setResult(res.data);
//       fetchEmotionHistory();
//     } catch (err) {
//       console.error("Camera detection error:", err);
//       setResult({ error: "Camera detection failed." });
//     } finally {
//       stopCamera();
//       setLoading(false);
//       setActiveMethod(null);
//     }
//   };

//   startCamera();
// }, [activeMethod]);

//Stop the camera

// const stopCamera = () => {
//   const stream = videoRef.current?.srcObject;

//   if (stream) {
//     stream.getTracks().forEach(track => track.stop());
//     videoRef.current.srcObject = null;
//   }
// };

const startCameraStream = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  if (videoRef.current) {
    videoRef.current.srcObject = stream;
  }
  return stream;
};

const captureSnapshot = () => {
  const canvas = document.createElement('canvas');
  canvas.width = videoRef.current.videoWidth;
  canvas.height = videoRef.current.videoHeight;
  canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
};

const handleCameraDetect = async () => {
  if (!userData || !userData._id) {
    setResult({ error: "Please log in first." });
    return;
  }

  setResult(null);
  setLoading(true);
  setActiveMethod('camera');

  try {
    const stream = await startCameraStream();

    // Wait for video to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));

    const blob = await captureSnapshot();
    const formData = new FormData();
    formData.append('user_id', userData._id);
    formData.append('image', blob, 'snapshot.jpg');

    const res = await axios.post(`${backendUrl}/api/emotion/camera-image`, formData);
    setResult(res.data);
    fetchEmotionHistory();

    stopCamera(stream);
  } catch (err) {
    console.error("Camera detection error:", err);
    setResult({ error: "Camera detection failed." });
  } finally {
    setLoading(false);
    setActiveMethod(null);
  }
};

const stopCamera = (stream) => {
  if (!stream) return;
  stream.getTracks().forEach(track => track.stop());
  if (videoRef.current) {
    videoRef.current.srcObject = null;
  }
};

  // -------------------------
  // Voice Recording
  // -------------------------
  const startRecording = async () => {
    if (!userData || !userData._id) {
      setResult({ error: "Please log in first." });
      return;
    }

    setResult(null);
    setIsRecording(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });

        const formData = new FormData();
        formData.append("user_id", userData._id);
        formData.append("file", audioFile);

        try {
          setLoading(true);
          setActiveMethod('voice');
          const res = await axios.post(`${backendUrl}/api/emotion/voice`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          setResult(res.data);
          // Refresh history after new emotion is recorded
          fetchEmotionHistory();
        } catch (error) {
          console.error("Voice detection error:", error);
          setResult({ error: "Voice detection failed. Please try again." });
        } finally {
          setLoading(false);
          setActiveMethod(null);
          setIsRecording(false);
        }
      };

      mediaRecorderRef.current.start();
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 5000);
    } catch (err) {
      console.error("Microphone error:", err);
      setResult({ error: "Microphone not accessible. Please check permissions." });
      setIsRecording(false);
    }
  };

  // -------------------------
  // Form Submit
  // -------------------------
  const handleFormDetect = async () => {
    if (!userData || !userData._id) {
      setResult({ error: "Please log in first." });
      return;
    }

    setLoading(true);
    setActiveMethod('form');
    setResult(null);
    
    try {
      const payload = {
        user_id: userData._id,
        phq9,
        gad7,
        difficulty
      };

      const res = await axios.post(`${backendUrl}/api/emotion/form`, payload, {
        headers: { "Content-Type": "application/json" }
      });

      setResult(res.data);
      // Refresh history after new emotion is recorded
      fetchEmotionHistory();
    } catch (error) {
      console.error("Form detection error:", error);
      setResult({ error: "Form submission failed. Please try again." });
    } finally {
      setLoading(false);
      setActiveMethod(null);
    }
  };

  // Helper functions
  const getWeekdayMap = (dailySummary) => {
    const weekdayMap = {};
    const today = new Date();
    
    // Get the last 7 days to ensure we show recent data
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
      
      // Check if we have data for this date
      if (dailySummary[dateStr]) {
        weekdayMap[dayName] = dailySummary[dateStr];
      } else {
        // Check alternative date formats that might be in the data
        const altDateStr1 = date.toLocaleDateString("en-US"); // M/D/YYYY
        const altDateStr2 = date.toLocaleDateString("en-CA"); // YYYY-MM-DD
        
        weekdayMap[dayName] = dailySummary[altDateStr1] || dailySummary[altDateStr2] || null;
      }
    }
    
    return weekdayMap;
  };

  const getLatestEmotion = (summaryObj) => {
    const sortedKeys = Object.keys(summaryObj).sort();
    const latestKey = sortedKeys[sortedKeys.length - 1];
    return summaryObj[latestKey];
  };

  // Get the most recent emotion from daily summary
  const getMostRecentEmotion = (dailySummary) => {
    if (!dailySummary || Object.keys(dailySummary).length === 0) return null;
    
    const sortedDates = Object.keys(dailySummary).sort((a, b) => new Date(b) - new Date(a));
    return dailySummary[sortedDates[0]];
  };

  // Get suggestions based on current emotion
  const getEmotionSuggestions = (emotion) => {
    const normalizedEmotion = normalizeEmotion(emotion);
    if (!normalizedEmotion) return null;
    
    const suggestions = {
      happy: {
        title: "Keep the Positivity Flowing! 😊",
        color: "from-green-100 to-emerald-100",
        items: [
          { icon: "🎵", title: "Music", desc: "Create or share your happy playlist with friends" },
          { icon: "📝", title: "Gratitude Journal", desc: "Write down 3 things you're grateful for today" },
          { icon: "🌟", title: "Spread Joy", desc: "Join group activities or chat with other positive users" },
          { icon: "📞", title: "Connect", desc: "Share your good mood with friends and family" }
        ]
      },
      joy: {
        title: "Keep the Positivity Flowing! 😊",
        color: "from-green-100 to-emerald-100",
        items: [
          { icon: "🎵", title: "Music", desc: "Create or share your happy playlist with friends" },
          { icon: "📝", title: "Gratitude Journal", desc: "Write down 3 things you're grateful for today" },
          { icon: "🌟", title: "Spread Joy", desc: "Join group activities or chat with other positive users" },
          { icon: "📞", title: "Connect", desc: "Share your good mood with friends and family" }
        ]
      },
      excited: {
        title: "Keep the Positivity Flowing! 😊",
        color: "from-green-100 to-emerald-100",
        items: [
          { icon: "🎵", title: "Music", desc: "Create or share your happy playlist with friends" },
          { icon: "📝", title: "Gratitude Journal", desc: "Write down 3 things you're grateful for today" },
          { icon: "🌟", title: "Spread Joy", desc: "Join group activities or chat with other positive users" },
          { icon: "📞", title: "Connect", desc: "Share your good mood with friends and family" }
        ]
      },
      sad: {
        title: "Let's Help You Feel Better 💙",
        color: "from-blue-100 to-cyan-100",
        items: [
          { icon: "🎵", title: "Calming Music", desc: "Try soft, lo-fi, or gently uplifting playlists" },
          { icon: "🫁", title: "Breathing Exercise", desc: "Take 2-3 minutes for guided breathing or mindfulness" },
          { icon: "📝", title: "Emotion Journal", desc: "Write down your feelings to process and release them" },
          { icon: "📞", title: "Reach Out", desc: "Connect with a trusted friend or family member" },
          { icon: "🗺️", title: "Find Peace", desc: "Visit nearby parks, cafes, or calming spaces" }
        ]
      },
      angry: {
        title: "Channel Your Energy Safely 🔴",
        color: "from-red-100 to-rose-100",
        items: [
          { icon: "🎵", title: "Release Music", desc: "Try energetic workout beats or calming instrumentals" },
          { icon: "🫁", title: "Box Breathing", desc: "Use breathing techniques to cool down anger" },
          { icon: "📝", title: "Anger Journal", desc: "Write what triggered you, then reframe it constructively" },
          { icon: "⚡", title: "Physical Release", desc: "Consider a walk, workout, or physical activity" },
          { icon: "🤔", title: "Pause & Reflect", desc: "Take time to cool down before reaching out to others" }
        ]
      },
      frustrated: {
        title: "Channel Your Energy Safely 🔴",
        color: "from-red-100 to-rose-100",
        items: [
          { icon: "🎵", title: "Release Music", desc: "Try energetic workout beats or calming instrumentals" },
          { icon: "🫁", title: "Box Breathing", desc: "Use breathing techniques to cool down anger" },
          { icon: "📝", title: "Anger Journal", desc: "Write what triggered you, then reframe it constructively" },
          { icon: "⚡", title: "Physical Release", desc: "Consider a walk, workout, or physical activity" },
          { icon: "🤔", title: "Pause & Reflect", desc: "Take time to cool down before reaching out to others" }
        ]
      },
      neutral: {
        title: "Turn Stability into Productivity ⚪",
        color: "from-gray-100 to-slate-100",
        items: [
          { icon: "🎵", title: "Focus Music", desc: "Try ambient, jazz, or background music for productivity" },
          { icon: "📝", title: "Plan Your Day", desc: "Set small, achievable goals for today" },
          { icon: "🗺️", title: "Connect Locally", desc: "Find co-working spaces or study groups nearby" },
          { icon: "📞", title: "Casual Connection", desc: "Reach out to friends for light conversation" }
        ]
      },
      anxious: {
        title: "Find Your Calm 💙",
        color: "from-blue-100 to-indigo-100",
        items: [
          { icon: "🫁", title: "Deep Breathing", desc: "Practice 4-7-8 breathing or guided meditation" },
          { icon: "🎵", title: "Calming Sounds", desc: "Try nature sounds, soft music, or meditation tracks" },
          { icon: "📝", title: "Worry Journal", desc: "Write down your concerns to externalize them" },
          { icon: "🌱", title: "Grounding", desc: "Use 5-4-3-2-1 technique (5 things you see, 4 you hear, etc.)" },
          { icon: "📞", title: "Support", desc: "Consider calling a trusted friend or counselor" }
        ]
      },
      worried: {
        title: "Find Your Calm 💙",
        color: "from-blue-100 to-indigo-100",
        items: [
          { icon: "🫁", title: "Deep Breathing", desc: "Practice 4-7-8 breathing or guided meditation" },
          { icon: "🎵", title: "Calming Sounds", desc: "Try nature sounds, soft music, or meditation tracks" },
          { icon: "📝", title: "Worry Journal", desc: "Write down your concerns to externalize them" },
          { icon: "🌱", title: "Grounding", desc: "Use 5-4-3-2-1 technique (5 things you see, 4 you hear, etc.)" },
          { icon: "📞", title: "Support", desc: "Consider calling a trusted friend or counselor" }
        ]
      }
    };

    return suggestions[normalizedEmotion] || suggestions.neutral;
  };

  // Generate chart data with better date handling
  const generateChartData = (dailySummary) => {
    const chartData = [];
    const today = new Date();
    
    // Get the last 12 days of data
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Check multiple date formats for the emotion data
      let emotion = dailySummary[dateStr];
      if (emotion === undefined || emotion === null) {
        const altDateStr1 = date.toLocaleDateString("en-US"); // M/D/YYYY
        const altDateStr2 = date.toLocaleDateString("en-CA"); // YYYY-MM-DD
        emotion = dailySummary[altDateStr1] || dailySummary[altDateStr2];
      }
      
      // Normalize the emotion
      const normalizedEmotion = normalizeEmotion(emotion);
      const isPositive = normalizedEmotion && ['happy', 'joy', 'excited', 'content', 'calm'].includes(normalizedEmotion);
      const isNegative = normalizedEmotion && ['sad', 'angry', 'frustrated', 'anxious', 'worried', 'depressed'].includes(normalizedEmotion);
      
      chartData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        positive: isPositive ? Math.random() * 60 + 40 : Math.random() * 20 + 10,
        negative: isNegative ? Math.random() * 60 + 40 : Math.random() * 20 + 10,
        emotion: normalizedEmotion || null,
        hasData: !!normalizedEmotion
      });
    }
    
    return chartData;
  };

  // UI for each question
  const QuestionRow = ({ text, value, onChange, index, questionType = 'general' }) => (
    <div className="flex flex-col lg:flex-row lg:items-center gap-4 py-4 border-b border-base-300 last:border-b-0">
      <div className="flex-1 text-sm lg:text-base">
        <span className="font-medium text-primary">{index + 1}.</span> {text}
      </div>
      <div className="flex gap-2 justify-center lg:justify-end">
        {[0, 1, 2, 3].map((opt) => (
          <div key={opt} className="form-control">
            <label className="label cursor-pointer flex-col gap-1 p-2">
              <input
                type="radio"
                name={`${questionType}-q-${index}`}
                value={opt}
                checked={value === opt}
                onChange={(e) => {
                  e.preventDefault();
                  onChange(opt);
                }}
                className="radio radio-primary radio-sm"
              />
              <span className="text-xs font-medium">{opt}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const getSeverityBadge = (score, maxScore, type) => {
    let severity, colorClass;
    
    if (type === 'phq9') {
      if (score <= 4) { severity = 'Minimal'; colorClass = 'badge-success'; }
      else if (score <= 9) { severity = 'Mild'; colorClass = 'badge-warning'; }
      else if (score <= 14) { severity = 'Moderate'; colorClass = 'badge-warning'; }
      else if (score <= 19) { severity = 'Moderately Severe'; colorClass = 'badge-error'; }
      else { severity = 'Severe'; colorClass = 'badge-error'; }
    } else {
      if (score <= 4) { severity = 'Minimal'; colorClass = 'badge-success'; }
      else if (score <= 9) { severity = 'Mild'; colorClass = 'badge-warning'; }
      else if (score <= 14) { severity = 'Moderate'; colorClass = 'badge-warning'; }
      else { severity = 'Severe'; colorClass = 'badge-error'; }
    }
    
    return <span className={`badge ${colorClass} badge-sm`}>{severity}</span>;
  };

  // Simple Emotion History Component (always visible)
  const SimpleEmotionHistory = () => {
    if (!historyData || !historyData.daily_summary) {
      return (
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body text-center py-12">
              <History className="w-16 h-16 text-base-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Emotion History</h3>
              {historyLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading your emotion history...</span>
                </div>
              ) : (
                <p className="text-base-content/70">
                  No emotion history found. Start recording your emotions to see patterns and insights.
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    const weekdayMap = getWeekdayMap(historyData.daily_summary);
    const chartData = generateChartData(historyData.daily_summary);
    const weeklyEmotion = historyData.weekly_summary ? normalizeEmotion(getLatestEmotion(historyData.weekly_summary)) : null;
    const monthlyEmotion = historyData.monthly_summary ? normalizeEmotion(getLatestEmotion(historyData.monthly_summary)) : null;
    const recentEmotion = normalizeEmotion(getMostRecentEmotion(historyData.daily_summary));

    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
          <div className="stat">
            <div className="stat-figure text-primary">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div className="stat-title">Weekly Emotion</div>
            <div className="stat-value text-primary flex items-center gap-2">
              <span className="text-4xl">{getEmotionEmoji(weeklyEmotion)}</span>
              <span className="text-lg capitalize">{weeklyEmotion || 'N/A'}</span>
            </div>
            <div className="stat-desc">Current week trend</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-secondary">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="stat-title">Monthly Emotion</div>
            <div className="stat-value text-secondary flex items-center gap-2">
              <span className="text-4xl">{getEmotionEmoji(monthlyEmotion)}</span>
              <span className="text-lg capitalize">{monthlyEmotion || 'N/A'}</span>
            </div>
            <div className="stat-desc">Overall monthly mood</div>
          </div>
        </div>

        {/* Mood History */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title text-xl mb-4 flex items-center gap-2">
              <History className="w-5 h-5" />
              Mood History
            </h3>
            
            <div className="grid grid-cols-7 gap-4">
              {weekdays.map((day) => {
                const rawEmotion = weekdayMap[day];
                const emotion = normalizeEmotion(rawEmotion);
                const emoji = getEmotionEmoji(emotion);
                const hasData = emotion !== null && emotion !== undefined;
                
                return (
                  <div key={day} className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${
                    hasData ? 'bg-base-200 hover:bg-base-300' : 'bg-base-100 border-2 border-dashed border-base-300'
                  }`}>
                    <div className={`text-3xl mb-1 ${!hasData ? 'opacity-30' : ''}`}>
                      {hasData ? emoji : '😐'}
                    </div>
                    <span className="text-xs font-medium text-base-content/70">{day.slice(0, 3)}</span>
                    <span className={`text-xs text-center capitalize px-2 py-1 rounded-full text-base-content/80 ${
                      hasData ? 'bg-base-100' : 'bg-base-200 text-base-content/50'
                    }`}>
                      {hasData ? emotion : 'No data'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Personalized Suggestions */}
        {recentEmotion && (
          <div className={`card bg-gradient-to-r ${getEmotionSuggestions(recentEmotion)?.color} shadow-xl`}>
            <div className="card-body">
              <h3 className="card-title text-xl mb-4 flex items-center gap-2">
                <span className="text-2xl">{getEmotionEmoji(recentEmotion)}</span>
                {getEmotionSuggestions(recentEmotion)?.title}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getEmotionSuggestions(recentEmotion)?.items.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-colors cursor-pointer">
                    <div className="text-2xl">{item.icon}</div>
                    <div>
                      <h4 className="font-semibold text-base-content">{item.title}</h4>
                      <p className="text-sm text-base-content/70">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Freud Score Chart */}
        <div className="card bg-gradient-to-br from-pink-400 to-green-400 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="card-title text-2xl mb-2 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6" />
                  Freud Score
                </h2>
                <p className="text-base-content/70">See your mental score insights</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Positive</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Negative</span>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="relative h-64 mb-6">
              <div className="flex items-end justify-between h-full px-2">
                {chartData.map((data, index) => (
                  <div key={index} className="flex flex-col items-center gap-1 flex-1 max-w-16">
                    <div className="flex flex-col items-center justify-end h-48 gap-1">
                      {/* Positive bar */}
                      <div 
                        className={`w-6 rounded-t transition-all duration-500 ${
                          data.hasData ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-200'
                        }`}
                        style={{ height: `${data.hasData ? data.positive : 10}%` }}
                        title={data.hasData ? `${data.emotion} - Positive: ${Math.round(data.positive)}%` : 'No data available'}
                      ></div>
                      {/* Negative bar */}
                      <div 
                        className={`w-6 rounded-b transition-all duration-500 ${
                          data.hasData ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-200'
                        }`}
                        style={{ height: `${data.hasData ? data.negative : 10}%` }}
                        title={data.hasData ? `${data.emotion} - Negative: ${Math.round(data.negative)}%` : 'No data available'}
                      ></div>
                    </div>
                    <span className="text-xs text-base-content/70 mt-2">{data.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="flex justify-between text-sm text-base-content/50 border-t pt-4">
              <span>{chartData[0]?.date}</span>
              <span>{chartData[chartData.length - 1]?.date}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-base-200 p-4 lg:p-8">
      <Navbar/>
      <div className="max-w-7xl mx-auto mt-14">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-base-content/70 text-lg">Choose your preferred method for emotion analysis</p>
        </div>

        {/* Detection Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Camera Detection */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="card-body text-center">
              <div className="mx-auto mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h2 className="card-title justify-center text-xl mb-2">Camera Detection</h2>
              <p className="text-base-content/70 mb-4">
                Analyze facial expressions in real-time
              </p>
              <div className="card-actions justify-center">
                <button
                  onClick={handleCameraDetect}
                  disabled={loading}
                  className={`btn btn-primary ${loading && activeMethod === 'camera' ? 'loading' : ''}`}
                >
                  {loading && activeMethod === 'camera' ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Camera className="w-4 h-4 mr-2" />
                  )}
                  Start Detection
                </button>
              </div>
            </div>
          </div>
          {/* Camera Popup */}
{activeMethod === 'camera' && (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
    <div className="bg-base-100 rounded-lg p-4 relative w-[320px] shadow-xl">
      <video ref = {videoRef} autoPlay playsInline className="rounded-md w-full" />
      <button
        onClick={() => stopCamera()}
        className="absolute top-2 right-2 btn btn-sm btn-error"
      >
        ✕
      </button>
      <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
        Detecting...
      </div>
    </div>
  </div>
)}

          {/* Voice Detection */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="card-body text-center">
              <div className="mx-auto mb-4">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Mic className="w-8 h-8 text-secondary" />
                </div>
              </div>
              <h2 className="card-title justify-center text-xl mb-2">Voice Analysis</h2>
              <p className="text-base-content/70 mb-4">
                Record 5 seconds of speech for analysis
              </p>
              <div className="card-actions justify-center">
                <button
                  onClick={startRecording}
                  disabled={loading || isRecording}
                  className={`btn btn-secondary ${isRecording ? 'loading' : ''}`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Recording...
                    </>
                  ) : loading && activeMethod === 'voice' ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Recording
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          {/* <VoiceRecognitionPage/> */}
          {/* Form Assessment */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="card-body text-center">
              <div className="mx-auto mb-4">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-accent" />
                </div>
              </div>
              <h2 className="card-title justify-center text-xl mb-2">Clinical Assessment</h2>
              <p className="text-base-content/70 mb-4">
                PHQ-9 & GAD-7 standardized questionnaire
              </p>
              <div className="stats stats-horizontal shadow-sm mb-4">
                <div className="stat py-2">
                  <div className="stat-title text-xs">PHQ-9</div>
                  <div className="stat-value text-lg">{phq9Total}</div>
                  <div className="stat-desc">{getSeverityBadge(phq9Total, 27, 'phq9')}</div>
                </div>
                <div className="stat py-2">
                  <div className="stat-title text-xs">GAD-7</div>
                  <div className="stat-value text-lg">{gad7Total}</div>
                  <div className="stat-desc">{getSeverityBadge(gad7Total, 21, 'gad7')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PHQ-9 & GAD-7 Form */}
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-6 flex items-center">
              <FileText className="w-6 h-6 mr-2" />
              Clinical Assessment Form
            </h2>

            {/* PHQ-9 Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">PHQ-9 Depression Scale</h3>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">Total: {phq9Total}/27</span>
                  {getSeverityBadge(phq9Total, 27, 'phq9')}
                </div>
              </div>
              <div className="bg-base-200 rounded-lg p-4">
                <div className="text-xs text-base-content/70 mb-4 text-center">
                  Over the last 2 weeks, how often have you been bothered by any of the following problems?
                </div>
                <div className="hidden lg:flex justify-end gap-2 mb-2 text-xs font-medium text-base-content/70">
                  <span className="w-12 text-center">Not at all</span>
                  <span className="w-12 text-center">Several days</span>
                  <span className="w-12 text-center">More than half</span>
                  <span className="w-12 text-center">Nearly every day</span>
                </div>
                {PHQ9_ITEMS.map((q, i) => (
                  <QuestionRow
                    key={`phq9-${i}`}
                    text={q}
                    value={phq9[i]}
                    onChange={(opt) => {
                      const newArr = [...phq9];
                      newArr[i] = opt;
                      setPhq9(newArr);
                    }}
                    index={i}
                    questionType="phq9"
                  />
                ))}
              </div>
            </div>

            {/* GAD-7 Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">GAD-7 Anxiety Scale</h3>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">Total: {gad7Total}/21</span>
                  {getSeverityBadge(gad7Total, 21, 'gad7')}
                </div>
              </div>
              <div className="bg-base-200 rounded-lg p-4">
                <div className="text-xs text-base-content/70 mb-4 text-center">
                  Over the last 2 weeks, how often have you been bothered by the following problems?
                </div>
                {GAD7_ITEMS.map((q, i) => (
                  <QuestionRow
                    key={`gad7-${i}`}
                    text={q}
                    value={gad7[i]}
                    onChange={(opt) => {
                      const newArr = [...gad7];
                      newArr[i] = opt;
                      setGad7(newArr);
                    }}
                    index={i}
                    questionType="gad7"
                  />
                ))}
              </div>
            </div>

            {/* Difficulty Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Functional Impairment</h3>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?
                  </span>
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="select select-bordered w-full"
                >
                  {DIFFICULTY_OPTIONS.map((d, i) => (
                    <option key={i} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="card-actions justify-center">
              <button
                onClick={handleFormDetect}
                disabled={loading}
                className={`btn btn-accent btn-lg ${loading && activeMethod === 'form' ? 'loading' : ''}`}
              >
                {loading && activeMethod === 'form' ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <FileText className="w-5 h-5 mr-2" />
                )}
                Submit Assessment
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {(result || loading) && (
          <div className="card bg-base-100 shadow-xl mb-8">
            <div className="card-body">
              <h3 className="card-title text-xl mb-4">Results</h3>
              
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mr-3" />
                  <span className="text-lg">Analyzing emotion...</span>
                </div>
              )}

              {result && !result.error && !result.daily_summary && (
                <div className="space-y-4">
                  <div className="alert alert-success">
                    <CheckCircle className="w-5 h-5" />
                    <span>Analysis completed successfully!</span>
                  </div>
                  
                  <div className="stats stats-vertical lg:stats-horizontal shadow">
                    {result.phq9_total !== undefined && (
                      <div className="stat">
                        <div className="stat-title">PHQ-9 Score</div>
                        <div className="stat-value text-primary">{result.phq9_total}</div>
                        <div className="stat-desc">{getSeverityBadge(result.phq9_total, 27, 'phq9')}</div>
                      </div>
                    )}
                    {result.gad7_total !== undefined && (
                      <div className="stat">
                        <div className="stat-title">GAD-7 Score</div>
                        <div className="stat-value text-secondary">{result.gad7_total}</div>
                        <div className="stat-desc">{getSeverityBadge(result.gad7_total, 21, 'gad7')}</div>
                      </div>
                    )}
                    {result.difficulty && (
                      <div className="stat">
                        <div className="stat-title">Difficulty Level</div>
                        <div className="stat-value text-accent text-sm">{result.difficulty}</div>
                      </div>
                    )}
                  </div>

                  {result.interpretation && (
                    <div className="bg-base-200 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Clinical Interpretation:</h4>
                      <p className="text-base-content/80">{result.interpretation}</p>
                    </div>
                  )}
                </div>
              )}

              {result && result.error && (
                <div className="alert alert-error">
                  <AlertCircle className="w-5 h-5" />
                  <span>{result.error}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emotion History - Always Visible at Bottom */}
        <div className="mt-12">
          <div className="divider">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <History className="w-6 h-6" />
              Your Emotion Journey
            </h2>
          </div>
          <SimpleEmotionHistory />
        </div>
      </div>
    </div>
  );
};

export default EmotionDetectPage;