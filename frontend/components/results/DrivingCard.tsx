// frontend/components/results/DrivingCard.tsx
"use client";

import React, { useState, useEffect } from "react";

export default function DrivingCard({ drivingData }: { drivingData?: any }) {
  const [isSelected, setIsSelected] = useState<boolean>(false);
  const [showIntermediates, setShowIntermediates] = useState<boolean>(true);

  useEffect(() => {
    const savedState = sessionStorage.getItem("drive_intermediates_open");
    if (savedState === "true") {
      setShowIntermediates(true);
    }
  }, []);

  useEffect(() => {
    const tripStateStr = localStorage.getItem("trip_state");
    if (tripStateStr) {
      try {
        const tripState = JSON.parse(tripStateStr);
        if (tripState.drive && tripState.drive.selected) {
          setIsSelected(true);
        }
      } catch (e) {
        console.error("Error parsing trip_state localStorage:", e);
      }
    }
  }, []);

  const calculateFuel = (km: number) => {
    const miles = km * 0.621371;
    const gallons = miles / 25;
    return {
      gallons: gallons.toFixed(1),
      cost: (gallons * 3.35).toFixed(2),
      miles: miles.toFixed(0),
    };
  };

  const toggleDriveSelection = () => {
    const tripStateStr = localStorage.getItem("trip_state");
    let tripState = tripStateStr ? JSON.parse(tripStateStr) : {};
    const newSelected = !isSelected;
    setIsSelected(newSelected);

    tripState.drive = newSelected
      ? { selected: true, data: drivingData }
      : null;
    localStorage.setItem("trip_state", JSON.stringify(tripState));
  };

  const toggleIntermediates = () => {
    const newState = !showIntermediates;
    setShowIntermediates(newState);
    sessionStorage.setItem("drive_intermediates_open", String(newState));
  };

  // If data hasn't arrived or is invalid, render nothing
  if (!drivingData || !drivingData.geometry) return null;

  const fuel = calculateFuel(drivingData.distance_km);

  // 🌟 Read the pre-fetched data directly! No more waiting.
  const passedCities = drivingData.passedCities || [];
  const sName = drivingData.sourceName || "Origin";
  const dName = drivingData.destinationName || "Destination";

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`bg-white rounded-xl overflow-hidden border p-5 transition-all duration-200 ${
          isSelected
            ? "border-blue-600 ring-1 ring-blue-600 bg-blue-100/10"
            : "bg-white hover:shadow-md"
        }`}
      >
        <div className="mb-6">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
              Road Trip Journey
            </h3>

            <label className="flex items-center gap-2 cursor-pointer bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors shadow-sm shrink-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={toggleDriveSelection}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <span className="text-xs font-bold text-gray-700 select-none w-[56px] inline-block text-center">
                {isSelected ? "Selected" : "Select"}
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2 text-sm font-bold mt-1">
            <span className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-lg shadow-sm">
              {sName}
            </span>
            <span className="text-gray-400 text-lg">➔</span>
            <span className="bg-red-50 text-red-800 border border-red-200 px-3 py-1 rounded-lg shadow-sm">
              {dName}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-black text-gray-400 block mb-1">
              Distance
            </span>
            <span className="text-xl font-black text-gray-800">
              {fuel.miles} Mi
            </span>
            <span className="text-[11px] text-gray-400 font-medium leading-tight mt-0.5">
              {drivingData.distance_km} km
            </span>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-black text-gray-400 block mb-1">
              Drive Time
            </span>
            <span className="text-xl font-black text-gray-800">
              {Math.floor(drivingData.duration_mins / 60)}h{" "}
              {Math.round(drivingData.duration_mins % 60)}m
            </span>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-black text-emerald-600 block mb-1">
              Fuel Estimate
            </span>
            <span className="text-xl font-black text-emerald-700">
              ${fuel.cost}
            </span>
            <span className="text-[11px] text-emerald-500/70 font-medium leading-tight mt-0.5">
              {fuel.gallons} Gal
            </span>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <button
            onClick={toggleIntermediates}
            className="w-full flex justify-between items-center group mb-2"
          >
            <span className="text-xs font-black text-blue-600 uppercase tracking-widest group-hover:underline">
              {showIntermediates
                ? "▼ Hide Route List"
                : "▶ View All Passing Cities"}
            </span>
          </button>

          {showIntermediates && (
            <div className="mt-4 bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="relative flex flex-col gap-6 ml-2">
                <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-blue-200"></div>

                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full bg-blue-600 border-[3px] border-white shadow-sm ring-2 ring-blue-200 shrink-0"></div>
                  <span className="text-base font-black text-gray-900">
                    {sName}
                  </span>
                </div>

                {passedCities.map((city: string, idx: number) => (
                  <div
                    key={idx}
                    className="relative z-10 flex items-center gap-4"
                  >
                    <div className="w-3 h-3 ml-[2px] rounded-full bg-white border-[3px] border-blue-300 shadow-sm shrink-0"></div>
                    <span className="text-sm font-bold text-gray-600">
                      {city}
                    </span>
                  </div>
                ))}

                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full bg-red-500 border-[3px] border-white shadow-sm ring-2 ring-red-200 shrink-0"></div>
                  <span className="text-base font-black text-gray-900">
                    {dName}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
