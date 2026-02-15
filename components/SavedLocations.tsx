
import React from 'react';
import { SavedLocation } from '../types';

interface SavedLocationsProps {
  locations: SavedLocation[];
  onSelect: (location: SavedLocation) => void;
  onRemove: (id: string) => void;
  currentLocationId?: string;
}

const SavedLocations: React.FC<SavedLocationsProps> = ({ 
  locations, 
  onSelect, 
  onRemove, 
  currentLocationId 
}) => {
  if (locations.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {locations.map((loc) => {
          const isActive = currentLocationId === loc.id;
          
          return (
            <div 
              key={loc.id} 
              className={`flex-shrink-0 w-48 glass rounded-[28px] p-4 flex flex-col justify-between gap-3 group transition-all duration-500 hover:bg-white/10 hover:translate-y-[-4px] relative border ${
                isActive ? 'border-blue-400/50 bg-white/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'border-white/5'
              }`}
            >
              <button 
                onClick={() => onSelect(loc)}
                className="text-left flex-1"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Favorite</span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                  )}
                </div>
                <h4 className="text-lg font-bold text-white truncate group-hover:text-blue-100 transition-colors">
                  {loc.name}
                </h4>
                <p className="text-xs text-white/40 truncate">{loc.country}</p>
              </button>

              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px] font-mono text-white/20">
                  {loc.lat.toFixed(1)}°, {loc.lon.toFixed(1)}°
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(loc.id);
                  }}
                  className="p-2 rounded-xl text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-all active:scale-90"
                  title="Remove location"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {isActive && (
                <div className="absolute inset-0 rounded-[28px] shimmer-overlay opacity-10 pointer-events-none"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SavedLocations;
