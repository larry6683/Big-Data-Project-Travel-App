"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Loader2, Save, User } from "lucide-react";
import { travelApi } from "@/services/api";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate: () => void; // Trigger sidebar refresh
}

export default function ProfileModal({
  isOpen,
  onClose,
  onProfileUpdate,
}: ProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    mobile_number: "",
    profile_picture_url: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
    "http://localhost:8000";

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    } else {
      // Reset state when closed
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [isOpen]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await travelApi.getProfile();
      setProfile({
        full_name: data.full_name || "",
        email: data.email || "",
        mobile_number: data.mobile_number || "",
        profile_picture_url: data.profile_picture_url || "",
      });
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("full_name", profile.full_name);
      formData.append("email", profile.email);
      formData.append("mobile_number", profile.mobile_number);
      if (selectedFile) {
        formData.append("profile_picture", selectedFile);
      }

      await travelApi.updateProfile(formData);
      onProfileUpdate(); // Tell sidebar to refresh
      onClose();
    } catch (error) {
      console.error("Failed to save profile", error);
      alert("Failed to save profile updates.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-lg font-bold">Profile Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-10 flex justify-center items-center">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-5">
            {/* Image Upload Section */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-24 h-24 rounded-full border-2 border-slate-700 overflow-hidden bg-slate-800 flex items-center justify-center relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : profile.profile_picture_url ? (
                  <img
                    src={`${API_BASE_URL}${profile.profile_picture_url}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-slate-500" />
                )}

                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload size={20} className="text-white" />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                Change Picture
              </button>
            </div>

            {/* Form Fields */}
            <div>
              <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 ml-1 mb-1 block">
                Full Name
              </label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) =>
                  setProfile({ ...profile, full_name: e.target.value })
                }
                placeholder="John Doe"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 ml-1 mb-1 block">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                placeholder="john@example.com"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 ml-1 mb-1 block">
                Mobile Number
              </label>
              <input
                type="tel"
                value={profile.mobile_number}
                onChange={(e) =>
                  setProfile({ ...profile, mobile_number: e.target.value })
                }
                placeholder="+1 (555) 000-0000"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm transition-all"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-2 w-full p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {saving ? "SAVING..." : "SAVE PROFILE"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
