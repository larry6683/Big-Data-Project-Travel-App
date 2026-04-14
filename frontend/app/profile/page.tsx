// frontend/app/profile/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import ProfileModal from "../../components/ProfileModal";
import Link from "next/link";
import { User, LogOut, Bookmark, Settings, Edit3, Loader2 } from "lucide-react";
import { travelApi } from "@/services/api";

export default function ProfilePage() {
  const { logout, isLoggedIn } = useAuth();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
    "http://localhost:8000";

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await travelApi.getProfile();
      setProfileData(data);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchProfile();
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-theme-bg">
        <h1 className="text-2xl font-bold text-theme-text mb-4">
          Please login to view your profile
        </h1>
        <Link
          href="/auth"
          className="bg-theme-primary text-theme-bg px-6 py-2 rounded-lg hover:bg-theme-secondary transition-colors font-bold shadow-md"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg relative flex flex-col">
      <Navbar />

      <ProfileModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onProfileUpdate={fetchProfile} 
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 animate-in fade-in duration-300">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-theme-text tracking-tight">
              My Profile
            </h1>
            <p className="text-theme-text/70 font-medium mt-1">
              Manage your personal information and preferences.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-theme-primary" size={40} />
          </div>
        ) : (
          <div className="bg-theme-surface rounded-2xl border border-theme-muted/30 shadow-sm overflow-hidden">
            
            {/* Section 1: User Profile Header */}
            <div className="p-4 md:p-8 border-b border-theme-muted/80 flex flex-col md:flex-row items-center md:items-center gap-6">
              
              <div className="w-24 h-24 bg-theme-primary/10 text-theme-primary border-2 border-theme-surface rounded-full flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                {profileData?.profile_picture_url ? (
                  <img 
                    src={`${API_BASE_URL}${profileData.profile_picture_url}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={48} />
                )}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-theme-text mb-1">
                  {profileData?.full_name || profileData?.email?.split('@')[0] || "User"}
                </h2>
                <p className="text-theme-text/60 font-medium">
                  Adventurer
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-theme-bg text-theme-text rounded-xl border border-theme-muted/30 hover:border-theme-primary transition-colors font-bold text-sm"
                >
                  <Edit3 size={16} /> Edit Profile
                </button>
                <button
                  onClick={logout}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100 hover:bg-red-100 transition-colors font-bold text-sm shadow-sm"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>

            {/* Section 2: Account Details */}
            <div className="p-4 md:p-8 border-b border-theme-muted/80">
              <h3 className="text-lg font-black text-theme-text mb-6 flex items-center gap-2">
                <Settings size={20} className="text-theme-muted" /> Account Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-theme-text/60 uppercase tracking-widest mb-1">Full Name</label>
                  <div className="w-full p-3 bg-theme-bg border border-theme-muted/30 rounded-xl text-theme-text font-medium shadow-inner">
                    {profileData?.full_name || <span className="text-theme-text/40 italic">Not provided</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-text/60 uppercase tracking-widest mb-1">Email Address</label>
                  <div className="w-full p-3 bg-theme-bg border border-theme-muted/30 rounded-xl text-theme-text font-medium shadow-inner">
                    {profileData?.email || <span className="text-theme-text/40 italic">Not provided</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-text/60 uppercase tracking-widest mb-1">Mobile Number</label>
                  <div className="w-full p-3 bg-theme-bg border border-theme-muted/30 rounded-xl text-theme-text font-medium shadow-inner">
                    {profileData?.mobile_number || <span className="text-theme-text/40 italic">Not provided</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Quick Links */}
            <div className="p-4 md:p-8 bg-theme-surface/50">
              <h3 className="text-lg font-black text-theme-text mb-6 flex items-center gap-2">
                <Bookmark size={20} className="text-theme-primary" /> Quick Links
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/savedtrips" className="flex items-center gap-4 p-4 rounded-xl bg-theme-bg border border-theme-muted/30 hover:border-theme-primary transition-colors group shadow-sm">
                  <div className="p-2.5 bg-theme-primary/10 text-theme-primary rounded-lg group-hover:bg-theme-primary group-hover:text-theme-bg transition-colors">
                    <Bookmark size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-theme-text group-hover:text-theme-primary transition-colors">Saved Trips</h4>
                    <p className="text-xs text-theme-text/60 mt-0.5">View your planned itineraries</p>
                  </div>
                </Link>

                <Link href="/" className="flex items-center gap-4 p-4 rounded-xl bg-theme-bg border border-theme-muted/30 hover:border-theme-secondary transition-colors group shadow-sm">
                  <div className="p-2.5 bg-theme-secondary/10 text-theme-secondary rounded-lg group-hover:bg-theme-secondary group-hover:text-theme-bg transition-colors">
                    <Settings size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-theme-text group-hover:text-theme-secondary transition-colors">Plan New Trip</h4>
                    <p className="text-xs text-theme-text/60 mt-0.5">Start a brand new adventure</p>
                  </div>
                </Link>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}