"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { 
  Server, 
  Globe, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Activity,
  AlertTriangle,
  Timer,
  Info,
  CloudRain,
  Search,
  MapPin,
  Plane,
  Key,
  Map,
  Compass,
  Sparkles,
  Database,
  Monitor
} from "lucide-react";

interface HealthReport {
  internal_system: {
    backend_api: { endpoint?: string; status: string; status_code?: number; status_description?: string; timestamp?: string };
    frontend_app: { endpoint?: string; status: string; status_code?: number; status_description?: string; timestamp?: string };
  };
  external_apis: Array<{
    api_name: string;
    endpoint: string;
    status_code?: number;
    status: string;
    status_description?: string;
    last_checked?: string;
  }>;
  external_apis_last_checked: string | null;
  next_external_check_due: string;
}

// UPGRADED formatTime helper
const formatTime = (isoString?: string | null) => {
  if (!isoString) return "Pending...";
  
  // The Fix: If the date string from the database is missing timezone info (no 'Z' or offset),
  // forcefully append 'Z' to tell Javascript it is UTC time.
  const isNaive = !isoString.includes('Z') && !isoString.includes('+') && (!isoString.includes('-') || isoString.lastIndexOf('-') < 10);
  const safeString = isNaive ? `${isoString}Z` : isoString;

  return new Date(safeString).toLocaleString(undefined, {
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    timeZoneName: 'short' // This grabs your local timezone abbreviation!
  });
};

const getApiIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('weather')) return CloudRain;
  if (n.includes('serp')) return Search;
  if (n.includes('bdc') || n.includes('bigdata')) return MapPin;
  if (n.includes('air') || n.includes('flight')) return Plane;
  if (n.includes('amadeus') || n.includes('auth')) return Key;
  if (n.includes('osm') || n.includes('overpass')) return Map;
  if (n.includes('map')) return Compass;
  if (n.includes('openai')) return Sparkles;
  if (n.includes('backend')) return Database;
  if (n.includes('frontend')) return Monitor;
  return Globe;
};

