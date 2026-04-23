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
//     <svg viewBox="0 0 1000 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
//     <defs>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;700&display=swap');
//         .logo-text {
//           font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
//           font-size: 100px;
//           letter-spacing: -0.01em;
//         }
//       `}</style>
//     </defs>
// <rect width="220" height="240" rx="40" fill="#04381C" />
//   <circle cx="125" cy="100" r="20" className="fill-theme-accent" />
// <path d="M 20 160 C 100 40, 90 40, 120 120" className="fill-theme-primary" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />
// <path d="M 120 120 C 180 20, 180 20, 200 140" className="fill-theme-primary" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />
//     <text x="240" y="120" className="logo-text">
//       <tspan className="font-semibold fill-theme-text text-large">Minute</tspan>
//       <tspan className="font-bold fill-theme-primary">Bound</tspan>
//     </text>
//   </svg>

      <svg viewBox="0 0 1000 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
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
<rect width="240" height="240" rx="40" fill="#04381C" />
  <circle cx="130" cy="70" r="20" className="fill-theme-accent" />
{/* scale-[1.2] makes it 20% larger. origin-[110px_100px] keeps it centered. */}
<g className="origin-[110px_100px] scale-[1.2]">
                <path d="M 20 160 C 100 40, 90 40, 120 120" className="fill-theme-primary" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M 120 120 C 180 20, 180 20, 200 140"  className="fill-theme-primary"  strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" fill="none" />

</g>
    <text x="280" y="120" className="logo-text">
      <tspan className="font-semibold fill-theme-text text-large">Minute</tspan>
      <tspan className="font-bold fill-theme-primary">Bound</tspan>
    </text>
  </svg>
);

export default function Navbar({
  onMenuClick = () => {},
  mapOpen = false,
  onMapToggle = () => {},
  menuOpen = false,
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
    <nav className="relative flex items-center justify-between px-4 md:px-6 py-3 bg-theme-bg text-theme-text flex-shrink-0 z-[60] shadow-sm min-h-[64px] border-b border-theme-text/10">
      
      {/* LEFT SECTION */}
      <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
        
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl bg-theme-surface text-theme-text lg:hidden hover:bg-theme-surface/80 transition-colors shadow-sm active:scale-95 border border-theme-surface"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {!isHomePage ? (
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/"
              className="flex items-center hover:opacity-90 transition-opacity"
            >
              <MinuteboundLogo className="h-8 sm:h-10 md:h-12 w-auto" />
            </Link>
            <Link
              href="/"
              title="Return Home"
              className="flex items-center justify-center gap-2 px-3 py-1.5 sm:py-2 text-sm font-bold text-theme-text bg-theme-surface rounded-lg hover:bg-theme-muted/20 transition-colors shadow-sm active:scale-95 border border-theme-surface"
            >
              <Home size={18} />
              <span className="hidden sm:block">Home</span>
            </Link>
          </div>
        ) : (
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center hover:opacity-90 transition-opacity"
            >
              <MinuteboundLogo className="h-8 sm:h-10 md:h-12 w-auto" />
            </Link>
          </div>
        )}
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center justify-end gap-3 flex-shrink-0">
        {isLoggedIn ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-theme-surface text-theme-text rounded-xl hover:bg-theme-muted/20 border border-theme-surface transition-colors shadow-sm font-black active:scale-95"
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
              <div className="absolute right-0 mt-3 w-56 bg-theme-bg rounded-2xl shadow-2xl border border-theme-surface py-2 z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="px-4 py-2 mb-1 border-b border-theme-surface">
                  <p className="text-[10px] font-black text-theme-muted uppercase tracking-widest">Signed in as</p>
                  <p className="text-sm font-bold text-theme-text truncate">{user}</p>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-theme-text hover:bg-theme-surface font-bold transition-colors"
                >
                  <UserIcon size={16} className="text-theme-primary" />
                  Profile Account
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
            className="flex items-center gap-2 px-5 py-2.5 bg-theme-primary text-theme-bg rounded-xl hover:bg-theme-secondary transition-all shadow-md text-sm font-black active:scale-95"
          >
            <UserIcon size={18} />
            <span className="hidden sm:inline">Login / Sign Up</span>
            <span className="sm:hidden">Login</span>
          </Link>
        )}

        {isHomePage && (
          <button
            onClick={onMapToggle}
            className="p-2.5 rounded-xl bg-theme-surface text-theme-text hover:bg-theme-muted/20 border border-theme-surface transition-colors shadow-sm md:hidden active:scale-95"
            aria-label={mapOpen ? "Close map" : "Toggle map"}
          >
            {mapOpen ? <X size={20} /> : <Map size={20} className="text-theme-primary" />}
          </button>
        )}
      </div>
    </nav>
  );
}