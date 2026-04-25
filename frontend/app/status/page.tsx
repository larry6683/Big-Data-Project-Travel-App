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
  Timer
} from "lucide-react";

const HTTP_STATUS_DESCRIPTIONS: Record<number, string> = {
  200: "OK", 201: "Created", 204: "No Content", 400: "Bad Request", 401: "Unauthorized", 
  403: "Forbidden", 404: "Not Found", 406: "Not Acceptable", 422: "Unprocessable Entity", 
  429: "Too Many Requests", 500: "Internal Server Error", 502: "Bad Gateway", 
  503: "Service Unavailable", 504: "Gateway Timeout"
};

interface HealthReport {
  internal_system: {
    backend_api: { status: string; timestamp: string };
    frontend_app: { status: string; timestamp: string };
  };
  // Updated interface to expect 'last_checked' on external APIs
  external_apis: Record<string, { status: string; status_code?: number; last_checked?: string }>;
  external_apis_last_checked: string | null;
  next_external_check_due: string;
}

// Helper to format ISO strings cleanly
const formatTime = (isoString?: string | null) => {
  if (!isoString) return "Pending...";
  return new Date(isoString).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
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
    <div className="flex flex-col min-h-screen bg-theme-bg text-theme-text">
      <Navbar onMenuClick={() => setNavOpen(!navOpen)} menuOpen={navOpen} />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <Activity className="text-theme-primary" size={32} />
              System Status
            </h1>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-3 text-sm">
              <span className="flex items-center gap-2 text-theme-muted font-medium">
                <Clock size={16} />
                Last Checked: {healthData?.external_apis_last_checked 
                  ? new Date(healthData.external_apis_last_checked).toLocaleString() 
                  : "Fetching..."}
              </span>
              <span className="hidden sm:block text-theme-muted/50">•</span>
              <span className="flex items-center gap-2 text-theme-secondary font-bold">
                <Timer size={16} className="text-theme-primary" />
                Next automated check: {healthData?.next_external_check_due 
                  ? new Date(healthData.next_external_check_due).toLocaleString() 
                  : "Pending..."}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => fetchHealth(true)}
            disabled={isAnyLoading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-theme-bg shadow-md transition-all active:scale-95 flex-shrink-0 ${
              isAnyLoading
                ? "bg-theme-muted cursor-not-allowed opacity-70" 
                : "bg-theme-primary hover:bg-theme-secondary hover:shadow-lg"
            }`}
          >
            <RefreshCw size={18} className={isRefreshingAll ? "animate-spin" : ""} />
            {isRefreshingAll ? "Pinging All..." : "Force Check All"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 shadow-sm flex items-center gap-3">
            <XCircle size={20} className="text-red-500 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            <div className="h-24 bg-theme-surface/50 rounded-2xl border border-theme-muted/20 animate-pulse"></div>
            <div className="h-64 bg-theme-surface/50 rounded-2xl border border-theme-muted/20 animate-pulse"></div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Internal System Status Card */}
            <section className="bg-theme-surface rounded-2xl p-6 border border-theme-muted/30 shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-theme-muted/20 pb-3">
                <Server className="text-theme-primary" size={24} />
                Internal Core Services
              </h2>
              <div className="space-y-3">
                
                {/* Backend Row */}
                <div className="flex items-center justify-between p-4 bg-theme-bg rounded-xl border border-theme-muted/20 shadow-sm hover:border-theme-primary/40 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-bold">Backend API & Database</span>
                    <span className="text-xs text-theme-muted">Routing, Auth, Data Persistence</span>
                    <span className="text-[10px] text-theme-muted/70 flex items-center gap-1 mt-1 font-mono">
                      <Clock size={10} /> {formatTime(healthData?.internal_system?.backend_api?.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={healthData?.internal_system?.backend_api?.status || "UNKNOWN"} statusCode={200} />
                    <button
                      onClick={() => fetchHealth(false, 'backend_api')}
                      disabled={isAnyLoading}
                      className={`p-2 rounded-lg transition-colors border shadow-sm active:scale-95 ${
                        refreshingApi === 'backend_api' ? "bg-theme-primary/20 text-theme-primary border-theme-primary/30" : isAnyLoading ? "bg-theme-surface text-theme-muted border-transparent cursor-not-allowed" : "bg-theme-bg text-theme-secondary border-theme-muted/30 hover:bg-theme-surface hover:text-theme-primary hover:border-theme-primary/50"
                      }`}
                    >
                      <RefreshCw size={14} className={refreshingApi === 'backend_api' ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>

                {/* Frontend Row */}
                <div className="flex items-center justify-between p-4 bg-theme-bg rounded-xl border border-theme-muted/20 shadow-sm hover:border-theme-primary/40 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-bold">Frontend Home Page</span>
                    <span className="text-xs text-theme-muted">User Interface, SSR, Client Routing</span>
                    <span className="text-[10px] text-theme-muted/70 flex items-center gap-1 mt-1 font-mono">
                      <Clock size={10} /> {formatTime(healthData?.internal_system?.frontend_app?.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={healthData?.internal_system?.frontend_app?.status || "UNKNOWN"} statusCode={200} />
                    <button
                      onClick={() => fetchHealth(false, 'frontend_app')}
                      disabled={isAnyLoading}
                      className={`p-2 rounded-lg transition-colors border shadow-sm active:scale-95 ${
                        refreshingApi === 'frontend_app' ? "bg-theme-primary/20 text-theme-primary border-theme-primary/30" : isAnyLoading ? "bg-theme-surface text-theme-muted border-transparent cursor-not-allowed" : "bg-theme-bg text-theme-secondary border-theme-muted/30 hover:bg-theme-surface hover:text-theme-primary hover:border-theme-primary/50"
                      }`}
                    >
                      <RefreshCw size={14} className={refreshingApi === 'frontend_app' ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* External APIs Grid Card */}
            <section className="bg-theme-surface rounded-2xl p-6 border border-theme-muted/30 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-theme-muted/20 pb-3 mb-4 gap-2">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Globe className="text-theme-primary" size={24} />
                  External API Connections
                </h2>
                <span className="text-xs font-bold text-theme-secondary bg-theme-accent/20 px-3 py-1 rounded-full border border-theme-accent/50">
                  Cache TTL: 48h
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {healthData?.external_apis && Object.keys(healthData.external_apis).length > 0 ? (
                  Object.entries(healthData.external_apis).map(([apiName, details]: [string, any]) => (
                    <div 
                      key={apiName} 
                      className="flex items-center justify-between p-4 bg-theme-bg rounded-xl border border-theme-muted/20 shadow-sm hover:border-theme-primary/40 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-sm sm:text-base">{apiName.replace("_", " ")}</span>
                        
                        <div className="flex items-center gap-2 mt-0.5">
                          {details.status_code && (
                            <span className="text-xs text-theme-muted font-medium">
                              HTTP {details.status_code}
                            </span>
                          )}
                          {details.status_code && <span className="text-theme-muted/40">•</span>}
                          
                          {/* Individual API Timestamp */}
                          <span className="text-[10px] text-theme-muted/70 flex items-center gap-1 font-mono">
                            <Clock size={10} /> {formatTime(details.last_checked || healthData.external_apis_last_checked)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <StatusBadge status={details.status || "UNKNOWN"} statusCode={details.status_code} />
                        <button
                          onClick={() => fetchHealth(false, apiName)}
                          disabled={isAnyLoading}
                          className={`p-2 rounded-lg transition-colors border shadow-sm active:scale-95 flex-shrink-0 ${
                            refreshingApi === apiName ? "bg-theme-primary/20 text-theme-primary border-theme-primary/30" : isAnyLoading ? "bg-theme-surface text-theme-muted border-transparent cursor-not-allowed" : "bg-theme-bg text-theme-secondary border-theme-muted/30 hover:bg-theme-surface hover:text-theme-primary hover:border-theme-primary/50"
                          }`}
                        >
                          <RefreshCw size={14} className={refreshingApi === apiName ? "animate-spin" : ""} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-1 md:col-span-2 text-center py-8 text-theme-muted font-medium bg-theme-bg rounded-xl border border-dashed border-theme-muted/40">
                    No API status data found. Click Force Check to ping providers.
                  </div>
                )}
              </div>
            </section>

          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status, statusCode }: { status: string; statusCode?: number }) {
  const isUp = status.toUpperCase() === "UP";
  const isDown = status.toUpperCase() === "DOWN";

  if (isUp && statusCode === 200) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-theme-primary/10 text-theme-primary border border-theme-primary/30 rounded-full font-black text-[10px] sm:text-xs tracking-wide">
        <CheckCircle2 size={14} /> <span className="hidden sm:inline">OPERATIONAL</span><span className="sm:hidden">UP</span>
      </div>
    );
  }

  if (isUp && statusCode && statusCode !== 200) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-full font-black text-[10px] sm:text-xs tracking-wide">
        <AlertTriangle size={14} /> CAUTION
      </div>
    );
  }

  if (isDown) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 border border-red-300 rounded-full font-black text-[10px] sm:text-xs tracking-wide">
        <XCircle size={14} /> OUTAGE
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-theme-accent/20 text-theme-secondary border border-theme-accent/50 rounded-full font-black text-[10px] sm:text-xs tracking-wide">
      <RefreshCw size={14} className="animate-spin" /> PENDING
    </div>
  );
}