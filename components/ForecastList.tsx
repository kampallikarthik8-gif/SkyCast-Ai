
import React from 'react';
import { WeatherData, TempUnit } from '../types';
import { WeatherIcon, getWeatherDescription } from '../constants';

interface ForecastListProps {
  daily: WeatherData['daily'];
  tempUnit: TempUnit;
  convertTemp: (c: number) => number;
}

const ForecastList: React.FC<ForecastListProps> = ({ daily, tempUnit, convertTemp }) => {
  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {daily.time.map((time, idx) => (
        <div key={time} className="glass p-5 rounded-[32px] flex flex-col items-center text-center transition-all duration-300 hover:bg-white/10 hover:translate-y-[-6px] group border border-white/5 hover:border-blue-400/20">
          <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-3 group-hover:text-blue-400 transition-colors">
            {getDayName(time)}
          </span>
          
          <div className="bg-white/5 rounded-2xl p-3 mb-4 group-hover:bg-blue-400/10 transition-colors">
            <WeatherIcon code={daily.weatherCode[idx]} className="text-4xl transform group-hover:scale-110 transition-transform duration-500" />
          </div>
          
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold tracking-tighter">{Math.round(convertTemp(daily.tempMax[idx]))}°</span>
            <span className="text-white/30 text-sm font-medium tracking-tight">{Math.round(convertTemp(daily.tempMin[idx]))}°</span>
          </div>

          <div className="flex-grow flex items-center justify-center">
            <p className="text-[11px] leading-snug text-white/70 font-semibold px-2 italic group-hover:text-white transition-colors">
              {getWeatherDescription(daily.weatherCode[idx])}
            </p>
          </div>
          
          <div className="mt-5 pt-3 border-t border-white/5 w-full">
            <div className="flex justify-between items-center text-[9px] text-white/30 uppercase font-black tracking-widest">
              <span>UV {Math.round(daily.uvIndexMax[idx])}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${daily.uvIndexMax[idx] > 7 ? 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]' : daily.uvIndexMax[idx] > 3 ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ForecastList;
