"use client";

import React from "react";
import { MapPin, Calendar, Sparkles, Compass } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-12 bg-theme-bg overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl w-full space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-theme-primary/10 border border-theme-primary/20 text-theme-primary font-black text-xs tracking-widest uppercase mb-2 shadow-sm">
            <Sparkles size={16} /> AI-Powered Travel
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-theme-text tracking-tight leading-[1.1]">
            Design your perfect <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-theme-primary to-theme-secondary">
              adventure.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-theme-text/70 font-medium max-w-2xl mx-auto leading-relaxed">
            Enter your origin, destination, and travel dates in the Searchbar to generate a completely custom, data-driven itinerary in seconds.
          </p>
        </div>

        {/* Decorative Divider */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="h-[2px] w-16 bg-gradient-to-r from-transparent to-theme-surface rounded-full"></div>
          <div className="w-2 h-2 rounded-full bg-theme-muted"></div>
          <div className="h-[2px] w-16 bg-gradient-to-l from-transparent to-theme-surface rounded-full"></div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-theme-surface/40 p-8 rounded-3xl border border-theme-surface text-center hover:bg-theme-surface/80 transition-colors duration-300 shadow-sm hover:shadow-md">
            <div className="w-14 h-14 bg-theme-primary/10 text-theme-primary rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <MapPin size={28} />
            </div>
            <h3 className="text-lg font-black text-theme-text mb-2">Smart Routing</h3>
            <p className="text-sm text-theme-text/70 font-medium leading-relaxed">
              Compare live flight prices and optimal driving routes instantly to find the best path.
            </p>
          </div>
          
          <div className="bg-theme-surface/40 p-8 rounded-3xl border border-theme-surface text-center hover:bg-theme-surface/80 transition-colors duration-300 shadow-sm hover:shadow-md">
            <div className="w-14 h-14 bg-theme-secondary/10 text-theme-secondary rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Calendar size={28} />
            </div>
            <h3 className="text-lg font-black text-theme-text mb-2">Live Forecasts</h3>
            <p className="text-sm text-theme-text/70 font-medium leading-relaxed">
              Get accurate, historical and live weather predictions for your specific travel dates.
            </p>
          </div>
          
          <div className="bg-theme-surface/40 p-8 rounded-3xl border border-theme-surface text-center hover:bg-theme-surface/80 transition-colors duration-300 shadow-sm hover:shadow-md">
            <div className="w-14 h-14 bg-theme-accent/10 text-theme-accent rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Compass size={28} />
            </div>
            <h3 className="text-lg font-black text-theme-text mb-2">Local Gems</h3>
            <p className="text-sm text-theme-text/70 font-medium leading-relaxed">
              Discover hidden nearby attractions, popular POIs, and top-rated guided tours.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}