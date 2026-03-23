// frontend/components/Navbar.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  Map,
  LogOut,
  User as UserIcon,
  Sparkles,
  ChevronDown,
  Bookmark,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import ProfileModal from "./ProfileModal"; // <-- 1. Import the Profile Modal

interface NavbarProps {
  onMenuClick: () => void;
  mapOpen: boolean;
  onMapToggle: () => void;
}

export default function Navbar({
  onMenuClick,
  mapOpen,
  onMapToggle,
}: NavbarProps) {
  const { user, logout, isLoggedIn } = useAuth();

  // State and ref for handling the user dropdown menu
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // <-- 2. Add state to handle modal visibility
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="relative flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200 bg-white flex-shrink-0 z-[60] shadow-sm min-h-[64px]">
      
 {/* LEFT SECTION: Mobile Controls & Logo */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Menu Button (Hidden on Desktop) */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl bg-slate-900 text-white lg:hidden hover:bg-slate-800 transition-colors"
          aria-label="Open search panel"
        >
          <Menu size={20} />
        </button>

        {/* Logo - Hidden on Desktop so it doesn't duplicate the sidebar logo */}
        <div className="flex flex-col lg:hidden">
          <div className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 md:gap-2">
            WanderPlan <span className="text-blue-600">US</span>
          </div>
        </div>
      </div>

      {/* CENTER SECTION: Search with AI Input */}
      {/* We use flex-1 to let it grow, and lg:pl-12 to push it slightly left to center it over the TripResults */}
      <div className="hidden md:flex flex-1 justify-center lg:justify-start max-w-xl px-4 lg:pl-12">
        <div className="relative w-full md:w-[300px] flex items-center group">
          <Sparkles size={16} className="absolute left-4 text-purple-500 z-10" />
          <input 
            type="text"
            placeholder="Ask AI to plan your trip..."
            className="w-full pl-11 pr-5 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 placeholder-indigo-700 border border-indigo-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white focus:shadow-md hover: placeholder-indigo-700 shadow-sm transition-all text-sm font-semibold"
          />
        </div>
      </div>  

      {/* RIGHT SECTION: Auth & Map */}
      <div className="flex items-center justify-end gap-3 flex-shrink-0">
        {/* Mobile AI Search Icon (Shows only on small screens) */}
        <button className="md:hidden p-2 rounded-xl bg-indigo-50 text-indigo-600">
          <Sparkles size={20} />
        </button>

        {isLoggedIn ? (
          <div className="relative" ref={dropdownRef}>
            {/* User Dropdown Trigger */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
            >
              <UserIcon size={16} />
              <span className="text-sm font-semibold hidden sm:block max-w-[120px] truncate">
                {user}
              </span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 py-1.5 z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
                <Link
                  href="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  <UserIcon size={16} className="text-gray-400" />
                  Profile
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  <Bookmark size={16} className="text-blue-500" />
                  Saved Trips
                </Link>
                
                <div className="h-px bg-gray-100 my-1.5 mx-2"></div>
                
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors text-left"
                >
                  <LogOut size={16} className="text-red-500" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 text-sm font-bold"
          >
            <UserIcon size={18} />
            Login / Sign Up
          </Link>
        )}

        {/* Existing Map Toggle Button (Mobile Only) */}
        <button
          onClick={onMapToggle}
          className={`p-2 rounded-xl text-white transition-colors md:hidden ${
            mapOpen ? "bg-blue-600" : "bg-slate-700"
          }`}
          aria-label="Toggle map"
        >
          <Map size={20} />
        </button>
      </div>
    </nav>
  );
}