export default function StatusPage() {
  const [healthData, setHealthData] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshingAll, setIsRefreshingAll] = useState<boolean>(false);
  const [refreshingApi, setRefreshingApi] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  const fetchHealth = async (force: boolean = false, apiName?: string) => {
    if (force && !apiName) setIsRefreshingAll(true);
    if (apiName) setRefreshingApi(apiName);
    setError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const params = new URLSearchParams();
      if (force) params.append("force", "true");
      if (apiName) params.append("api", apiName);
      
      const queryString = params.toString();
      const url = `${baseUrl}/health${queryString ? `?${queryString}` : ""}`;
      
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch system status");
      
      const data = await response.json();
      setHealthData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshingAll(false);
      setRefreshingApi(null);
    }
  };

  useEffect(() => {
    fetchHealth(false);
  }, []);

  const isAnyLoading = loading || isRefreshingAll || refreshingApi !== null;

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-theme-text font-sans">
      <Navbar onMenuClick={() => setNavOpen(!navOpen)} menuOpen={navOpen} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 sm:px-6 flex flex-col gap-6 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-theme-surface/50 p-5 rounded-2xl border border-theme-muted/20 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-theme-primary/10 rounded-xl text-theme-primary hidden sm:block">
              <Activity size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black">System Status</h1>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-1.5 text-xs">
                <span className="flex items-center gap-1.5 text-theme-muted font-medium">
                  <Clock size={14} className="text-theme-secondary" />
                  Global Check: {healthData?.external_apis_last_checked 
                    ? formatTime(healthData.external_apis_last_checked)
                    : "Fetching..."}
                </span>
                <span className="flex items-center gap-1.5 text-theme-muted font-medium">
                  <Timer size={14} className="text-theme-primary" />
                  Next Due: {healthData?.next_external_check_due 
                    ? formatTime(healthData.next_external_check_due)
                    : "Pending..."}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => fetchHealth(true)}
            disabled={isAnyLoading}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black shadow-md transition-all active:scale-95 flex-shrink-0 ${
              isAnyLoading
                ? "bg-theme-muted/50 text-theme-text/50 cursor-not-allowed" 
                : "bg-theme-primary text-white hover:bg-theme-secondary hover:shadow-lg hover:-translate-y-0.5"
            }`}
          >
            <RefreshCw size={16} className={isRefreshingAll ? "animate-spin" : ""} />
            {isRefreshingAll ? "Pinging..." : "Force Check All"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl shadow-sm flex items-center gap-3">
            <XCircle size={20} className="text-red-500 flex-shrink-0" />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="h-96 w-full bg-theme-text/10 rounded-3xl animate-pulse"></div>
        ) : (
          /* UNIFIED DARK SECTION */
          <section className="bg-theme-text text-theme-bg rounded-3xl shadow-xl overflow-hidden flex flex-col">
            
            {/* INTERNAL DIVIDER HEADER */}
            <div className="px-6 py-5 border-b border-theme-bg/10 flex items-center gap-3 bg-white/5">
              <Server className="text-theme-bg/70" size={22} />
              <h2 className="text-lg font-bold tracking-wide">Internal Core Services</h2>
            </div>
            
            {/* INTERNAL CARDS (Single Column) */}
            <div className="p-6 flex flex-col gap-4">
              <StatusCard 
                name="Backend API & Database"
                endpoint={healthData?.internal_system?.backend_api?.endpoint || "Internal Routing, Auth, DB"}
                status={healthData?.internal_system?.backend_api?.status}
                statusCode={healthData?.internal_system?.backend_api?.status_code}
                description={healthData?.internal_system?.backend_api?.status_description}
                timestamp={healthData?.internal_system?.backend_api?.timestamp}
                isRefreshing={refreshingApi === 'backend_api'}
                onRefresh={() => fetchHealth(false, 'backend_api')}
                disabled={isAnyLoading}
                internalKey="backend_api"
              />

              <StatusCard 
                name="Frontend Interface"
                endpoint={healthData?.internal_system?.frontend_app?.endpoint || "Client UI"}
                status={healthData?.internal_system?.frontend_app?.status}
                statusCode={healthData?.internal_system?.frontend_app?.status_code}
                description={healthData?.internal_system?.frontend_app?.status_description}
                timestamp={healthData?.internal_system?.frontend_app?.timestamp}
                isRefreshing={refreshingApi === 'frontend_app'}
                onRefresh={() => fetchHealth(false, 'frontend_app')}
                disabled={isAnyLoading}
                internalKey="frontend_app"
              />
            </div>

            {/* EXTERNAL DIVIDER HEADER */}
            <div className="px-6 py-5 border-y border-theme-bg/10 flex justify-between items-center bg-white/5 mt-2">
              <div className="flex items-center gap-3">
                <Globe className="text-theme-bg/70" size={22} />
                <h2 className="text-lg font-bold tracking-wide">External API Integrations</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-theme-bg/80 bg-theme-bg/10 px-3 py-1.5 rounded-lg border border-theme-bg/20">
                <Info size={14} /> TTL: 48h
              </div>
            </div>

            {/* EXTERNAL CARDS (Single Column) */}
            <div className="p-6 flex flex-col gap-4">
              {healthData?.external_apis && healthData.external_apis.length > 0 ? (
                healthData.external_apis.map((api) => (
                  <StatusCard 
                    key={api.api_name}
                    name={api.api_name.replace("_", " ")}
                    endpoint={api.endpoint}
                    status={api.status}
                    statusCode={api.status_code}
                    description={api.status_description}
                    timestamp={api.last_checked || healthData.external_apis_last_checked}
                    isRefreshing={refreshingApi === api.api_name}
                    onRefresh={() => fetchHealth(false, api.api_name)}
                    disabled={isAnyLoading}
                    internalKey={api.api_name}
                  />
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-theme-bg/50 font-medium border-2 border-dashed border-theme-bg/10 rounded-2xl">
                  <Globe size={48} className="mb-4 opacity-50" />
                  <p>No external API records found.</p>
                </div>
              )}
            </div>

          </section>
        )}
      </main>
    </div>
  );
}

// Reusable Sub-component styled specifically for the dark inverted container
function StatusCard({ 
  name, endpoint, status, statusCode, description, timestamp, isRefreshing, onRefresh, disabled, internalKey
}: any) {
  const Icon = getApiIcon(internalKey);
  
  return (
    <div className="relative flex flex-col p-5 bg-transparent rounded-2xl border border-theme-bg/15 hover:border-theme-bg/40 hover:bg-white/5 transition-all duration-300 overflow-hidden group min-h-[120px]">
      
      {/* Background Icon Watermark */}
      <div className="absolute right-0 -bottom-4 opacity-[0.04] text-theme-bg pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
        <Icon size={160} strokeWidth={1} />
      </div>
      
      {/* Background Text Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none overflow-hidden">
        <span className="text-8xl font-black uppercase whitespace-nowrap tracking-tighter text-theme-bg">
          {name}
        </span>
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 flex justify-between items-start mb-auto gap-4">
        <div className="overflow-hidden">
          <h3 className="font-bold text-lg text-theme-bg truncate">{name}</h3>
          <p className="text-xs font-mono text-theme-bg/50 mt-1 truncate max-w-[250px] sm:max-w-full">
            {endpoint || "Unknown endpoint"}
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusBadge status={status || "UNKNOWN"} statusCode={statusCode} />
          <button
            onClick={onRefresh}
            disabled={disabled}
            className={`p-2.5 rounded-xl transition-all border active:scale-95 backdrop-blur-sm ${
              isRefreshing 
                ? "bg-theme-bg/20 text-theme-bg border-theme-bg/40 shadow-inner" 
                : disabled 
                  ? "bg-transparent text-theme-bg/30 border-transparent opacity-50 cursor-not-allowed" 
                  : "bg-theme-bg/5 text-theme-bg/70 border-theme-bg/20 hover:bg-theme-bg/15 hover:text-theme-bg hover:border-theme-bg/40"
            }`}
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
      
      {/* Bottom Information Row */}
      <div className="relative z-10 mt-5 pt-3 border-t border-theme-bg/10 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-sm">
          {statusCode && (
            <span className={`font-black text-xs px-2 py-0.5 rounded ${
              status === 'UP' && statusCode === 200 ? 'bg-green-500/20 text-green-400' : 
              status === 'UP' ? 'bg-yellow-500/20 text-yellow-400' : 
              'bg-red-500/20 text-red-400'
            }`}>
              {statusCode}
            </span>
          )}
          <span className={`text-sm font-semibold leading-tight truncate ${status === 'DOWN' ? 'text-red-400' : 'text-theme-bg/90'}`}>
            {description || (status === "UP" ? "Operational" : "Connection Failed")}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs text-theme-bg/50 font-mono tracking-tight mt-1">
          <Clock size={12} /> 
          {formatTime(timestamp)}
        </div>
      </div>
      
    </div>
  );
}

// Sub-component for rendering the pill tags specifically against dark backgrounds
function StatusBadge({ status, statusCode }: { status: string; statusCode?: number }) {
  const isUp = status?.toUpperCase() === "UP";
  const isDown = status?.toUpperCase() === "DOWN";

  if (isUp && statusCode === 200) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg font-black text-[10px] sm:text-xs tracking-wider shadow-sm backdrop-blur-sm">
        <CheckCircle2 size={14} className="text-green-400" /> 
        <span className="hidden sm:inline">OPERATIONAL</span><span className="sm:hidden">UP</span>
      </div>
    );
  }

  if (isUp && statusCode && statusCode !== 200) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg font-black text-[10px] sm:text-xs tracking-wider shadow-sm backdrop-blur-sm">
        <AlertTriangle size={14} className="text-yellow-400" /> 
        <span className="hidden sm:inline">CAUTION</span><span className="sm:hidden">WARN</span>
      </div>
    );
  }

  if (isDown) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg font-black text-[10px] sm:text-xs tracking-wider shadow-sm backdrop-blur-sm">
        <XCircle size={14} className="text-red-400" /> 
        <span className="hidden sm:inline">OUTAGE</span><span className="sm:hidden">DOWN</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-bg/10 text-theme-bg/70 border border-theme-bg/20 rounded-lg font-black text-[10px] sm:text-xs tracking-wider shadow-sm backdrop-blur-sm">
      <RefreshCw size={14} className="animate-spin text-theme-bg/50" /> 
      <span className="hidden sm:inline">PENDING</span><span className="sm:hidden">WAIT</span>
    </div>
  );
}