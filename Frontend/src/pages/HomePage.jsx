import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  Home, 
  TrendingUp, 
  MessageCircle, 
  HelpCircle, 
  LogOut, 
  Menu, 
  Bell, 
  Settings,
  ChevronRight, 
  ChevronLeft, 
  Wind, 
  Flower2, 
  Music, 
  BookOpen, 
  ArrowRight, 
  Video, 
  X, 
  CalendarDays,
  History,
  Clock,
  Loader2,
  BarChart3,
  LoaderIcon,
  Bot
  
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { AppContent } from '../context/AppContext';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Link } from 'react-router';

const HomePage = () => {
  const [selectedMood, setSelectedMood] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false); // Added for mobile right sidebar
  const [currentDate, setCurrentDate] = useState(new Date());
  const {setUserData, userData, backendUrl, setIsLoggedin } = useContext(AppContent);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [historyData, setHistoryData] = useState({
    daily_summary: {},
    weekly_summary: {},
    monthly_summary: {}
  });
  const [historyError, setHistoryError] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);


  const moodChartRef = useRef(null);
  const healthMatrixRef = useRef(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  //fetch User Data

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await api.get("/api/user/data");
        if (res.data.success) {
          setImageUrl(res.data.userData.profilePic);
        }
      } catch (err) {
        console.error("Failed to fetch profile pic:", err);
      }
    };
    fetchUserData();
  }, []);

  //logout function

  const logout = async () => {
    setLogoutLoading(true);
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backendUrl + '/api/auth/logout');
      if (data.success) {
        setIsLoggedin(false);
        setUserData(false);
        useSocketStore.getState().disconnectSocket();
        navigate('/');
        window.location.reload();
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLogoutLoading(false);
    }
  };

const EMOTION_CODES = {
  0: 'angry',
  1:'disgust',
  2: 'fear',
  3: 'happy',
  4: 'neutral',
  5: 'sad',
  6: 'surprise'
}

