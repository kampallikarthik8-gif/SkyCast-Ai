
import React from 'react';

export const getWeatherDescription = (code: number): string => {
  const codes: Record<number, string> = {
    0: 'Pristine clear skies with maximum sun exposure',
    1: 'Mostly clear with occasional thin cloud veils',
    2: 'Partly cloudy with pleasant sunny intervals',
    3: 'Completely overcast with uniform cloud cover',
    45: 'Foggy conditions with significantly reduced visibility',
    48: 'Freezing fog with potential for ice accumulation',
    51: 'Light, misty drizzle; minimal accumulation expected',
    53: 'Moderate drizzle creating damp and cool conditions',
    55: 'Dense, soaking drizzle with low visibility',
    56: 'Light freezing drizzle; watch for slick surfaces',
    57: 'Heavy freezing drizzle with hazardous icy conditions',
    61: 'Slight intermittent rain showers throughout the day',
    63: 'Consistent moderate rainfall with damp conditions',
    65: 'Heavy, intense rain; localized flooding possible',
    66: 'Light freezing rain with immediate ice formation',
    67: 'Heavy freezing rain; severe icing hazard expected',
    71: 'Light snow flurries with minimal accumulation',
    73: 'Steady moderate snowfall; visibility may be reduced',
    75: 'Heavy snow accumulation with blizzard conditions',
    77: 'Snow grains falling; small opaque ice particles',
    80: 'Light rain showers with brief periods of clearing',
    81: 'Periodic moderate rain showers; keep an umbrella handy',
    82: 'Violent, torrential rain showers with high intensity',
    85: 'Slight snow showers; brief periods of accumulation',
    86: 'Heavy snow showers with rapid accumulation',
    95: 'Thunderstorms with moderate rain and lightning',
    96: 'Thunderstorms with light hail and wind gusts',
    99: 'Severe thunderstorms with heavy rain and large hail',
  };
  return codes[code] || 'Atmospheric conditions are varied and evolving';
};

export const getAQIDescription = (aqi: number): { label: string; color: string } => {
  if (aqi <= 50) return { label: 'Good', color: 'text-green-400' };
  if (aqi <= 100) return { label: 'Moderate', color: 'text-yellow-400' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive Groups', color: 'text-orange-400' };
  if (aqi <= 200) return { label: 'Unhealthy', color: 'text-red-400' };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: 'text-purple-400' };
  return { label: 'Hazardous', color: 'text-rose-600' };
};

export const getUVIndexDescription = (uv: number): { label: string; color: string } => {
  if (uv <= 2) return { label: 'Low', color: 'text-green-400' };
  if (uv <= 5) return { label: 'Moderate', color: 'text-yellow-400' };
  if (uv <= 7) return { label: 'High', color: 'text-orange-400' };
  if (uv <= 10) return { label: 'Very High', color: 'text-red-400' };
  return { label: 'Extreme', color: 'text-purple-400' };
};

export const WeatherIcon = ({ code, className = "" }: { code: number, className?: string }) => {
  const baseClass = "inline-block transform-gpu origin-center";
  
  if (code === 0) {
    return <span className={`${baseClass} animate-sun ${className}`}>☀️</span>;
  }
  if (code <= 3) {
    return <span className={`${baseClass} animate-cloud ${className}`}>⛅</span>;
  }
  if (code <= 48) {
    return <span className={`${baseClass} animate-fog ${className}`}>🌫️</span>;
  }
  if (code <= 65) {
    return <span className={`${baseClass} animate-rain ${className}`}>🌧️</span>;
  }
  if (code <= 75) {
    return <span className={`${baseClass} animate-snow ${className}`}>❄️</span>;
  }
  if (code <= 82) {
    return <span className={`${baseClass} animate-rain ${className}`}>🌦️</span>;
  }
  return <span className={`${baseClass} animate-thunder ${className}`}>⚡</span>;
};
