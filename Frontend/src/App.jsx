import React, { useContext, useEffect } from 'react'
import {Route,Routes, useNavigate} from 'react-router';
import NoteHomePage from './pages/NoteHomePage';
import CreatePage from './pages/CreatePage';
import NoteDetailPage from './pages/NoteDetailPage';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmailVerifyPage from './pages/EmailVerifyPage';
import SettingPage from './pages/SettingPage';
import { useThemeStore } from './lib/useTheme';
import ProfilePicUpdate from './components/ProfilePicUpdate';
import ChatHomePage from './pages/ChatHomePage';
import CallPage from './pages/CallPage';
import IncomingCall from './components/IncomingCall';
import LocationPage from './pages/LocationPage';
import EmotionDetectPage from './pages/EmotionDetectPage';
import MusicPage from './pages/MusicPage';
import HomePage from './pages/HomePage';
import BreathingPage from './pages/BreathingPage';
import { AppContent } from './context/AppContext';


const App = () => {
  const {theme} = useThemeStore();
  const navigate = useNavigate();
  const {isLoggedin, authLoading} = useContext(AppContent) 
  useEffect(() => {
  if (!authLoading) {
    if (!isLoggedin && window.location.pathname !== '/login') {
      navigate('/login');
    } else if (isLoggedin && window.location.pathname === '/login') {
      navigate('/');
    }
  }
}, [authLoading, isLoggedin, navigate]);
  return (
    

    <div className="relative h-full w-full" data-theme={theme}>




      <Routes>
        <Route path = '/' element= {<HomePage/>}/>
        <Route path = '/note' element = {<NoteHomePage/>}/>
        <Route path = '/create' element = {<CreatePage/>}/>
        <Route path = '/note/:id' element = {<NoteDetailPage/>}/>
        <Route path = '/login' element = {<LoginPage/>}/>
        <Route path = '/reset-password' element = {<ResetPasswordPage/>}/>
        <Route path = '/email-verify' element = {<EmailVerifyPage/>}/>
        <Route path = '/settings' element = {<SettingPage/>}/>
        <Route path = '/profile-pic-update' element = {<ProfilePicUpdate/>}/>
        <Route path = '/chat' element= {<ChatHomePage/>}/>
        <Route path = '/call/:callId' element= {<CallPage/>}/>
        <Route path = '/location' element = {<LocationPage/>}/>
        <Route path = '/detect-emotion' element= {<EmotionDetectPage/>}/>
        <Route path = '/music' element= {<MusicPage/>}/>
        {/* <Route path = '/home2' element= {<HomePage2/>}/> */}
        <Route path = '/breath' element= {<BreathingPage/>}/>
        
        
        

      </Routes>
      <IncomingCall/>
    </div>
  )
}

export default App



