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
  menuOpen?: boolean;
}

const MinuteboundLogo = ({ className = "" }: { className?: string }) => (
  <>
    {/* Mobile & Tablet Logo (Icon Only) */}
    <svg viewBox="0 0 1100 220" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} lg:hidden`}>
            <defs>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;700&display=swap');
          .logo-text {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 100px;
            letter-spacing: -0.01em;
          }
        `}</style>
      </defs>
      <g className="origin-[60px_120px] scale-[1.4]">
        <path 
          d="M 20 160 C 100 40, 90 40, 120 120" 
          className="fill-theme-primary"
          strokeWidth="10" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        <path 
          d="M 120 120 C 180 20, 180 20, 200 140" 
          className="fill-theme-primary"  
          strokeWidth="10" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />        
      </g>
      <text x="320" y="140" className="logo-text">
        <tspan className="font-bold fill-theme-text">Minute</tspan>
        <tspan className="font-bold fill-theme-text">bound</tspan>
      </text>
    </svg>

    {/* Desktop Logo (Icon + Text) */}
    <svg viewBox="0 0 1100 220" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} hidden lg:block`}>
      <defs>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;700&display=swap');
          .logo-text {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 120px;
            letter-spacing: -0.01em;
          }
        `}</style>
      </defs>
      <g className="origin-[60px_120px] scale-[1.4]">
        <path 
          d="M 20 160 C 100 40, 90 40, 120 120" 
          className="fill-theme-primary"
          strokeWidth="10" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        <path 
          d="M 120 120 C 180 20, 180 20, 200 140" 
          className="fill-theme-primary"  
          strokeWidth="10" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />        
      </g>
      <text x="320" y="140" className="logo-text">
        <tspan className="font-bold fill-theme-text">Minute</tspan>
        <tspan className="font-bold fill-theme-text">bound</tspan>
      </text>
    </svg>
  </>
);

export default function Navbar({
  onMenuClick = () => {},
  mapOpen = false,
  onMapToggle = () => {},
  menuOpen = false,
}: NavbarProps) {
  const { user, email, logout, isLoggedIn } = useAuth();
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  // Desktop Profile Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mobile Menu Dropdown State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <nav className="relative sticky top-0 w-full flex-shrink-0 z-[999]">
      {/* Dynamic container classes based on route */}
      <div 
        className={`w-full flex items-center justify-between px-4 md:px-6 bg-theme-bg text-theme-text shadow-sm border-b border-theme-text/10 relative z-[999] transition-all duration-300 ${
          isHomePage ? "py-3 min-h-[64px]" : "py-1.5 min-h-[52px]"
        }`}
      >
        {/* LEFT SECTION */}
        <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`rounded-xl bg-theme-surface text-theme-text lg:hidden hover:bg-theme-surface/80 transition-all duration-300 shadow-sm active:scale-95 border border-theme-surface ${
              isHomePage ? "p-2" : "p-1.5"
            }`}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link
            href="/"
            className="flex items-center hover:opacity-90 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {/* Dynamic logo size based on route */}
            <MinuteboundLogo 
              className={`w-auto transition-all duration-300 ${
                isHomePage ? "h-8 sm:h-10 md:h-12" : "h-6 sm:h-8 md:h-9"
              }`} 
            />
          </Link>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center justify-end gap-3 flex-shrink-0">
          
          {/* Profile/Auth Container - Hidden on Mobile/Tablet (lg) */}
          <div className="hidden lg:flex items-center gap-3">
            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center gap-2 px-4 ${
                    isHomePage ? "py-2.5" : "py-1.5"
                  } bg-theme-surface text-theme-text rounded-xl hover:bg-theme-muted/20 border border-theme-surface transition-all shadow-sm font-black active:scale-95`}
                >
                  <UserIcon size={16} className="text-theme-primary" />
                  <span className="text-sm hidden sm:block max-w-[120px] truncate">
                    {user}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-theme-bg rounded-2xl shadow-2xl border border-theme-surface py-2 z-[1000] animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="px-4 py-2 mb-1 border-b border-theme-surface">
                      <p className="text-[10px] font-black text-theme-muted uppercase tracking-widest">Signed in as</p>
                      <p className="text-sm font-bold text-theme-text truncate" title={email || user || ""}>
                        {email || user}
                      </p>
                    </div>

                    {!isHomePage && (
                      <Link
                        href="/"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-theme-text hover:bg-theme-surface font-bold transition-colors"
                      >
                        <Home size={16} className="text-theme-primary" />
                        Home
                      </Link>
                    )}

                    <Link
                      href="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-theme-text hover:bg-theme-surface font-bold transition-colors"
                    >
                      <UserIcon size={16} className="text-theme-primary" />
                      Profile
                    </Link>
                    <Link
                      href="/savedtrips"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-theme-text hover:bg-theme-surface font-bold transition-colors"
                    >
                      <Bookmark size={16} className="text-theme-primary" />
                      Saved Itineraries
                    </Link>

                    <div className="h-px bg-theme-surface my-1.5 mx-3"></div>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-bold transition-colors text-left"
                    >
                      <LogOut size={16} className="text-red-500" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth"
                className={`flex items-center gap-2 px-5 ${
                  isHomePage ? "py-2.5" : "py-1.5"
                } bg-theme-primary text-theme-bg rounded-xl hover:bg-theme-secondary transition-all shadow-md text-sm font-black active:scale-95`}
              >
                <UserIcon size={18} />
                <span className="hidden sm:inline">Login / Sign Up</span>
                <span className="sm:hidden">Login</span>
              </Link>
            )}
          </div>

          {/* Map Toggle - Visible only on Mobile/Tablet (lg) */}
          {isHomePage && (
            <button
              onClick={onMapToggle}
              className="p-2.5 rounded-xl bg-theme-text text-theme-bg hover:bg-theme-muted/20 border border-theme-surface transition-colors shadow-sm lg:hidden active:scale-95"
              aria-label={mapOpen ? "Close map" : "Toggle map"}
            >
              {mapOpen ? <X size={20} /> : <Map size={20} className="text-theme-primary" />}
            </button>
          )}
        </div>
      </div>

      {/* MOBILE NAVIGATION MENU */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-theme-bg border-b border-theme-text/10 shadow-xl lg:hidden flex flex-col z-[1000] animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col p-2">
            {!isHomePage && (
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-4 text-theme-text hover:bg-theme-surface font-bold transition-colors rounded-xl mx-2"
              >
                <Home size={20} className="text-theme-primary" />
                Home
              </Link>
            )}

            {isLoggedIn ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 text-theme-text hover:bg-theme-surface font-bold transition-colors rounded-xl mx-2"
                >
                  <UserIcon size={20} className="text-theme-primary" />
                  Profile
                </Link>
                <Link
                  href="/savedtrips"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 text-theme-text hover:bg-theme-surface font-bold transition-colors rounded-xl mx-2"
                >
                  <Bookmark size={20} className="text-theme-primary" />
                  Saved Itineraries
                </Link>

                <div className="h-px bg-theme-surface my-2 mx-4"></div>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-3 px-4 py-4 text-red-600 hover:bg-red-50 font-bold transition-colors text-left rounded-xl mx-2"
                >
                  <LogOut size={20} className="text-red-500" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-4 text-theme-text hover:bg-theme-surface font-bold transition-colors rounded-xl mx-2"
              >
                <UserIcon size={20} className="text-theme-primary" />
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}