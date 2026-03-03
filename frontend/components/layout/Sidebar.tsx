// larry6683/big-data-project-travel-app/frontend/components/layout/Sidebar.tsx

"use client";

import React, { useState } from "react";
import { Search, Users, Calendar, Wallet } from "lucide-react";
import Cookies from "js-cookie";
import LocationAutocomplete from "./LocationAutoComplete";

export default function Sidebar() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [dates, setDates] = useState({ start: "", end: "" });
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [budget, setBudget] = useState("mid-range");

  const handleSearchSubmit = () => {
    if (!source || !destination || !dates.start || !dates.end) {
      alert("Please fill in all location and date fields.");
      return;
    }

    const startDate = new Date(dates.start);
    const endDate = new Date(dates.end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const numNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const searchState = {
      source, destination, dates, numNights, adults, children, budget,
      timestamp: new Date().toISOString()
    };

    Cookies.set("search_state", JSON.stringify(searchState), { expires: 7 });
    fetch("http://localhost:8000/api/v1/locations/trending", { method: "GET" }).catch(() => {});
  };

  return (
    <div className="w-80 h-screen bg-black text-white p-6 flex flex-col gap-6 border-r border-zinc-800 shadow-2xl overflow-y-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-blue-600 p-2 rounded-lg"><Search size={20} className="text-white" /></div>
        <h2 className="text-xl font-bold tracking-tight">Plan Your Trip</h2>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1">Departure From</label>
        <LocationAutocomplete placeholder="from?" value={source} onChange={setSource} isDark={true} showGPS={true} />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1">Destination To</label>
        <LocationAutocomplete placeholder="where to?" value={destination} onChange={setDestination} isDark={true} showGPS={false} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1">Start</label>
          <input type="date" className="bg-zinc-900 w-full p-2.5 rounded-lg text-xs border border-zinc-800 text-white outline-none focus:border-blue-500" onChange={(e) => setDates({...dates, start: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1">End</label>
          <input type="date" className="bg-zinc-900 w-full p-2.5 rounded-lg text-xs border border-zinc-800 text-white outline-none focus:border-blue-500" onChange={(e) => setDates({...dates, end: e.target.value})} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1 flex items-center gap-1"><Users size={12} /> Travelers</label>
        <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-xl border border-zinc-800">
          <div className="flex flex-col items-center flex-1 border-r border-zinc-800">
            <input type="number" value={adults} min={1} onChange={(e) => setAdults(parseInt(e.target.value) || 1)} className="bg-transparent w-full text-center text-sm outline-none font-bold text-white" />
            <span className="text-[9px] text-zinc-500 uppercase">Adults</span>
          </div>
          <div className="flex flex-col items-center flex-1">
            <input type="number" value={children} min={0} onChange={(e) => setChildren(parseInt(e.target.value) || 0)} className="bg-transparent w-full text-center text-sm outline-none font-bold text-white" />
            <span className="text-[9px] text-zinc-500 uppercase">Children</span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1 flex items-center gap-1"><Wallet size={12}/> Budget Category</label>
        <select value={budget} onChange={(e) => setBudget(e.target.value)} className="bg-zinc-900 w-full p-2.5 rounded-lg text-xs outline-none border border-zinc-800 text-white focus:border-blue-500 appearance-none">
          <option value="economy">Economy</option>
          <option value="mid-range">Mid-Range</option>
          <option value="luxury">Luxury</option>
        </select>
      </div>

      <button onClick={handleSearchSubmit} className="mt-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group">
        <Search size={18} /> Generate Itinerary
      </button>
    </div>
  );
}