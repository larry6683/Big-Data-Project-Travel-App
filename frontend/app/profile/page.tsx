"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import ProfileModal from "../../components/ProfileModal";
import Link from "next/link";
import { User, LogOut, Bookmark, Settings, Edit3, Loader2, MapPin } from "lucide-react";
import { travelApi } from "@/services/api";

export default function ProfilePage() {
  const { logout, isLoggedIn } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8000";

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
    if (isLoggedIn) fetchProfile();
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-theme-bg">
        <h1 className="text-3xl font-black text-theme-text mb-6">Access Restricted</h1>
        <Link
          href="/auth"
          className="bg-theme-primary text-theme-bg px-8 py-4 rounded-2xl hover:bg-theme-secondary transition-all font-black shadow-xl active:scale-95 tracking-wider"
        >
          LOGIN TO CONTINUE
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

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 animate-in fade-in duration-300">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-theme-text tracking-tight">My Profile</h1>
          <p className="text-[11px] text-theme-muted font-black uppercase tracking-widest mt-2">
            Manage your personal information and preferences
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="animate-spin text-theme-primary" size={48} />
          </div>
        ) : (
          <div className="bg-theme-surface/20 rounded-[32px] border border-theme-surface shadow-2xl overflow-hidden relative">
            
            {/* Banner Accent */}
            <div className="h-32 bg-theme-secondary w-full absolute top-0 left-0 z-0"></div>

            {/* Section 1: User Profile Header */}
            <div className="p-6 md:p-10 flex flex-col md:flex-row items-center md:items-end gap-8 relative z-10 mt-12 border-b border-theme-surface pb-10">
              <div className="w-32 h-32 bg-theme-bg text-theme-secondary border-4 border-theme-bg rounded-full flex items-center justify-center overflow-hidden shadow-xl shrink-0">
                {profileData?.profile_picture_url ? (
                  <img
                    src={
                      profileData.profile_picture_url.startsWith("http")
                        ? profileData.profile_picture_url
                        : `${API_BASE_URL}${profileData.profile_picture_url}`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={64} />
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-black text-theme-text mb-1">
                  {profileData?.full_name || profileData?.email?.split("@")[0] || "Traveler"}
                </h2>
                <p className="text-[11px] font-black uppercase tracking-widest text-theme-primary">
                  Premium Member
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-theme-surface text-theme-text rounded-2xl hover:bg-theme-muted/20 transition-colors font-black text-sm active:scale-95"
                >
                  <Edit3 size={18} /> Edit Profile
                </button>
                <button
                  onClick={logout}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors font-black text-sm active:scale-95"
                >
                  <LogOut size={18} /> Sign Out
                </button>
              </div>
            </div>

            {/* Section 2: Account Details */}
            <div className="p-6 md:p-10 border-b border-theme-surface bg-theme-bg">
              <h3 className="text-[13px] font-black uppercase tracking-widest text-theme-text mb-6 flex items-center gap-3">
                <div className="p-2 bg-theme-secondary text-theme-bg rounded-xl shadow-md"><Settings size={16} /></div>
                Account Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-theme-surface/20 p-5 rounded-2xl border border-theme-surface shadow-sm">
                  <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2">Full Name</label>
                  <div className="font-bold text-theme-text text-lg">
                    {profileData?.full_name || <span className="text-theme-text/40 italic">Not provided</span>}
                  </div>
                </div>
                <div className="bg-theme-surface/20 p-5 rounded-2xl border border-theme-surface shadow-sm">
                  <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2">Email Address</label>
                  <div className="font-bold text-theme-text text-lg">
                    {profileData?.email || <span className="text-theme-text/40 italic">Not provided</span>}
                  </div>
                </div>
                <div className="bg-theme-surface/20 p-5 rounded-2xl border border-theme-surface shadow-sm">
                  <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2">Mobile Number</label>
                  <div className="font-bold text-theme-text text-lg">
                    {profileData?.mobile_number || <span className="text-theme-text/40 italic">Not provided</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Quick Links */}
            <div className="p-6 md:p-10 bg-theme-surface/20">
              <h3 className="text-[13px] font-black uppercase tracking-widest text-theme-text mb-6 flex items-center gap-3">
                <div className="p-2 bg-theme-text text-theme-bg rounded-xl shadow-md"><MapPin size={16} /></div>
                Travel Hub
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Link
                  href="/savedtrips"
                  className="flex items-center gap-5 p-6 rounded-2xl bg-theme-surface/20 border border-theme-surface hover:border-theme-primary hover:shadow-xl transition-all group active:scale-[0.98]"
                >
                  <div className="p-4 bg-theme-bg text-theme-primary border border-theme-surface rounded-xl group-hover:bg-theme-primary group-hover:text-theme-bg transition-colors shadow-sm">
                    <Bookmark size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-theme-text group-hover:text-theme-secondary transition-colors">Saved Trips</h4>
                    <p className="text-[11px] font-black uppercase tracking-widest text-theme-muted mt-1">View itineraries</p>
                  </div>
                </Link>

                <Link
                  href="/"
                  className="flex items-center gap-5 p-6 rounded-2xl bg-theme-surface/20 border border-theme-surface hover:border-theme-primary hover:shadow-xl transition-all group active:scale-[0.98]"
                >
                  <div className="p-4 bg-theme-bg text-theme-secondary border border-theme-surface rounded-xl group-hover:bg-theme-primary group-hover:text-theme-bg transition-colors shadow-sm">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-theme-text group-hover:text-theme-secondary transition-colors">Plan New Trip</h4>
                    <p className="text-[11px] font-black uppercase tracking-widest text-theme-muted mt-1">Start an adventure</p>
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