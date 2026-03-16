// frontend/app/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { travelApi } from "../../services/api";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import { X, Plane, Hotel, MapPin, Calendar, Map, Ticket } from "lucide-react";

interface SavedTrip {
  id: number;
  destination: string;
  data: {
    startDate: string;
    endDate: string;
    flight?: any;
    hotel?: any;
    weather?: any;
    activities?: any[];
    attractions?: any[];
  };
}

export default function DashboardPage() {
  const { isLoggedIn } = useAuth();
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);

  // 🌟 NEW: State to control which trip is currently open in the modal
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);

  useEffect(() => {
    const fetchTrips = async () => {
      if (!isLoggedIn) return;
      try {
        const data = await travelApi.getMyTrips();
        setSavedTrips(data);
      } catch (error) {
        console.error("Failed to load trips:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [isLoggedIn]);

  const handleDelete = async (tripId: number) => {
    if (!window.confirm("Are you sure you want to delete this itinerary?"))
      return;
    try {
      await travelApi.deleteTrip(tripId);
      setSavedTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (error) {
      alert("Failed to delete trip.");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const localDate = new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2])
    );
    return localDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">
          Please login to view your dashboard
        </h1>
        <Link
          href="/login"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <Navbar onMenuClick={() => {}} mapOpen={false} onMapToggle={() => {}} />

      <main className="max-w-6xl mx-auto p-8">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              My Saved Itineraries
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              You have {savedTrips.length} stored trips.
            </p>
          </div>
          <Link
            href="/"
            className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 transition"
          >
            + Plan New Trip
          </Link>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : savedTrips.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-gray-200">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No trips planned yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start exploring destinations and save your favorite itineraries
              here.
            </p>
            <Link
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700"
            >
              Create Your First Itinerary
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedTrips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition flex flex-col"
              >
                <div className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-black text-gray-900 line-clamp-1">
                      {trip.destination}
                    </h2>
                    <span className="bg-blue-50 text-blue-700 text-xs font-black px-2 py-1 rounded-md whitespace-nowrap border border-blue-100">
                      {formatDate(trip.data.startDate)}
                    </span>
                  </div>

                  <div className="space-y-3 text-sm text-gray-600 mb-6 font-medium">
                    <div className="flex items-center gap-2">
                      <Plane size={16} className="text-gray-400" />
                      <span className="truncate">
                        {trip.data.flight?.airline_name || "No flight selected"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hotel size={16} className="text-gray-400" />
                      <span className="truncate">
                        {trip.data.hotel?.name || "No hotel selected"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Map size={16} className="text-gray-400" />
                      <span>
                        {trip.data.attractions?.length || 0} Attractions saved
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t flex gap-2">
                  <button
                    onClick={() => setSelectedTrip(trip)} // 🌟 Opens the Modal
                    className="flex-1 text-center bg-white border border-gray-300 text-gray-700 py-2 rounded-xl text-sm font-bold hover:bg-gray-100 active:scale-95 transition"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleDelete(trip.id)}
                    className="bg-white border border-red-200 text-red-500 p-2 rounded-xl hover:bg-red-50 active:scale-95 transition"
                    title="Delete Trip"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 🌟 NEW: ITINERARY DETAILS MODAL */}
      {selectedTrip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedTrip(null)}
          />

          <div className="relative bg-white w-full max-w-2xl max-h-[85vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  {selectedTrip.destination} Itinerary
                </h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                  <Calendar size={12} className="inline mr-1 mb-0.5" />
                  {formatDate(selectedTrip.data.startDate)} —{" "}
                  {formatDate(selectedTrip.data.endDate)}
                </p>
              </div>
              <button
                onClick={() => setSelectedTrip(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition bg-gray-100 text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
              {/* Flight Info */}
              {selectedTrip.data.flight && (
                <div>
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Plane size={16} className="text-blue-600" /> Flight
                  </h3>
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900">
                          {selectedTrip.data.flight.airline_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {
                            selectedTrip.data.flight.itineraries?.[0]
                              ?.segments?.[0]?.departure_airport
                          }
                          {" → "}
                          {
                            selectedTrip.data.flight.itineraries?.[0]?.segments?.slice(
                              -1
                            )[0]?.arrival_airport
                          }
                        </p>
                      </div>
                      <span className="font-black text-blue-700">
                        $
                        {selectedTrip.data.flight.price?.total ||
                          selectedTrip.data.flight.price ||
                          0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Hotel Info */}
              {selectedTrip.data.hotel && (
                <div>
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Hotel size={16} className="text-blue-600" /> Accommodation
                  </h3>
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900">
                          {selectedTrip.data.hotel.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin size={12} />{" "}
                          {selectedTrip.data.hotel.address?.lines?.join(", ") ||
                            "Address unavailable"}
                        </p>
                      </div>
                      <span className="font-black text-blue-700">
                        $
                        {selectedTrip.data.hotel.offerDetails?.price ||
                          selectedTrip.data.hotel.price ||
                          0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Attractions Info */}
              {selectedTrip.data.attractions &&
                selectedTrip.data.attractions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Map size={16} className="text-emerald-600" /> Attractions
                      to Visit
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedTrip.data.attractions.map((attr, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 border border-gray-100 p-3 rounded-lg text-sm font-medium text-gray-800 flex items-start gap-2"
                        >
                          <span className="text-emerald-500 mt-0.5">•</span>{" "}
                          {attr.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Activities Info */}
              {selectedTrip.data.activities &&
                selectedTrip.data.activities.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Ticket size={16} className="text-orange-500" /> Booked
                      Activities
                    </h3>
                    <div className="space-y-3">
                      {selectedTrip.data.activities.map((act, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 border border-gray-100 p-3 rounded-lg flex justify-between items-center"
                        >
                          <p className="text-sm font-medium text-gray-800 line-clamp-1 pr-4">
                            {act.name}
                          </p>
                          <span className="text-sm font-black text-orange-600 shrink-0">
                            ${act.price?.amount || act.price || "N/A"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setSelectedTrip(null)}
                className="w-full bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-900 transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
