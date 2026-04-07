// frontend/components/Navbar.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  Map,
  X,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Bookmark,
  Home,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";

interface NavbarProps {
  onMenuClick?: () => void;
  mapOpen?: boolean;
  onMapToggle?: () => void;
  menuOpen?: boolean; // <-- Added menuOpen prop
}

export default function Navbar({
  onMenuClick = () => {},
  mapOpen = false,
  onMapToggle = () => {},
  menuOpen = false, // <-- Default to false
}: NavbarProps) {
  const { user, logout, isLoggedIn } = useAuth();
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <nav className="relative flex items-center justify-between px-3 md:px-6 py-3 border-b border-theme-surface bg-theme-bg flex-shrink-0 z-[60] shadow-sm min-h-[64px]">
      
      {/* --- LEFT SECTION: Menu, Logo, Home Button --- */}
      <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
        
        {/* Hamburger/Close Menu (Only visible on Home Page for mobile/tablet) */}
        <button
          onClick={onMenuClick}
          className={`p-2 rounded-xl bg-theme-text text-theme-bg lg:hidden hover:bg-theme-text/80 transition-colors ${!isHomePage ? 'hidden lg:hidden' : ''}`}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {/* Toggle between X and Menu icons */}
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Logo and Conditional Return Home Button */}
        {!isHomePage ? (
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="text-lg sm:text-xl md:text-2xl font-extrabold text-theme-text tracking-tight flex items-center gap-1.5 md:gap-2">
              WanderPlan <span className="text-theme-primary">US</span>
            </Link>
            <Link 
              href="/"
              title="Return Home"
              className="flex items-center justify-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm font-semibold text-theme-text bg-theme-surface rounded-lg hover:bg-theme-secondary/20 transition-colors border border-theme-surface"
            >
              <Home size={18} />
              {/* Text hidden on mobile, visible on sm (tablet) and up */}
              <span className="hidden sm:block">Home</span>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:hidden">
            <Link href="/" className="text-xl md:text-2xl font-extrabold text-theme-text tracking-tight flex items-center gap-1.5 md:gap-2">
              WanderPlan <span className="text-theme-primary">US</span>
            </Link>
          </div>
        )}
      </div>

      {/* --- RIGHT SECTION: Profile & Map Toggle --- */}
      <div className="flex items-center justify-end gap-2 md:gap-3 flex-shrink-0">

        {isLoggedIn ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-theme-surface text-theme-text rounded-lg border border-theme-surface hover:bg-theme-secondary/20 transition-colors"
            >
              <UserIcon size={16} />
              {/* Username hidden on very small screens, visible on sm and up */}
              <span id="profile_username" className="text-sm font-semibold hidden sm:block max-w-[120px] truncate">
                {user}
              </span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isDropdownOpen && (
              <div id="dropdown_profile" className="absolute right-0 mt-2 w-48 bg-theme-bg rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-theme-surface py-1.5 z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
                <Link
                  href="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  id="profile_link"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-theme-text hover:bg-theme-surface font-medium transition-colors"
                >
                  <UserIcon size={16} className="text-theme-muted" />
                  Profile
                </Link>
                <Link
                  href="/savedtrips"
                  id="saved_trip_link"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-theme-text hover:bg-theme-surface font-medium transition-colors"
                >
                  <Bookmark size={16} className="text-theme-primary" />
                  Saved Trips
                </Link>
                
                <div className="h-px bg-theme-surface my-1.5 mx-2"></div>
                
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors text-left"
                >
                  <LogOut id="logout-button" size={16} className="text-red-500" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/auth"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-theme-primary text-theme-bg rounded-xl hover:bg-theme-secondary transition-colors shadow-md shadow-theme-primary/30 text-sm font-bold"
          >
            <UserIcon size={18} />
            <span className="hidden sm:inline">Login / Sign Up</span>
            <span className="sm:hidden">Login</span>
          </Link>
        )}

        {/* Map Toggle - Visible ONLY on Mobile (md:hidden) AND only on Home Page, switches to X when opened */}
        {isHomePage && (
          <button
            onClick={onMapToggle}
            className={`p-2 rounded-xl text-theme-bg opacity-100 transition-colors md:hidden bg-theme-primary`}
            aria-label={mapOpen ? "Close map" : "Toggle map"}
          >
            {mapOpen ? <X size={20} /> : <Map size={20} />}
          </button>
        )}
      </div>
    </nav>
  );
}