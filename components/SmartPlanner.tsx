
import React from 'react';
import { WeatherData } from '../types';

interface SmartPlannerProps {
  hourly: WeatherData['hourly'];
}

const SmartPlanner: React.FC<SmartPlannerProps> = ({ hourly }) => {
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: 'numeric', hour12: false });
  };

  return (
    <div className="glass p-8 rounded-[40px] overflow-hidden relative">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest">Precipitation Pulse</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500/30"></div>
            <span className="text-[10px] text-white/40 uppercase font-bold">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-[10px] text-white/40 uppercase font-bold">High %</span>
          </div>
        </div>
      </div>

      <div className="relative h-24 flex items-end gap-1.5 overflow-x-auto no-scrollbar pb-6 px-2">
        {hourly.precipitation_probability.map((prob, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-3 min-w-[32px] group/bar">
            <div className="relative w-full">
              <div 
                className="w-full bg-blue-500/20 rounded-t-lg transition-all duration-700 group-hover/bar:bg-blue-400"
                style={{ height: `${Math.max(4, prob)}%` }}
              >
                {prob > 10 && (
                  <div 
                    className="absolute top-0 left-0 w-full bg-blue-500 rounded-t-lg shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    style={{ height: '100%' }}
                  />
                )}
              </div>
            </div>
            <span className="text-[9px] font-black text-white/20 uppercase group-hover/bar:text-white transition-colors">
              {formatTime(hourly.time[idx])}
            </span>
            
            {/* Tooltip */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-500 text-[10px] font-black px-2 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity">
              {prob}%
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-[10px] text-white/30 font-medium italic text-center">
        * Percentage represents probability of localized rainfall within the next 24 hours.
      </div>
    </div>
  );
};

export default SmartPlanner;
