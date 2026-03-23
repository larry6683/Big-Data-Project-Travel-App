// frontend/components/Navbar.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Menu, Map, LogOut, User as UserIcon, Sparkles, ChevronDown, Bookmark } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="relative flex items-center justify-between px-4 md:px-6 py-3 border-b border-canopy/20 bg-deep-forest flex-shrink-0 z-[60] shadow-sm min-h-[64px]">
      
      {/* LEFT SECTION: Mobile Controls & Logo */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Menu Button (Hidden on Desktop) */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl bg-deep-forest text-linen lg:hidden hover:bg-canopy transition-colors"
          aria-label="Open search panel"
        >
          <Menu size={20} />
        </button>

        {/* Logo - Hidden on Desktop so it doesn't duplicate the sidebar logo */}
        <div className="flex flex-col lg:hidden">
          <div className="text-xl md:text-2xl font-extrabold text-deep-forest tracking-tight flex items-center gap-1.5 md:gap-2">
            WanderPlan <span className="text-canopy">US</span>
          </div>
        </div>
      </div>

      {/* CENTER SECTION: Search with AI Input */}
      {/* We use flex-1 to let it grow, and lg:pl-12 to push it slightly left to center it over the TripResults */}
      <div className="hidden md:flex flex-1 justify-center lg:justify-start max-w-xl px-4 lg:pl-12">
        <div className="relative w-full md:w-[300px] flex items-center group">
          <Sparkles size={16} className="absolute left-4 text-antique-gold z-10" />
          <input 
            type="text"
            placeholder="Ask AI to plan your trip..."
            className="w-full pl-11 pr-5 py-2 bg-sage/20 text-deep-forest/20 placeholder-sage border border-canopy/30 rounded-full focus:outline-none focus:ring-1 focus:ring-canopy focus:bg-parchment focus:border-canopy shadow-inner transition-all text-[13px] font-semibold"
          />
        </div>
      </div>  

      {/* RIGHT SECTION: Auth & Map */}
      <div className="flex items-center justify-end gap-3 flex-shrink-0">
        {/* Mobile AI Search Icon (Shows only on small screens) */}
        <button className="md:hidden p-2 rounded-xl bg-linen text-antique-gold border border-canopy/20">
          <Sparkles size={20} />
        </button>

        {isLoggedIn ? (
          <div className="relative" ref={dropdownRef}>
            {/* User Dropdown Trigger */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center w-50 gap-2 px-3 py-1.5 bg-forest-green/90 text-parchment rounded-lg border border-canopy/30 hover:bg-forest-green/90 transition-colors"
            >
              <span className="text-sm font-semibold hidden sm:block max-w-50 truncate">
                {user}
              </span>
              <ChevronDown size={16} className={`text-parchment/80 transition-transform duration-200${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute items-center mt-1 w-48 bg-parchment rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-canopy/30 py-1.5 z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
                <Link
                  href="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-deep-forest hover:bg-canopy/20 hover:text-forest-green font-medium transition-colors"
                >
                  <UserIcon size={16} className=" hover:text-sage" />
                  Profile
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-deep-forest hover:bg-canopy/20 hover:text-forest-green  font-medium transition-colors"
                >
                  <Bookmark size={16} className="hover:text-sage" />
                  Saved Trips
                </Link>
                
                <div className="h-px bg-canopy/15 my-1.5 mx-2"></div>
                
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/80 font-medium transition-colors text-left"
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
            className="  hidden w-50 sm:flex items-center gap-2 px-8 py-2 bg-forest-green text-parchment rounded-xl hover:bg-canopy transition-all shadow-md shadow-canopy/20 active:scale-95 text-sm font-bold"
          >
            <UserIcon size={12} />
            Login / Sign Up
          </Link>
        )}

        {/* Existing Map Toggle Button (Mobile Only) */}
        <button
          onClick={onMapToggle}
          className={`p-2 rounded-xl text-linen transition-colors md:hidden ${
            mapOpen ? "bg-forest-green" : "bg-deep-forest"
          }`}
          aria-label="Toggle map"
        >
          <Map size={20} />
        </button>
      </div>
    </nav>
  );
}