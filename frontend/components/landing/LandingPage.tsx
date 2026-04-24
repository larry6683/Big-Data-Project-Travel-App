"use client";

import React from "react";
import { Compass, Calendar, Search, MapPin, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="w-full min-h-[120vh] relative bg-theme-bg overflow-x-hidden">
      
{/* --- DOTTED/SPOTTED BACKGROUND TEXTURE --- */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.1]" 
        style={{ 
          /* The 'circle' keyword ensures it draws dots, and 1.5px makes them slightly softer than a hard 1px pixel */
          backgroundImage: 'radial-gradient(circle, currentColor 2px, transparent 1.5px)',
          /* This controls how far apart the dots are from each other */
          backgroundSize: '24px 24px',
          /* Using a muted slate/gray color so it feels like a soft texture rather than harsh black/white dots */
          color: '#94a3b8' 
        }} 
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-20 pb-32">
        
        {/* ROW 1: EXPLORE */}
        <section className="bg-theme-bg/20 backdrop-blur-xl rounded-[2rem] shadow-sm border border-theme-surface p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-theme-primary/10 rounded-xl">
                <Compass className="text-theme-primary w-6 h-6" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-theme-text tracking-tight">Popular Destinations</h2>
            </div>
            <button className="text-sm font-bold text-theme-primary hover:text-theme-secondary flex items-center gap-1 transition-colors">
              See all <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Coastal Escapes", desc: "Sunny beaches & ocean breezes" },
              { title: "Mountain Retreats", desc: "Cabins, hiking & fresh air" },
              { title: "City Breaks", desc: "Nightlife, dining & culture" },
              { title: "Hidden Gems", desc: "Off the beaten path" }
            ].map((item, i) => (
              <div key={i} className="group relative aspect-[4/5] rounded-3xl overflow-hidden bg-theme-surface/20 border border-theme-text/5 shadow-sm hover:shadow-xl transition-all cursor-pointer">
                 {/* Image Placeholder - Replace bg-theme-muted with an actual <img> tag later */}
                 <div className="absolute inset-0 bg-theme-muted/20 group-hover:scale-105 transition-transform duration-700 ease-out" />
                 
                 {/* Gradient Overlay for Text Readability */}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                 
                 <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                    <h3 className="text-white font-black text-xl mb-1">{item.title}</h3>
                    <p className="text-white/80 text-sm font-medium">{item.desc}</p>
                 </div>
              </div>
            ))}
          </div>
        </section>

        {/* ROW 2: EVENTS */}
        <section className="bg-theme-bg/20 backdrop-blur-xl rounded-[2rem] shadow-sm border border-theme-surface p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 ease-out fill-mode-both">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-theme-accent/10 rounded-xl">
                <Calendar className="text-theme-accent w-6 h-6" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-theme-text tracking-tight">Upcoming Events</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Summer Music Festival", date: "Aug 12 - Aug 15", loc: "Downtown Arena" },
              { title: "Local Food Week", date: "Sep 01 - Sep 07", loc: "City Square" },
              { title: "Art & Tech Exhibit", date: "Oct 20 - Oct 22", loc: "Convention Center" }
            ].map((event, i) => (
              <div key={i} className="flex flex-col bg-theme-surface/20 border border-theme-text/10 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group">
                {/* Event Image Placeholder */}
                <div className="h-48 w-full bg-theme-muted/10 relative overflow-hidden">
                   <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-500 bg-theme-muted/20" />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <span className="text-xs font-bold text-theme-primary uppercase tracking-wider mb-2">{event.date}</span>
                  <h3 className="font-bold text-theme-text text-lg mb-2">{event.title}</h3>
                  <div className="flex items-center gap-1.5 text-theme-muted text-sm mt-auto">
                    <MapPin size={14} />
                    <span>{event.loc}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ROW 3: BASED ON YOUR SEARCH */}
        <section className="bg-theme-bg/20 backdrop-blur-xl rounded-[2rem] shadow-sm border border-theme-surface p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 ease-out fill-mode-both">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-theme-text/5 rounded-xl">
                <Search className="text-theme-text w-6 h-6" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-theme-text tracking-tight">Based on Your Search</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Flights to Mumbai", desc: "Jan 7 Departures" },
              { title: "Hotels in Tirupati", desc: "Near City Center" },
              { title: "Weekend in Denver", desc: "Quick getaways" },
              { title: "Car Rentals", desc: "SUV & Compact available" }
            ].map((search, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-theme-surface/30 border border-theme-text/10 hover:bg-theme-muted/10 hover:border-theme-primary/30 transition-all cursor-pointer">
                <div className="w-14 h-14 rounded-xl bg-theme-muted/10 flex items-center justify-center flex-shrink-0">
                   <MapPin className="text-theme-muted w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-theme-text text-sm md:text-base">{search.title}</h4>
                  <p className="text-xs text-theme-muted mt-0.5">{search.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}