// Emoji mapping for emotions
const EMOTION_EMOJIS = {
  'happy': '😊',
  'neutral': '😐',
  'sad': '😢',
  'angry': '😠',
  'fear': '😨',
  'disgust': '🤢',
  'surprise': '😲',
};

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
      disgust: {
        title: "Cleanse Your Space & Mind 🧼",
        color: "from-lime-100 to-green-200",
        items: [
          { icon: "🧽", title: "Declutter", desc: "Clean your room or workspace to refresh your environment" },
          { icon: "📝", title: "Vent Safely", desc: "Write down what’s bothering you and toss it out" },
          { icon: "🌿", title: "Nature Reset", desc: "Step outside for fresh air and a change of scenery" },
          { icon: "🎵", title: "Mood Shift Music", desc: "Play something uplifting or cleansing" },
          { icon: "📞", title: "Talk It Out", desc: "Share your thoughts with someone you trust" }
        ]
      },
      fear: {
        title: "Find Calm & Courage 🛡️",
        color: "from-indigo-100 to-purple-100",
        items: [
          { icon: "🫁", title: "Grounding Exercise", desc: "Try the 5-4-3-2-1 technique to stay present" },
          { icon: "📝", title: "Fear Journal", desc: "Write down your fears and challenge them logically" },
          { icon: "🎵", title: "Soothing Sounds", desc: "Play ambient or nature sounds to calm your nerves" },
          { icon: "🧘", title: "Mindfulness", desc: "Try a short guided meditation or yoga stretch" },
          { icon: "📞", title: "Safe Connection", desc: "Reach out to someone who makes you feel secure" }
        ]
      },
      surprise: {
        title: "Embrace the Unexpected 🎉",
        color: "from-yellow-100 to-orange-100",
        items: [
          { icon: "🎁", title: "Celebrate Spontaneity", desc: "Do something fun or spontaneous today" },
          { icon: "📝", title: "Surprise Journal", desc: "Reflect on what surprised you and how it made you feel" },
          { icon: "🎵", title: "Playful Music", desc: "Try upbeat or quirky tunes to match the mood" },
          { icon: "📞", title: "Share the Moment", desc: "Tell a friend about your surprise" },
          { icon: "🗺️", title: "Explore Nearby", desc: "Visit a new place or try a new activity" }
        ]
      }
    };

    return suggestions[normalizedEmotion] || suggestions.neutral;
  };


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
      }else{
        setHistoryData({
          daily_summary: {},
          weekly_summary: {},
          monthly_summary: {}
        })
      }
    } catch (error) {
      console.error("Error fetching emotion history:", error.message);
      setHistoryError(true);
    } finally {
      setHistoryLoading(false);
    }
  };

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

  
 const getWeekdayMap = (dailySummary = {}) => {
  const weekdayMap = {};
  const today = new Date();

  console.log("dailySummary keys:", Object.keys(dailySummary)); // 👈 debug

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const dateStr = date.toISOString().split('T')[0]; // ISO YYYY-MM-DD

    let rawEmotion =
      dailySummary[dateStr] ?? // If API uses ISO
      dailySummary[dayName] ?? // If API uses weekday names
      null;

    weekdayMap[dayName] = normalizeEmotion(rawEmotion);
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

const generateChartData = (dailySummary) => {
  // Define emotion score mappings (0-100 scale)
  const emotionScores = {
    'happy': { positive: 85, negative: 15 },
    'surprise': { positive: 70, negative: 30 },
    'neutral': { positive: 50, negative: 50 },
    'sad': { positive: 20, negative: 75 },
    'angry': { positive: 15, negative: 80 },
    'fear': { positive: 10, negative: 85 },
    'disgust': { positive: 15, negative: 70 }
  };

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
    
    // Get scores based on emotion, or use default for no data
    const scores = normalizedEmotion 
      ? emotionScores[normalizedEmotion] || { positive: 50, negative: 50 }
      : { positive: 0, negative: 0 };
    
    chartData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      positive: scores.positive,
      negative: scores.negative,
      emotion: normalizedEmotion || null,
      hasData: !!normalizedEmotion
    });
  }
  
  return chartData;
};

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const today = new Date();
    const days = [];

    for (let i = firstDay; i > 0; i--) {
      days.push({ day: prevMonthLastDay - i + 1, isCurrentMonth: false, isToday: false });
    }

    for (let i = 1; i <= lastDay; i++) {
      const isToday = i === today.getDate() && 
                     month === today.getMonth() && 
                     year === today.getFullYear();
      days.push({ day: i, isCurrentMonth: true, isToday });
    }

    const remainingDays = 42 - (firstDay + lastDay);
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isCurrentMonth: false, isToday: false });
    }

    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const getEmotionEmoji = (emotion) => {
  const normalizedEmotion = normalizeEmotion(emotion);
  if (!normalizedEmotion) return '😐';
  return EMOTION_EMOJIS[normalizedEmotion] || '😐';
};

  const appointments = [
    { name: 'Dr. Emily Smith', time: 'Today, 3:00 PM', avatar: 'ES' },
    { name: 'Dr. Adward M', time: 'Today, 6:00 PM', avatar: 'AM' },
    { name: 'Dr. Moko Denis', time: 'Today, 9:00 PM', avatar: 'MD' },
    { name: 'Dr. Krish Singh', time: 'Today, 12:00 PM', avatar: 'KS' },
    { name: 'Dr. Ketrina Vete', time: 'Tomorrow, 10:00AM', avatar: 'KV' },
    { name: 'Dr. Mike Jack', time: 'Tomorrow, 11:00 AM', avatar: 'MJ' }
  ];
   
  if (historyLoading && (!historyData || Object.keys(historyData.daily_summary || {}).length===0)) {
  return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary to-secondary opacity-20 animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            MindWell
          </h1>
          <div className="flex items-center justify-center gap-2 opacity-60">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="mt-4 opacity-60">Loading your creative workspace...</p>
        </div>
      </div>
    )
}


  const weekdayMap = getWeekdayMap(historyData?.daily_summary || {})
  const chartData = generateChartData(historyData.daily_summary || {});
  const weeklyEmotion = historyData.weekly_summary
  ? normalizeEmotion(getLatestEmotion(historyData.weekly_summary))
  : null;
  const monthlyEmotion = historyData?.monthly_summary
  ? normalizeEmotion(getLatestEmotion(historyData?.monthly_summary))
  : null;
  const recentEmotion = historyData?.daily_summary
  ? normalizeEmotion(getMostRecentEmotion(historyData.daily_summary))
  : null;

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="min-h-screen transition-all duration-300">
      <div className="flex h-screen overflow-hidden bg-base-100">
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Mobile Right Sidebar Overlay */}
        {isRightSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsRightSidebarOpen(false)}
          />
        )}

        {/* Left Mini Sidebar - RESPONSIVE */}
        <nav className="w-12 md:w-20 bg-base-200 shadow-lg flex flex-col items-center py-4 md:py-6 fixed left-0 top-0 h-full z-30">
          <div className="flex flex-col space-y-3 md:space-y-5 flex-grow">
            <button className="btn btn-circle btn-primary btn-sm md:btn-md">
              <Home className="size-5 md:w-6 md:h-6" />
            </button>
            <Link to='/AI' className="btn btn-circle btn-ghost btn-sm md:btn-md">
              <Bot className="size-6 md:w-6 md:h-6" />
            </Link>
            <Link to='/chat' className="btn btn-circle btn-ghost btn-sm md:btn-md">
              <MessageCircle className="size-6 md:w-6 md:h-6" />
            </Link>
          </div>
          <div className="flex flex-col space-y-3 md:space-y-5 mt-auto">
            <button className="btn btn-circle btn-ghost btn-sm md:btn-md">
              <HelpCircle className="size-6 md:w-6 md:h-6" />
            </button>
            <button onClick={logout} className="btn btn-circle btn-ghost btn-sm md:btn-md">
              {logoutLoading ? <LoaderIcon className="animate-spin w-3 h-3 md:w-4 md:h-4" />: <LogOut className="size-6 md:w-6 md:h-6" />}
            </button>
          </div>
        </nav>

        {/* Top Navbar - RESPONSIVE */}
        <div className="fixed top-0 left-12 md:left-20 right-0 z-20 bg-base-200 shadow-lg lg:hidden">
          <div className="navbar px-2 md:px-4">
            <div className="flex-1">
              <button 
                className="btn btn-ghost btn-circle btn-sm md:btn-md"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <h1 className="text-base md:text-xl font-bold ml-2">MindWell</h1>
            </div>
            <div className="flex-none gap-1 md:gap-2">
              <button className="btn btn-ghost btn-circle btn-sm md:btn-md">
                <Bell className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button 
                className="btn btn-ghost btn-circle btn-sm md:btn-md"
                onClick={() => setIsRightSidebarOpen(true)}
              >
                <CalendarDays className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="hidden lg:block">
          <Navbar/>
        </div>

        <div className="pt-16 md:pt-20 ml-0 lg:ml-20 w-full flex lg:grid lg:grid-cols-12 lg:gap-6">
          {/* Expanded Sidebar - RESPONSIVE */}
          <aside className={`w-64 md:w-72 bg-base-200 shadow-lg p-4 md:p-6 overflow-y-auto no-scrollbar transition-transform duration-300 ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static top-0 left-0 lg:left-20 bottom-0 z-40 lg:z-auto lg:col-span-3`}>
            
            <div className="lg:hidden flex justify-end mb-4">
              <button 
                className="btn btn-circle btn-ghost btn-sm"
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            {/* User Profile - RESPONSIVE */}
            <div className="text-center mb-6">
      <div className="avatar mb-3">
        <div className="w-20 md:w-24 rounded-full overflow-hidden">
          <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center text-xl md:text-2xl font-bold">
            {uploading ? (
              <LoaderIcon className="animate-spin w-5 h-5 md:w-6 md:h-6" />
            ) : imageUrl ? (
              <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              userData?.name?.[0]?.toUpperCase() || '?'
            )}
          </div>
        </div>
      </div>
      <h3 className="font-semibold text-lg md:text-xl">
        {userData?.name || 'Guest'}
      </h3>
    </div>
            <section className="mb-6">
                <h3 className="text-base md:text-lg font-semibold text-primary mb-3">Emotion Summary</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col items-center bg-base-200 rounded-lg p-2">
                            <span className="text-2xl">{getEmotionEmoji(weeklyEmotion)}</span>
                            <span className="text-xs capitalize">{weeklyEmotion || 'N/A'}</span>
                            <span className="text-[15px] text-muted">Weekly</span>
                        </div>
                        <div className="flex flex-col items-center bg-base-200 rounded-lg p-2">
                            <span className="text-2xl">{getEmotionEmoji(monthlyEmotion)}</span>
                            <span className="text-xs capitalize">{monthlyEmotion || 'N/A'}</span>
                            <span className="text-[15px] text-muted">Monthly</span>
                        </div>
                    </div>
            </section>

            {/* Exercises - RESPONSIVE */}
            <section className="mb-6">
              <h3 className="text-base md:text-lg font-semibold text-primary mb-3">Exercise for You</h3>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {[
                  { icon: <Wind className="w-5 h-5 md:w-6 md:h-6 text-primary" />, title: "Breathing Exercise", desc: "5 min guided session" },
                  { icon: <Flower2 className="w-5 h-5 md:w-6 md:h-6 text-primary" />, title: "Mindfulness", desc: "10 min meditation" },
                  { icon: <Music className="w-5 h-5 md:w-6 md:h-6 text-primary" />, title: "Sound Therapy", desc: "Calm playlist" },
                  { icon: <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-primary" />, title: "Journaling", desc: "Express feelings" },
                ].map((ex, idx) => (
                  <div key={idx} className="card bg-base-200 shadow-md hover:shadow-xl border border-base-300">
                    <div className="card-body p-3 md:p-4">
                      {ex.icon}
                      <h4 className="font-medium text-xs md:text-sm">{ex.title}</h4>
                      <p className="text-xs text-base-content/60">{ex.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn-link btn-sm w-full mt-3 text-primary">
                More Exercises <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1" />
              </button>
            </section>
          </aside>

          {/* Main Content - RESPONSIVE */}
          <main className="flex-1 lg:col-span-6 overflow-y-auto scrollbar scrollbar-none p-1 md:p-4 no-scrollbar w-full ml-12 md:ml-20 lg:ml-0">
            {/* Category Filters - RESPONSIVE */}
            <section className="flex gap-2 mb-4 md:mb-6 overflow-x-auto no-scrollbar pb-2">
              <button className="btn btn-primary btn-xs md:btn-sm whitespace-nowrap">All</button>
              <Link to='/chat' className="btn btn-outline btn-xs md:btn-sm whitespace-nowrap">Talk to Friend</Link>
              <Link to='/breath' className="btn btn-outline btn-xs md:btn-sm whitespace-nowrap">Meditation</Link>
              <Link to='/note' className="btn btn-outline btn-xs md:btn-sm whitespace-nowrap">Journaling</Link>
              <Link to='/music' className="btn btn-outline btn-xs md:btn-sm whitespace-nowrap">Music</Link>
              <Link to='/detect-emotion' className="btn btn-outline btn-xs md:btn-sm whitespace-nowrap">Analyze Emotion</Link>
              <Link to='/location' className="btn btn-outline btn-xs md:btn-sm whitespace-nowrap">Locate Friends</Link>
            </section>

            {/* Weekly Mood Tracker - RESPONSIVE */}
            <div className="card bg-base-100 shadow-xl mb-3">
                      <div className="card-body p-3 md:p-4 lg:p-6">
                        <h3 className="card-title text-base md:text-lg xl:text-xl mb-3 md:mb-4 flex items-center gap-2">
                          <History className="w-4 h-4 md:w-5 md:h-5" />
                          Mood History
                        </h3>
                        
                        <div className="grid grid-cols-7 gap-1 md:gap-2 lg:gap-4">
                          {weekdays.map((day) => {
                            const rawEmotion = weekdayMap[day];
                            const emotion = normalizeEmotion(rawEmotion);
                            const emoji = getEmotionEmoji(emotion);
                            const hasData = emotion !== null && emotion !== undefined;
                            
                            return (
                              <div key={day} className={`flex flex-col items-center gap-1 md:gap-2 p-1.5 md:p-2 lg:p-3 rounded-lg transition-colors ${
                                hasData ? 'bg-base-200 hover:bg-base-300' : 'bg-base-100 border-2 border-dashed border-base-300'
                              }`}>
                                <div className={`text-xl md:text-2xl lg:text-3xl mb-0.5 md:mb-1 ${!hasData ? 'opacity-30' : ''}`}>
                                  {hasData ? emoji : '😐'}
                                </div>
                                <span className="text-xs font-medium text-base-content/70 hidden sm:inline">{day.slice(0, 3)}</span>
                                <span className="text-xs font-medium text-base-content/70 sm:hidden">{day.slice(0, 1)}</span>
                                <span className={`text-xs text-center capitalize px-1 md:px-2 py-0.5 md:py-1 rounded-full text-base-content/80 ${
                                  hasData ? 'bg-base-100' : 'bg-base-200 text-base-content/50'
                                } hidden md:inline-block`}>
                                  {hasData ? emotion : 'No data'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
            

            <div className="space-y-3 md:space-y-4">
  {/* Top Row - Bar Chart - RESPONSIVE */}
  <div className="w-full">
    <div className="card bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 shadow-xl border border-base-300/20">
      <div className="card-body p-3 md:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
          <div>
            <h2 className="card-title text-sm md:text-base lg:text-lg mb-1 flex items-center gap-2">
              <BarChart3 className="w-3 h-3 md:w-4 md:h-4 text-primary" />
              Weekly Mood Analysis
            </h2>
            <p className="text-xs text-base-content/60 hidden sm:block">Positive and negative emotions breakdown</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="badge badge-outline badge-success gap-1 badge-xs">
              <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-success rounded-full"></div>
              <span className="text-xs">Positive</span>
            </div>
            <div className="badge badge-outline badge-error gap-1 badge-xs">
              <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-error rounded-full"></div>
              <span className="text-xs">Negative</span>
            </div>
          </div>
        </div>

        <div className="relative h-28 md:h-32 lg:h-36 bg-gradient-to-t from-base-200/30 to-transparent rounded-lg p-2">
          <div className="flex items-end justify-between h-full px-0.5 md:px-1">
            {chartData.map((data, index) => (
              <div key={index} className="flex flex-col items-center gap-0.5 md:gap-1 flex-1 max-w-8 md:max-w-12 lg:max-w-16">
                <div className="flex flex-col items-center justify-end h-20 md:h-24 gap-0.5">
                  <div
                    className={`w-4 md:w-6 lg:w-8 rounded-t transition-all duration-500 tooltip ${
                      data.hasData 
                        ? 'bg-gradient-to-t from-success to-success/80 hover:from-success/90 hover:to-success' 
                        : 'bg-base-300/50'
                    }`}
                    style={{ height: `${data.hasData ? data.positive : 10}%` }}
                    data-tip={data.hasData ? `${data.emotion} - Positive: ${Math.round(data.positive)}%` : 'No data available'}
                  ></div>
                  <div
                    className={`w-4 md:w-6 lg:w-8 rounded-b transition-all duration-500 tooltip ${
                      data.hasData 
                        ? 'bg-gradient-to-b from-error to-error/80 hover:from-error/90 hover:to-error' 
                        : 'bg-base-300/50'
                    }`}
                    style={{ height: `${data.hasData ? data.negative : 10}%` }}
                    data-tip={data.hasData ? `${data.emotion} - Negative: ${Math.round(data.negative)}%` : 'No data available'}
                  ></div>
                </div>
                <span className="text-xs text-base-content/60 font-medium hidden sm:inline">{data.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Bottom Row - Trend Chart and Suggestions Side by Side - RESPONSIVE */}
  <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4">
    {/* Trend Line Chart - Takes up 60% on large screens - RESPONSIVE */}
    <div className="lg:col-span-3">
      <div className="card bg-gradient-to-br from-secondary/10 via-accent/5 to-primary/10 shadow-xl border border-base-300/20">
        <div className="card-body p-3 md:p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="card-title text-sm md:text-base lg:text-lg mb-1 flex items-center gap-2">
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-secondary" />
                Mood Trends
              </h2>
              <p className="text-xs text-base-content/60 hidden sm:block">Overall mood progression this week</p>
            </div>
          </div>

          <div className="relative h-24 md:h-28 lg:h-32 bg-gradient-to-t from-base-200/30 to-transparent rounded-lg  md:p-3">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-base-content/50 py-2">
              <span>10</span>
              <span>8</span>
              <span>6</span>
              <span>4</span>
              <span>2</span>
              <span>0</span>
            </div>

            {/* Chart area */}
            <div className="ml-3 md:ml-4 h-full relative">
              <svg className="w-full h-full" viewBox="0 0 280 100" preserveAspectRatio="none">
                {/* Grid lines */}
                <defs>
                  <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-base-content/10"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Line chart */}
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-secondary"
                  points={chartData.map((data, index) => {
                    const x = (index * 280) / (chartData.length - 1);
                    const totalMood = data.hasData ? (data.positive + Math.abs(data.negative - 100)) / 20 : 5;
                    const y = 100 - (totalMood * 10);
                    return `${x},${y}`;
                  }).join(' ')}
                />

                {/* Data points */}
                {chartData.map((data, index) => {
                  const x = (index * 280) / (chartData.length - 1);
                  const totalMood = data.hasData ? (data.positive + Math.abs(data.negative - 100)) / 20 : 5;
                  const y = 100 - (totalMood * 10);
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="3"
                      fill="currentColor"
                      className="text-secondary hover:text-secondary/80 cursor-pointer tooltip"
                      data-tip={data.hasData ? `${data.emotion} - Score: ${totalMood.toFixed(1)}` : 'No data'}
                    />
                  );
                })}

                {/* Area fill under the line */}
                <path
                  d={`M 0,100 ${chartData.map((data, index) => {
                    const x = (index * 280) / (chartData.length - 1);
                    const totalMood = data.hasData ? (data.positive + Math.abs(data.negative - 100)) / 20 : 5;
                    const y = 100 - (totalMood * 10);
                    return `L ${x},${y}`;
                  }).join(' ')} L 280,100 Z`}
                  fill="currentColor"
                  className="text-secondary/20"
                />
              </svg>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between text-xs text-base-content/50 mt-2 ml-3 md:ml-4 overflow-x-auto no-scrollbar">
              {chartData.map((data, index) => (
                <span key={index} className="flex-1 text-center min-w-8">
                  {data.date}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Recent Emotion Suggestions - Takes up 40% on large screens - RESPONSIVE */}
    <div className="lg:col-span-2">
      {recentEmotion && (
        <div className={`card bg-gradient-to-r ${getEmotionSuggestions(recentEmotion)?.color} shadow-xl h-full`}>
          <div className="card-body p-3 md:p-4">
            <h2 className="card-title text-sm md:text-base lg:text-lg mb-3 flex items-center gap-2">
              <span className="text-lg md:text-xl">{getEmotionEmoji(recentEmotion)}</span>
              <span className="truncate text-sm md:text-base">{getEmotionSuggestions(recentEmotion)?.title}</span>
            </h2>
            
            <div className="space-y-2">
              {getEmotionSuggestions(recentEmotion)?.items.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center gap-2 md:gap-3 p-2 bg-base-100/50 hover:bg-base-100/70 transition-colors cursor-pointer rounded-lg">
                  <div className="text-base md:text-lg flex-shrink-0">{item.icon}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-xs md:text-sm text-base-content truncate">{item.title}</h3>
                    <p className="text-xs text-base-content/70 line-clamp-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
</div>


          </main>

          {/* Right Sidebar - RESPONSIVE - Show on mobile when toggled */}
          <aside className={`w-72 md:w-80 bg-base-200 shadow-lg p-4 md:p-6 overflow-y-auto no-scrollbar transition-transform duration-300 ${
            isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          } lg:translate-x-0 fixed lg:static top-0 right-0 h-full z-40 lg:z-auto lg:col-span-3`}>
            
            <div className="lg:hidden flex justify-between items-center mb-4">
              <h2 className="text-base md:text-lg font-bold">Calendar & Events</h2>
              <button 
                className="btn btn-circle btn-ghost btn-sm"
                onClick={() => setIsRightSidebarOpen(false)}
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            {/* Calendar - RESPONSIVE */}
            <section className="mb-6">
              <h3 className="text-base md:text-lg font-semibold text-primary mb-4">Calendar</h3>
              <div className="card bg-base-300 shadow">
                <div className="card-body p-3 md:p-4">
                  <div className="flex justify-between items-center mb-4">
                    <button 
                      className="btn btn-circle btn-ghost btn-sm"
                      onClick={() => navigateMonth(-1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h4 className="font-bold text-sm md:text-base lg:text-lg">
                      {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h4>
                    <button 
                      className="btn btn-circle btn-ghost btn-sm"
                      onClick={() => navigateMonth(1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 md:gap-1 text-center text-xs mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="font-medium p-1 md:p-2">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 md:gap-1">
                    {generateCalendarDays().map((day, index) => (
                      <button
                        key={index}
                        className={`btn btn-ghost btn-xs h-7 md:h-8 min-h-7 md:min-h-8 text-xs ${
                          day.isToday ? 'btn-primary' : 
                          !day.isCurrentMonth ? 'text-base-content/30' : ''
                        }`}
                      >
                        {day.day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Appointments - RESPONSIVE */}
            <section>
              <h3 className="text-base md:text-lg font-semibold text-primary mb-4">Upcoming Appointments</h3>
              <div className="space-y-2 md:space-y-3">
                {appointments.map((appointment, index) => (
                  <div key={index} className="card bg-primary/10 border border-primary/20">
                    <div className="card-body p-2 md:p-3 flex-row items-center">
                      <div className="avatar placeholder mr-2 md:mr-3">
                        <div className="bg-primary text-primary-content rounded-full w-8 md:w-10">
                          <span className="text-xs">{appointment.avatar}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm md:text-base truncate">{appointment.name}</h4>
                        <p className="text-xs text-base-content/60">{appointment.time}</p>
                      </div>
                      <Video className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default HomePage;