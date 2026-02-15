
import React from 'react';
import { WeatherData, TempUnit } from '../types';
import { WeatherIcon, getUVIndexDescription } from '../constants';

interface HourlyForecastProps {
  hourly: WeatherData['hourly'];
  tempUnit: TempUnit;
  convertTemp: (c: number) => number;
}

const HourlyForecast: React.FC<HourlyForecastProps> = ({ hourly, tempUnit, convertTemp }) => {
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
  };

  return (
    <div className="w-full">
      <div className="flex overflow-x-auto pb-6 gap-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {hourly.time.map((time, idx) => {
          const isNow = idx === 0;
          const prob = hourly.precipitation_probability[idx];
          const uvValue = hourly.uvIndex ? hourly.uvIndex[idx] : 0;
          const uvInfo = getUVIndexDescription(uvValue);
          const currentTempConverted = Math.round(convertTemp(hourly.temp[idx]));
          
          // Calculate temperature difference compared to previous hour
          let tempDiff = 0;
          if (idx > 0) {
            const prevTempConverted = Math.round(convertTemp(hourly.temp[idx - 1]));
            tempDiff = currentTempConverted - prevTempConverted;
          }
          
          return (
            <div 
              key={time} 
              className={`flex-shrink-0 w-24 glass p-4 rounded-[32px] flex flex-col items-center justify-between gap-3 transition-all hover:bg-white/10 group relative ${isNow ? 'border-blue-400/40 bg-white/10 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'border-white/5'}`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isNow ? 'text-blue-400' : 'text-white/40'}`}>
                  {isNow ? 'Now' : formatTime(time)}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <WeatherIcon code={hourly.weatherCode[idx]} className="text-2xl" />
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold">
                    {currentTempConverted}°
                  </span>
                  
                  {/* Temperature Trend Indicator */}
                  {!isNow && (
                    <div className={`flex items-center gap-0.5 text-[9px] font-black uppercase tracking-tighter transition-all duration-300 ${
                      tempDiff > 0 ? 'text-rose-400' : tempDiff < 0 ? 'text-emerald-400' : 'text-white/20'
                    }`}>
                      {tempDiff > 0 ? (
                        <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 4l-8 8h16l-8-8z" />
                        </svg>
                      ) : tempDiff < 0 ? (
                        <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 20l8-8H4l8 8z" />
                        </svg>
                      ) : (
                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                      )}
                      <span>{tempDiff !== 0 ? `${Math.abs(tempDiff)}°` : 'Stable'}</span>
                    </div>
                  )}
                  {isNow && <div className="h-[13px]" />}
                </div>
              </div>

              {/* Hourly UV Index */}
              <div className="flex flex-col items-center gap-0.5 px-1 py-1 rounded-xl bg-white/5 w-full border border-white/5">
                <span className={`text-[10px] font-black ${uvInfo.color}`}>
                  UV {Math.round(uvValue)}
                </span>
                <span className="text-[7px] font-bold text-white/30 uppercase tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                  {uvInfo.label}
                </span>
              </div>

              {/* Precipitation Indicator */}
              <div className="w-full flex flex-col items-center gap-2 mt-1">
                <div className="w-8 h-10 bg-white/5 rounded-full relative overflow-hidden group-hover:bg-white/10 transition-colors">
                  <div 
                    className={`absolute bottom-0 left-0 w-full bg-blue-500 rounded-full transition-all duration-1000 ${prob > 0 ? 'animate-bar-pulse' : ''}`}
                    style={{ 
                      height: `${Math.max(4, prob)}%`,
                      boxShadow: prob > 0 ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none'
                    }}
                  />
                </div>
                <span className={`text-[9px] font-black tracking-tighter transition-colors ${prob > 0 ? 'text-blue-400' : 'text-white/20'}`}>
                  {prob}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HourlyForecast;
