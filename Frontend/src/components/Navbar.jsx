import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { PlusIcon, User, LoaderIcon, LogOut, Settings, Camera, Menu, Bell } from 'lucide-react';
import { AppContent } from '../context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import api from "../lib/axios";
import { useSocketStore } from '../store/useSocketStore';

const Navbar = () => {
  const { userData, backendUrl, setUserData, setIsLoggedin, setIsMobileSidebarOpen } = useContext(AppContent);
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const isNotePage = location.pathname === '/note';

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await api.get("/api/user/data");
        if (res.data.success) {
          setImageUrl(res.data.userData.profilePic);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setUserData(res.data.userData); // ✅ store user data
        setIsLoggedin(true);
      }
    };
    fetchUserData();
  }, []);

  const sendVerificationOtp = async () => {
    setLoading(true);
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backendUrl + '/api/auth/send-verify-otp');
      if (data.success) {
        navigate('/email-verify');
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    setUploading(true);
    const file = e.target.files[0];
    if (!file) return alert("Please select a file!");

    try {
      const formData = new FormData();
      formData.append("profilePic", file);
      const res = await api.put("/api/user/update-profile-pic", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setImageUrl(res.data.profilePic);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const logout = async () => {
    setLogoutLoading(true);
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backendUrl + '/api/auth/logout');
      if (data.success) {
        setIsLoggedin(false);
        setUserData(null);
        useSocketStore.getState().disconnectSocket();
        navigate('/login');
        // window.location.reload();
        setIsLoggedin(false);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLogoutLoading(false);
    }
  };

  const location1 = useLocation();
  const isHome = location1.pathname === '/';



  return (
    <header className={`fixed top-0 right-0 bg-base-100 shadow-sm p-4 flex justify-between items-center z-[1000] ${
        isHome ? 'left-20' : 'left-0'
      }`}
>
      <div className="flex items-center space-x-4">
        <button
          className="btn btn-circle btn-ghost lg:hidden"
          onClick={() => setIsMobileSidebarOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link to='/' className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent cursor-pointer">
          MindWell
        </Link>
        {isNotePage && (
          <Link to="/create" className="btn btn-primary gap-2">
            <PlusIcon className="w-4 h-4" />
            New Note
          </Link>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="indicator">
          <button className="btn btn-circle btn-ghost">
            <Bell className="w-6 h-6" />
          </button>
          <span className="badge badge-error badge-xs indicator-item">3</span>
        </div>

        <Link to="/settings" className="btn btn-circle btn-ghost">
          <Settings className="w-6 h-6" />
        </Link>

        {userData ? (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="avatar btn btn-circle btn-ghost">
              <div className="w-10 rounded-full overflow-hidden bg-primary text-primary-content flex items-center justify-center text-sm font-semibold">
                {uploading ? (
                  <LoaderIcon className="animate-spin w-4 h-4" />
                ) : imageUrl ? (
                  <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  userData.name[0].toUpperCase()
                )}
              </div>
            </div>

            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box w-44 p-2 shadow border border-base-300 z-[1]">
              {!userData.isAccountVerified && (
                <li>
                  <button
                    onClick={sendVerificationOtp}
                    className="hover:bg-primary hover:text-primary-content transition-colors duration-200 rounded-lg p-2"
                  >
                    {loading ? <LoaderIcon className="animate-spin w-4 h-4" /> : 'Verify Account'}
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 hover:bg-error hover:text-error-content transition-colors duration-200 rounded-lg p-2"
                >
                  <LogOut className="w-4 h-4" />
                  {logoutLoading ? <LoaderIcon className="animate-spin w-4 h-4" /> : 'Logout'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById('avatar-upload').click()}
                  className="flex items-center gap-2 hover:bg-base-200 transition-colors duration-200 rounded-lg p-2"
                >
                  <Camera className="w-4 h-4 text-primary" />
                  {uploading ? <LoaderIcon className="animate-spin w-4 h-4" /> : 'Profile Pic'}
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary px-6 flex items-center gap-2">
            <User className="w-5 h-5" />
            Login
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;