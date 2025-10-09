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
  const [currentDate, setCurrentDate] = useState(new Date());
  const {setUserData, userData, backendUrl, setIsLoggedin } = useContext(AppContent);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [historyData, setHistoryData] = useState(null);
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

  const generateChartData = (dailySummary = {}) => {
  const chartData = [];
  const today = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    let emotion =
      dailySummary?.[dateStr] ??
      dailySummary?.[date.toLocaleDateString("en-US")] ??
      dailySummary?.[date.toLocaleDateString("en-CA")] ??
      null;

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
   
  if (!historyData || !historyData.daily_summary) {
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


  const weekdayMap = getWeekdayMap(historyData?.daily_summary)
  const chartData = generateChartData(historyData.daily_summary);
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

        {/* Left Mini Sidebar */}
        <nav className="w-20 bg-base-200 shadow-lg flex flex-col items-center py-6 fixed left-0 top-0 h-full z-30">
          <div className="flex flex-col space-y-5 flex-grow">
            <button className="btn btn-circle btn-primary">
              <Home className="w-6 h-6" />
            </button>
            <Link to='/AI' className="btn btn-circle btn-ghost">
              <Bot className="w-6 h-6" />
            </Link>
            <Link to='/chat' className="btn btn-circle btn-ghost">
              <MessageCircle className="w-6 h-6" />
            </Link>
          </div>
          <div className="flex flex-col space-y-5 mt-auto">
            <button className="btn btn-circle btn-ghost">
              <HelpCircle className="w-6 h-6" />
            </button>
            <button onClick={logout} className="btn btn-circle btn-ghost">
              {logoutLoading ? <LoaderIcon className="animate-spin w-4 h-4" />: <LogOut className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Top Navbar */}
        <Navbar/>

        <div className=" pt-20 ml-20 w-full grid grid-cols-12 gap-6">
          {/* Expanded Sidebar */}
          <aside className={` col-span-3 bg-base-200 shadow-lg p-6 overflow-y-auto no-scrollbar transition-transform duration-300 ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } fixed lg:static top-0 left-20 h-full z-40 lg:z-auto`}>
            
            <div className="lg:hidden flex justify-end mb-4">
              <button 
                className="btn btn-circle btn-ghost"
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* User Profile */}
            <div className="text-center mb-6">
      <div className="avatar mb-3">
        <div className="w-24 rounded-full overflow-hidden">
          <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center text-2xl font-bold">
            {uploading ? (
              <LoaderIcon className="animate-spin w-6 h-6" />
            ) : imageUrl ? (
              <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              userData?.name?.[0]?.toUpperCase() || '?'
            )}
          </div>
        </div>
      </div>
      <h3 className="font-semibold text-xl">
        {userData?.name || 'Guest'}
      </h3>
    </div>
            <section className="mb-6">
                <h3 className="text-lg font-semibold text-primary mb-3">Emotion Summary</h3>
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

            {/* Exercises */}
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-primary mb-3">Exercise for You</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Wind className="w-6 h-6 text-primary" />, title: "Breathing Exercise", desc: "5 min guided session" },
                  { icon: <Flower2 className="w-6 h-6 text-primary" />, title: "Mindfulness", desc: "10 min meditation" },
                  { icon: <Music className="w-6 h-6 text-primary" />, title: "Sound Therapy", desc: "Calm playlist" },
                  { icon: <BookOpen className="w-6 h-6 text-primary" />, title: "Journaling", desc: "Express feelings" },
                ].map((ex, idx) => (
                  <div key={idx} className="card bg-base-200 shadow-md hover:shadow-xl border border-base-300">
                    <div className="card-body p-4">
                      {ex.icon}
                      <h4 className="font-medium">{ex.title}</h4>
                      <p className="text-xs text-base-content/60">{ex.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn-link btn-sm w-full mt-3 text-primary">
                More Exercises <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </section>
          </aside>

          {/* Main Content */}
          <main className="flex-1 col-span-6 overflow-y-auto scrollbar scrollbar-none p-6 no-scrollbar">
            {/* Category Filters */}
            <section className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
              <button className="btn btn-primary btn-sm">All</button>
              <Link to='/chat' className="btn btn-outline btn-sm">Talk to Friend</Link>
              <Link to='/breath' className="btn btn-outline btn-sm">Meditation</Link>
              <Link to='/note' className="btn btn-outline btn-sm">Journaling</Link>
              <Link to='/music' className="btn btn-outline btn-sm">Music</Link>
              <Link to='/detect-emotion' className="btn btn-outline btn-sm">Analyze Emotion</Link>
              <Link to='/location' className="btn btn-outline btn-sm">Locate Friends</Link>
            </section>

            {/* Weekly Mood Tracker */}
            <div className="card bg-base-100 shadow-xl mb-3">
                      <div className="card-body ">
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
            

            <div className="space-y-4 max-w-6xl mx-auto">
  {/* Top Row - Bar Chart */}
  <div className="w-full">
    <div className="card bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 shadow-xl border border-base-300/20">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="card-title text-lg mb-1 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Weekly Mood Analysis
            </h2>
            <p className="text-xs text-base-content/60">Positive and negative emotions breakdown</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="badge badge-outline badge-success gap-1 badge-xs">
              <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
              <span className="text-xs">Positive</span>
            </div>
            <div className="badge badge-outline badge-error gap-1 badge-xs">
              <div className="w-1.5 h-1.5 bg-error rounded-full"></div>
              <span className="text-xs">Negative</span>
            </div>
          </div>
        </div>

        <div className="relative h-36 bg-gradient-to-t from-base-200/30 to-transparent rounded-lg p-2">
          <div className="flex items-end justify-between h-full px-1">
            {chartData.map((data, index) => (
              <div key={index} className="flex flex-col items-center gap-1 flex-1 max-w-16">
                <div className="flex flex-col items-center justify-end h-24 gap-0.5">
                  <div
                    className={`w-8 rounded-t transition-all duration-500 tooltip ${
                      data.hasData 
                        ? 'bg-gradient-to-t from-success to-success/80 hover:from-success/90 hover:to-success' 
                        : 'bg-base-300/50'
                    }`}
                    style={{ height: `${data.hasData ? data.positive : 10}%` }}
                    data-tip={data.hasData ? `${data.emotion} - Positive: ${Math.round(data.positive)}%` : 'No data available'}
                  ></div>
                  <div
                    className={`w-8 rounded-b transition-all duration-500 tooltip ${
                      data.hasData 
                        ? 'bg-gradient-to-b from-error to-error/80 hover:from-error/90 hover:to-error' 
                        : 'bg-base-300/50'
                    }`}
                    style={{ height: `${data.hasData ? data.negative : 10}%` }}
                    data-tip={data.hasData ? `${data.emotion} - Negative: ${Math.round(data.negative)}%` : 'No data available'}
                  ></div>
                </div>
                <span className="text-xs text-base-content/60 font-medium">{data.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Bottom Row - Trend Chart and Suggestions Side by Side */}
  <div className="flex flex-col lg:flex-row gap-4">
    {/* Trend Line Chart - Takes up 60% on large screens */}
    <div className="flex-1 lg:flex-[3]">
      <div className="card bg-gradient-to-br from-secondary/10 via-accent/5 to-primary/10 shadow-xl border border-base-300/20">
        <div className="card-body p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="card-title text-lg mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-secondary" />
                Mood Trends
              </h2>
              <p className="text-xs text-base-content/60">Overall mood progression this week</p>
            </div>
          </div>

          <div className="relative h-32 bg-gradient-to-t from-base-200/30 to-transparent rounded-lg p-3">
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
            <div className="ml-4 h-full relative">
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
            <div className="flex justify-between text-xs text-base-content/50 mt-2 ml-4">
              {chartData.map((data, index) => (
                <span key={index} className="flex-1 text-center">
                  {data.date}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Recent Emotion Suggestions - Takes up 40% on large screens */}
    <div className="flex-1 lg:flex-[2]">
      {recentEmotion && (
        <div className={`card bg-gradient-to-r ${getEmotionSuggestions(recentEmotion)?.color} shadow-xl`}>
          <div className="card-body p-4">
            <h2 className="card-title text-lg mb-3 flex items-center gap-2">
              <span className="text-xl">{getEmotionEmoji(recentEmotion)}</span>
              <span className="truncate">{getEmotionSuggestions(recentEmotion)?.title}</span>
            </h2>
            
            <div className="space-y-2">
              {getEmotionSuggestions(recentEmotion)?.items.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-base-100/50 hover:bg-base-100/70 transition-colors cursor-pointer rounded-lg">
                  <div className="text-lg flex-shrink-0">{item.icon}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-base-content truncate">{item.title}</h3>
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

          {/* Right Sidebar */}
          <aside className="col-span-3 bg-base-200 shadow-lg p-6 overflow-y-auto hidden lg:flex flex-col no-scrollbar">
            {/* Calendar */}
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-primary mb-4">Calendar</h3>
              <div className="card bg-base-300 shadow">
                <div className="card-body p-4">
                  <div className="flex justify-between items-center mb-4">
                    <button 
                      className="btn btn-circle btn-ghost btn-sm"
                      onClick={() => navigateMonth(-1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h4 className="font-bold text-lg">
                      {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h4>
                    <button 
                      className="btn btn-circle btn-ghost btn-sm"
                      onClick={() => navigateMonth(1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="font-medium p-2">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendarDays().map((day, index) => (
                      <button
                        key={index}
                        className={`btn btn-ghost btn-sm h-8 min-h-8 text-xs ${
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

            {/* Appointments */}
            <section>
              <h3 className="text-lg font-semibold text-primary mb-4">Upcoming Appointments</h3>
              <div className="space-y-3">
                {appointments.map((appointment, index) => (
                  <div key={index} className="card bg-primary/10 border border-primary/20">
                    <div className="card-body p-3 flex-row items-center">
                      <div className="avatar placeholder mr-3">
                        <div className="bg-primary text-primary-content rounded-full w-10">
                          <span className="text-xs">{appointment.avatar}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{appointment.name}</h4>
                        <p className="text-xs text-base-content/60">{appointment.time}</p>
                      </div>
                      <Video className="w-5 h-5 text-primary" />
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
