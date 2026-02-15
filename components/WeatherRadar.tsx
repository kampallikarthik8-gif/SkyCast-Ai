
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface WeatherRadarProps {
  lat: number;
  lon: number;
}

type RadarOverlay = 'rain' | 'wind' | 'temp' | 'clouds' | 'satellite' | 'radar';

interface LayerOption {
  id: RadarOverlay;
  label: string;
  icon: string;
}

const WeatherRadar: React.FC<WeatherRadarProps> = ({ lat: initialLat, lon: initialLon }) => {
  const [overlay, setOverlay] = useState<RadarOverlay>('rain');
  const [isTracking, setIsTracking] = useState(false);
  const [deviceCoords, setDeviceCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [zoom, setZoom] = useState(8);
  const [mapVersion, setMapVersion] = useState(0); 
  const [isMapLoading, setIsMapLoading] = useState(false);
  const watchId = useRef<number | null>(null);

  const layers: LayerOption[] = [
    { id: 'rain', label: 'Precipitation', icon: '🌧️' },
    { id: 'radar', label: 'Live Radar', icon: '📡' },
    { id: 'wind', label: 'Wind Flow', icon: '💨' },
    { id: 'temp', label: 'Temperature', icon: '🌡️' },
    { id: 'clouds', label: 'Cloud Cover', icon: '☁️' },
    { id: 'satellite', label: 'Satellite', icon: '🛰️' },
  ];

  // Effective coordinates: either device GPS (if tracking is ON) or the application's selected city
  const activeLat = isTracking && deviceCoords ? deviceCoords.lat : initialLat;
  const activeLon = isTracking && deviceCoords ? deviceCoords.lon : initialLon;

  const handleRecenter = useCallback(() => {
    // Manually force a reload and re-center to the currently active location
    setMapVersion(v => v + 1); 
    setIsMapLoading(true);
  }, []);

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 3), 17));
    setIsMapLoading(true);
  };

  useEffect(() => {
    if (isTracking) {
      if ("geolocation" in navigator) {
        // Initial fetch to jump to location immediately
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setDeviceCoords({ lat: latitude, lon: longitude });
            setIsMapLoading(true);
          },
          (err) => console.warn("GPS Initial Lock Failed", err),
          { enableHighAccuracy: true }
        );

        // Continuous tracking
        watchId.current = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            
            // Significant movement threshold: ~11 meters (0.0001 degrees)
            const threshold = 0.0001; 
            setDeviceCoords(prev => {
              if (!prev || Math.abs(prev.lat - latitude) > threshold || Math.abs(prev.lon - longitude) > threshold) {
                // If user moved significantly, trigger a map reload at the new center
                setIsMapLoading(true);
                return { lat: latitude, lon: longitude };
              }
              return prev;
            });
          },
          (error) => {
            console.error("Tracking error:", error);
            setIsTracking(false);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        alert("Geolocation is not supported by your browser.");
        setIsTracking(false);
      }
    } else {
      // Clear tracking if disabled
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      setIsMapLoading(true); // Trigger reload to return to the search location
    }

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [isTracking]);

  // Dynamically build the Windy URL
  const windyUrl = `https://embed.windy.com/embed2.html?lat=${activeLat}&lon=${activeLon}&detailLat=${activeLat}&detailLon=${activeLon}&width=650&height=450&zoom=${zoom}&level=surface&overlay=${overlay}&product=ecmwf&menu=&message=true&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1`;

  return (
    <div className="glass p-1 md:p-2 rounded-[40px] relative overflow-hidden h-[500px] md:h-[650px] group transition-all duration-500 hover:shadow-[0_20px_80px_-20px_rgba(59,130,246,0.3)] border border-white/10 bg-slate-900/40">
      
      {/* Loading Overlay */}
      {isMapLoading && (
        <div className="absolute inset-0 z-30 bg-slate-950/40 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none transition-opacity duration-500">
           <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] animate-pulse">Calibrating Satellite</span>
                <span className="text-[8px] text-white/40 uppercase mt-1">Re-centering Map View</span>
              </div>
           </div>
        </div>
      )}

      {/* GPS Status HUD */}
      <div className="absolute top-6 left-6 z-10 flex flex-col items-start gap-3">
        <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/10 shadow-2xl">
          <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-ping' : 'bg-white/20'}`}></div>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">
            {isTracking ? 'GPS Tracking Active' : 'Stationary Mode'}
          </span>
        </div>
      </div>

      {/* Main Controls Panel */}
      <div className="absolute top-6 right-6 z-10 flex flex-col gap-3">
        {/* Toggle Tracking Button */}
        <button 
          onClick={() => setIsTracking(!isTracking)}
          className={`flex items-center justify-center gap-3 px-5 py-4 rounded-2xl backdrop-blur-xl border transition-all active:scale-90 shadow-2xl relative overflow-hidden ${
            isTracking 
            ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]' 
            : 'bg-black/40 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
          }`}
          title={isTracking ? 'Stop following my movement' : 'Follow my device GPS'}
        >
          {isTracking && (
            <div className="absolute inset-0 shimmer-overlay opacity-30 pointer-events-none"></div>
          )}
          <div className={`relative z-10 ${isTracking ? 'animate-sun' : ''}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2m10-10h-2M4 10H2" />
            </svg>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest relative z-10">
            {isTracking ? 'Following' : 'Follow Me'}
          </span>
        </button>

        {/* Manual Recenter Button */}
        <button 
          onClick={handleRecenter}
          className="flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all active:scale-90 shadow-2xl"
          title="Manual Map Refresh"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest">Sync</span>
        </button>

        {/* Vertical Zoom Controls */}
        <div className="flex flex-col bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          <button 
            onClick={() => handleZoom(1)}
            className="p-4 text-white/70 hover:bg-white/10 hover:text-white transition-colors border-b border-white/5 active:bg-blue-500/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button 
            onClick={() => handleZoom(-1)}
            className="p-4 text-white/70 hover:bg-white/10 hover:text-white transition-colors active:bg-blue-500/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Layer Navigation Dock */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex bg-slate-900/90 backdrop-blur-3xl p-2 rounded-[32px] border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] max-w-[95%] overflow-x-auto no-scrollbar">
        <div className="flex gap-1">
          {layers.map((layer) => {
            const isActive = overlay === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => {
                  setOverlay(layer.id);
                  setIsMapLoading(true);
                }}
                className={`flex items-center gap-3 px-5 py-3 rounded-2xl transition-all whitespace-nowrap relative overflow-hidden group/btn ${
                  isActive 
                  ? 'bg-blue-600 text-white shadow-lg scale-105' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && <div className="absolute inset-0 shimmer-overlay opacity-20 pointer-events-none"></div>}
                <span className="text-xl relative z-10">{layer.icon}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest relative z-10 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                  {layer.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <iframe 
        key={`${overlay}-${activeLat.toFixed(4)}-${activeLon.toFixed(4)}-${zoom}-${mapVersion}`} 
        title="Weather Radar Feed"
        width="100%" 
        height="100%" 
        src={windyUrl}
        frameBorder="0"
        onLoad={() => setIsMapLoading(false)}
        className="rounded-[36px] brightness-[0.9] contrast-[1.1] transition-all duration-1000"
      ></iframe>

      {/* Decorative HUD Elements */}
      <div className="absolute inset-0 pointer-events-none rounded-[40px] border-[1px] border-white/10 shadow-[inset_0_0_150px_rgba(0,0,0,0.6)]"></div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
      
      {/* Corner Tracking Markers */}
      <div className="absolute top-10 left-10 w-4 h-4 border-t-2 border-l-2 border-white/20 pointer-events-none"></div>
      <div className="absolute top-10 right-10 w-4 h-4 border-t-2 border-r-2 border-white/20 pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-4 h-4 border-b-2 border-l-2 border-white/20 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-4 h-4 border-b-2 border-r-2 border-white/20 pointer-events-none"></div>
    </div>
  );
};

export default WeatherRadar;
