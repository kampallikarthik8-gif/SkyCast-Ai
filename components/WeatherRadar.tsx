
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
  const [mapVersion, setMapVersion] = useState(0); // Used to force-reload the iframe on re-center
  const watchId = useRef<number | null>(null);

  const layers: LayerOption[] = [
    { id: 'rain', label: 'Precipitation', icon: '🌧️' },
    { id: 'radar', label: 'Live Radar', icon: '📡' },
    { id: 'wind', label: 'Wind Flow', icon: '💨' },
    { id: 'temp', label: 'Temperature', icon: '🌡️' },
    { id: 'clouds', label: 'Cloud Cover', icon: '☁️' },
    { id: 'satellite', label: 'Satellite', icon: '🛰️' },
  ];

  // Effective coordinates: either device GPS or the app's selected city
  const activeLat = isTracking && deviceCoords ? deviceCoords.lat : initialLat;
  const activeLon = isTracking && deviceCoords ? deviceCoords.lon : initialLon;

  const handleRecenter = useCallback(() => {
    setZoom(8);
    setMapVersion(v => v + 1); // Trigger a re-render of the iframe with current active coords
  }, []);

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 3), 17));
  };

  useEffect(() => {
    if (isTracking) {
      if ("geolocation" in navigator) {
        watchId.current = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setDeviceCoords(prev => {
              if (!prev || Math.abs(prev.lat - latitude) > 0.001 || Math.abs(prev.lon - longitude) > 0.001) {
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
      }
    } else {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    }

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [isTracking]);

  // Dynamically build the Windy URL
  const windyUrl = `https://embed.windy.com/embed2.html?lat=${activeLat}&lon=${activeLon}&detailLat=${activeLat}&detailLon=${activeLon}&width=650&height=450&zoom=${zoom}&level=surface&overlay=${overlay}&product=ecmwf&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1`;

  return (
    <div className="glass p-1 md:p-2 rounded-[40px] relative overflow-hidden h-[500px] md:h-[650px] group transition-all duration-500 hover:shadow-[0_20px_80px_-20px_rgba(59,130,246,0.3)] border border-white/10">
      
      {/* Top Left HUD: Status Bar */}
      <div className="absolute top-6 left-6 z-10 flex flex-col items-start gap-3 pointer-events-none">
        <div className="bg-blue-600/90 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl border border-blue-400/40 glow-active pointer-events-auto">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_12px_rgba(255,255,255,0.9)]"></div>
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] animate-pulse">Live Feed</span>
        </div>
        
        {isTracking && (
          <div className="bg-green-500/80 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-2 border border-green-400/40 animate-in fade-in slide-in-from-left-2 shadow-[0_0_15px_rgba(34,197,94,0.3)] pointer-events-auto">
            <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Tracking Device</span>
          </div>
        )}
      </div>

      {/* Top Right HUD: Controls Stack */}
      <div className="absolute top-6 right-6 z-10 flex flex-col gap-3">
        {/* Tracking Toggle */}
        <button 
          onClick={() => setIsTracking(!isTracking)}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl backdrop-blur-xl border transition-all active:scale-95 shadow-2xl relative overflow-hidden group/track ${
            isTracking 
            ? 'bg-blue-500/90 border-blue-400 text-white glow-active' 
            : 'bg-black/40 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
          }`}
          title={isTracking ? 'Disable Auto-Tracking' : 'Enable Auto-Tracking'}
        >
          {isTracking && <div className="absolute inset-0 shimmer-overlay opacity-30 pointer-events-none"></div>}
          <svg className={`w-4 h-4 relative z-10 ${isTracking ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest relative z-10 hidden sm:inline">
            {isTracking ? 'Tracking ON' : 'Tracking OFF'}
          </span>
        </button>

        {/* Re-center Button */}
        <button 
          onClick={handleRecenter}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all active:scale-95 shadow-2xl"
          title="Re-center Map"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Recenter</span>
        </button>

        {/* Zoom Controls */}
        <div className="flex flex-col bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          <button 
            onClick={() => handleZoom(1)}
            className="p-3 text-white/70 hover:bg-white/10 hover:text-white transition-colors border-b border-white/5 active:bg-blue-500/20"
            title="Zoom In"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button 
            onClick={() => handleZoom(-1)}
            className="p-3 text-white/70 hover:bg-white/10 hover:text-white transition-colors active:bg-blue-500/20"
            title="Zoom Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Layer Controls - Floating Dock */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex bg-slate-900/80 backdrop-blur-2xl p-2 rounded-[28px] border border-white/10 shadow-2xl max-w-[95%] overflow-x-auto no-scrollbar">
        <div className="flex gap-1">
          {layers.map((layer) => {
            const isActive = overlay === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => setOverlay(layer.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl transition-all whitespace-nowrap relative overflow-hidden group/btn ${
                  isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-105 glow-active' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && <div className="absolute inset-0 shimmer-overlay opacity-20 pointer-events-none"></div>}
                <span className="text-lg relative z-10">{layer.icon}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest relative z-10 ${isActive ? 'animate-pulse' : ''}`}>{layer.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <iframe 
        key={`${overlay}-${activeLat}-${activeLon}-${zoom}-${mapVersion}`} // Force reload on layer, center, zoom, or explicit re-center
        title="Weather Radar"
        width="100%" 
        height="100%" 
        src={windyUrl}
        frameBorder="0"
        className="rounded-[36px] grayscale-[0.1] brightness-[0.85] contrast-[1.1] hover:grayscale-0 hover:brightness-100 transition-all duration-1000"
      ></iframe>

      {/* High-Tech HUD Overlays */}
      <div className="absolute inset-0 pointer-events-none rounded-[40px] border-[1px] border-white/5 shadow-[inset_0_0_100px_rgba(15,23,42,0.8)]"></div>
      
      {/* Subtle Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
      
      {/* Corner Brackets */}
      <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-white/20 pointer-events-none rounded-tr-lg"></div>
      <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-white/20 pointer-events-none rounded-bl-lg"></div>
    </div>
  );
};

export default WeatherRadar;
