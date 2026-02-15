
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WeatherData, SearchResult, AIInsight, LocalGuide, TempUnit, WindUnit, SavedLocation } from './types';
import { getWeatherData, reverseGeocode } from './services/weatherService';
import { getAIWeatherInsights, getLocalGuideRecommendations } from './services/geminiService';
import { WeatherIcon, getWeatherDescription, getAQIDescription, getUVIndexDescription } from './constants';
import SearchInput from './components/SearchInput';
import ForecastList from './components/ForecastList';
import HourlyForecast from './components/HourlyForecast';
import AIInsights from './components/AIInsights';
import LocalGuideSection from './components/LocalGuideSection';
import UnitToggle from './components/UnitToggle';
import WeatherRadar from './components/WeatherRadar';
import SmartPlanner from './components/SmartPlanner';
import SavedLocations from './components/SavedLocations';

const AQISparkline: React.FC<{ data: number[], colorClass: string }> = ({ data, colorClass }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 100);
  const min = 0;
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 100}`).join(' ');

  return (
    <div className="h-4 w-full mt-2 opacity-50 group-hover:opacity-100 transition-opacity overflow-visible">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className={colorClass}
        />
      </svg>
    </div>
  );
};

const App: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [localGuide, setLocalGuide] = useState<LocalGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(false);
  const [guideLoading, setGuideLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unit preferences
  const [tempUnit, setTempUnit] = useState<TempUnit>(() => (localStorage.getItem('tempUnit') as TempUnit) || 'C');
  const [windUnit, setWindUnit] = useState<WindUnit>(() => (localStorage.getItem('windUnit') as WindUnit) || 'kmh');

  // Saved locations
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>(() => {
    const stored = localStorage.getItem('savedLocations');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('tempUnit', tempUnit);
  }, [tempUnit]);

  useEffect(() => {
    localStorage.setItem('windUnit', windUnit);
  }, [windUnit]);

  useEffect(() => {
    localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
  }, [savedLocations]);

  const convertTemp = useCallback((celsius: number) => {
    if (tempUnit === 'F') return (celsius * 9) / 5 + 32;
    return celsius;
  }, [tempUnit]);

  const convertWind = useCallback((kmh: number) => {
    if (windUnit === 'mph') return kmh * 0.621371;
    return kmh;
  }, [windUnit]);

  const fetchWeather = async (lat: number, lon: number, name: string, country: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWeatherData(lat, lon, name, country);
      setWeather(data);
      
      setInsightLoading(true);
      setGuideLoading(true);
      
      const [aiData, guideData] = await Promise.allSettled([
        getAIWeatherInsights(data),
        getLocalGuideRecommendations(data)
      ]);
      
      if (aiData.status === 'fulfilled') setInsight(aiData.value);
      if (guideData.status === 'fulfilled') setLocalGuide(guideData.value);
      
      setInsightLoading(false);
      setGuideLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not fetch weather data. Please try again.');
    } finally {
      setLoading(false);
      setGeoLoading(false);
    }
  };

  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const geoInfo = await reverseGeocode(latitude, longitude);
          await fetchWeather(latitude, longitude, geoInfo.name, geoInfo.country);
        } catch (e) {
          await fetchWeather(latitude, longitude, 'Current Location', '');
        }
      },
      (err) => {
        let msg = 'Location access denied.';
        if (err.code === err.TIMEOUT) msg = 'Location request timed out.';
        if (err.code === err.POSITION_UNAVAILABLE) msg = 'Location information unavailable.';
        
        console.warn(msg, err);
        setError(`${msg} Loading default location...`);
        fetchWeather(51.5074, -0.1278, 'London', 'UK');
        setGeoLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, []);

  useEffect(() => {
    handleGeolocation();
  }, [handleGeolocation]);

  const handleCitySelect = (city: SearchResult) => {
    fetchWeather(city.latitude, city.longitude, city.name, city.country);
  };

  const handleSavedSelect = (loc: SavedLocation) => {
    fetchWeather(loc.lat, loc.lon, loc.name, loc.country);
  };

  const toggleSaveLocation = () => {
    if (!weather) return;
    const locId = `${weather.location.lat.toFixed(4)}-${weather.location.lon.toFixed(4)}`;
    const isSaved = savedLocations.some(l => l.id === locId);

    if (isSaved) {
      setSavedLocations(prev => prev.filter(l => l.id !== locId));
    } else {
      const newLoc: SavedLocation = {
        id: locId,
        name: weather.location.name,
        country: weather.location.country,
        lat: weather.location.lat,
        lon: weather.location.lon
      };
      setSavedLocations(prev => [newLoc, ...prev]);
    }
  };

  const handleRemoveSaved = (id: string) => {
    setSavedLocations(prev => prev.filter(l => l.id !== id));
  };

  const isCurrentSaved = useMemo(() => {
    if (!weather) return false;
    const locId = `${weather.location.lat.toFixed(4)}-${weather.location.lon.toFixed(4)}`;
    return savedLocations.some(l => l.id === locId);
  }, [weather, savedLocations]);

  const handleShare = async () => {
    if (!weather) return;
    const currentTemp = Math.round(convertTemp(weather.current.temp));
    const desc = getWeatherDescription(weather.current.weatherCode);
    const shareText = `Current weather in ${weather.location.name}: ${currentTemp}°${tempUnit}, ${desc}. Detailed outlook provided by SkyCast AI.`;
    
    const shareData: ShareData = {
      title: `SkyCast AI: ${weather.location.name} Weather`,
      text: shareText,
    };

    let currentUrl = window.location.href;
    try {
      const validatedUrl = new URL(currentUrl);
      if (validatedUrl.protocol === 'http:' || validatedUrl.protocol === 'https:') {
        shareData.url = currentUrl;
      }
    } catch (e) {
      console.warn('Current environment URL is invalid for Web Share API, omitting URL field.');
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share not supported');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      try {
        const fallbackText = shareData.url ? `${shareText} ${shareData.url}` : shareText;
        await navigator.clipboard.writeText(fallbackText);
        alert('Weather summary copied to clipboard!');
      } catch (copyErr) {
        console.error('Clipboard fallback failed:', copyErr);
      }
    }
  };

  const getCardGradientClass = (code: number, isDay: boolean) => {
    if (!isDay) return 'card-night';
    if (code === 0) return 'card-sunny';
    if (code <= 3 || (code >= 45 && code <= 48)) return 'card-cloudy';
    if ((code >= 51 && code <= 65) || (code >= 80 && code <= 82)) return 'card-rainy';
    if (code >= 71 && code <= 75) return 'card-snow';
    if (code >= 95) return 'card-thunder';
    return 'glass';
  };

  const isSevere = useMemo(() => {
    if (!weather) return false;
    const code = weather.current.weatherCode;
    return code >= 95 || code === 82 || code === 65 || code === 75;
  }, [weather]);

  const dominantPollutant = useMemo(() => {
    if (!weather?.current.pollutants) return null;
    const p = weather.current.pollutants;
    const candidates = [
      { name: 'PM2.5', val: p.pm2_5 || 0, threshold: 12 },
      { name: 'PM10', val: p.pm10 || 0, threshold: 54 },
      { name: 'O3', val: p.o3 || 0, threshold: 70 },
      { name: 'NO2', val: p.no2 || 0, threshold: 53 },
      { name: 'SO2', val: p.so2 || 0, threshold: 35 },
    ];
    return candidates.reduce((prev, curr) => (curr.val / curr.threshold > prev.val / prev.threshold) ? curr : prev);
  }, [weather]);

  if (loading && !weather) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center p-8">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold mb-2">Reading the skies...</h2>
          <p className="text-white/40 font-medium">Gathering real-time satellite data</p>
        </div>
      </div>
    );
  }

  const aqiInfo = weather?.current.aqi !== undefined ? getAQIDescription(weather.current.aqi) : null;
  const uvInfo = weather?.current.uvIndex !== undefined ? getUVIndexDescription(weather.current.uvIndex) : null;
  const currentLocId = weather ? `${weather.location.lat.toFixed(4)}-${weather.location.lon.toFixed(4)}` : undefined;

  return (
    <div className={`min-h-screen pb-12 transition-colors duration-1000 ${
      !weather ? 'bg-slate-950' : 
      weather.current.weatherCode === 0 ? 'weather-gradient-sunny' : 
      weather.current.weatherCode < 50 ? 'weather-gradient-cloudy' : 'weather-gradient-rainy'
    }`}>
      {/* SEVERE WEATHER BANNER - TOPMOST PRIORITY */}
      {isSevere && weather && (
        <div className="bg-rose-600 text-white px-6 py-4 flex items-center justify-center gap-4 shadow-2xl relative z-50 border-b border-rose-400/50 animate-in slide-in-from-top duration-500 overflow-hidden">
          <div className="absolute inset-0 shimmer-overlay opacity-10 pointer-events-none"></div>
          <span className="text-2xl animate-bounce">⚠️</span>
          <div className="flex flex-col md:flex-row items-center gap-2 text-center md:text-left">
            <span className="font-black uppercase tracking-[0.2em] text-xs">Critical Alert:</span>
            <span className="font-bold text-sm md:text-base">{getWeatherDescription(weather.current.weatherCode)}</span>
          </div>
          <span className="text-2xl animate-bounce hidden md:inline">⚠️</span>
        </div>
      )}

      <nav className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">✨</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SkyCast AI</h1>
        </div>
        
        <div className="flex-1 w-full max-w-md">
          <SearchInput onSelect={handleCitySelect} />
        </div>

        <div className="flex items-center gap-4">
          <UnitToggle 
            tempUnit={tempUnit} 
            windUnit={windUnit} 
            onTempToggle={setTempUnit} 
            onWindToggle={setWindUnit} 
          />
          <button 
            onClick={handleGeolocation}
            disabled={geoLoading}
            className={`glass px-6 py-3 rounded-2xl flex items-center gap-2 transition-all ${geoLoading ? 'opacity-50 cursor-wait' : 'hover:bg-white/10 active:scale-95'}`}
          >
            {geoLoading ? (
               <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
            <span className="font-medium text-sm text-white">Near Me</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 md:px-8 space-y-12">
        {savedLocations.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">Frequent Destinations</h3>
              <span className="text-[10px] text-white/20 font-bold uppercase">{savedLocations.length} Saved</span>
            </div>
            <SavedLocations 
              locations={savedLocations} 
              onSelect={handleSavedSelect} 
              onRemove={handleRemoveSaved}
              currentLocationId={currentLocId}
            />
          </section>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 p-6 rounded-[32px] text-center flex flex-col md:flex-row items-center justify-center gap-4">
            <span className="text-red-200 font-medium">{error}</span>
            <button 
              onClick={() => handleGeolocation()} 
              className="px-4 py-2 bg-red-500/30 hover:bg-red-500/40 rounded-xl text-sm font-bold transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {weather && (
          <>
            <section className="grid lg:grid-cols-12 gap-8">
              <div className={`lg:col-span-8 p-10 rounded-[40px] relative overflow-hidden flex flex-col justify-between min-h-[400px] backdrop-blur-xl transition-all duration-1000 ${getCardGradientClass(weather.current.weatherCode, weather.current.isDay)} shadow-2xl group/card`}>
                {/* HUD Overlay Buttons */}
                <div className="absolute top-10 right-10 z-20 flex flex-col gap-4">
                  <button 
                    onClick={handleShare}
                    className="glass p-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 transition-all shadow-xl"
                    title="Share weather outlook"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                  <button 
                    onClick={toggleSaveLocation}
                    className={`glass p-3 rounded-2xl transition-all hover:scale-110 active:scale-95 shadow-xl ${isCurrentSaved ? 'text-yellow-400 bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    title={isCurrentSaved ? "Remove from favorites" : "Add to favorites"}
                  >
                    <svg className="w-6 h-6" fill={isCurrentSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                </div>

                <div className="relative z-10 flex justify-between items-start">
                  <div className="max-w-[70%]">
                    <div className="flex items-center gap-3 mb-2">
                       <h2 className="text-4xl md:text-6xl font-bold drop-shadow-sm">{weather.location.name}</h2>
                       <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg">
                          <span className="text-[10px] font-black text-white uppercase tracking-tighter">Live</span>
                       </div>
                    </div>
                    <p className="text-white/70 text-lg md:text-xl font-medium">{weather.location.country}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <p className="text-white/50 text-sm font-mono">{weather.location.lat.toFixed(2)}°N, {weather.location.lon.toFixed(2)}°E</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <WeatherIcon code={weather.current.weatherCode} className="text-7xl md:text-8xl inline-block drop-shadow-md" />
                     <p className="text-xl md:text-2xl font-medium mt-2 drop-shadow-sm">{getWeatherDescription(weather.current.weatherCode)}</p>
                  </div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-end md:items-center justify-between mt-12 gap-8">
                  <div className="flex items-start drop-shadow-xl">
                    <span className="text-8xl md:text-9xl font-bold tracking-tighter">{Math.round(convertTemp(weather.current.temp))}</span>
                    <span className="text-4xl md:text-5xl font-light mt-4">°{tempUnit}</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full md:w-auto">
                    <div className="flex flex-col">
                      <span className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Humidity</span>
                      <span className="text-2xl font-bold">{weather.current.humidity}%</span>
                    </div>
                    <div className="flex flex-col relative group cursor-help">
                      <span className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Wind</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{Math.round(convertWind(weather.current.windSpeed))} {windUnit === 'kmh' ? 'km/h' : 'mph'}</span>
                        <div 
                          className="w-5 h-5 flex items-center justify-center"
                          style={{ transform: `rotate(${weather.current.windDirection}deg)` }}
                        >
                          <svg className="w-full h-full text-white/70" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" />
                          </svg>
                        </div>
                      </div>
                      
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 glass px-4 py-3 rounded-2xl w-max shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-20 border border-white/20 text-center">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.15em] block mb-1">Direction</span>
                        <span className="text-sm font-bold text-white whitespace-nowrap">{weather.current.windDirection}° Degrees</span>
                      </div>
                    </div>
                    <div className="flex flex-col relative group cursor-help">
                      <span className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Air Quality</span>
                      <span className={`text-2xl font-bold ${aqiInfo?.color || 'text-white'}`}>
                        {weather.current.aqi}
                      </span>
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-bold uppercase tracking-tight ${aqiInfo?.color || 'text-white/60'}`}>
                          {aqiInfo?.label || 'N/A'}
                        </span>
                        {dominantPollutant && (
                          <span className="text-[9px] text-white/30 font-medium uppercase mt-0.5">
                            Primary: {dominantPollutant.name}
                          </span>
                        )}
                      </div>
                      {/* AQI Trend Chart */}
                      {weather.hourly.aqi && (
                        <AQISparkline data={weather.hourly.aqi} colorClass={aqiInfo?.color || 'text-white'} />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">UV Index</span>
                      <span className={`text-2xl font-bold ${uvInfo?.color || 'text-white'}`}>
                        {Math.round(weather.current.uvIndex || 0)}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-tight ${uvInfo?.color || 'text-white/60'}`}>
                        {uvInfo?.label || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-8">
                {insight && <AIInsights insight={insight} loading={insightLoading} />}
                
                <div className="glass p-8 rounded-[40px] flex-1">
                  <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-8">Astro & Atmosphere</h3>
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-500 border border-yellow-500/20">☀️</div>
                        <div>
                          <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">Sunrise</p>
                          <p className="text-base font-bold">{new Date(weather.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500 border border-orange-500/20">🌙</div>
                        <div>
                          <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">Sunset</p>
                          <p className="text-base font-bold">{new Date(weather.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    </div>
                    <div className="h-px bg-white/5 w-full" />
                    <div className="flex flex-col gap-4">
                       <div className="flex justify-between items-center">
                          <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Daylight Hours</span>
                          <span className="text-white font-bold">{(weather.daily.daylight_duration[0] / 3600).toFixed(1)}h</span>
                       </div>
                       <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                          <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${(weather.daily.daylight_duration[0] / 86400) * 100}%` }}></div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-xl font-bold">Smart Outlook</h3>
                  </div>
                  <SmartPlanner hourly={weather.hourly} />
               </div>
               <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-xl font-bold">Interactive Radar</h3>
                  </div>
                  <WeatherRadar lat={weather.location.lat} lon={weather.location.lon} />
               </div>
            </section>

            {localGuide && (
              <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-bold">Nearby Discoveries</h3>
                </div>
                <LocalGuideSection guide={localGuide} loading={guideLoading} />
              </section>
            )}

            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-bold">24-Hour Outlook</h3>
              </div>
              <HourlyForecast hourly={weather.hourly} tempUnit={tempUnit} convertTemp={convertTemp} />
            </section>

            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-bold">7-Day Forecast</h3>
                <span className="text-blue-400 text-sm font-medium hover:underline cursor-pointer">Detailed View</span>
              </div>
              <ForecastList daily={weather.daily} tempUnit={tempUnit} convertTemp={convertTemp} />
            </section>
          </>
        )}
      </main>

      <footer className="mt-20 text-center text-white/20 text-xs font-medium uppercase tracking-[0.2em]">
        SkyCast AI • Built for Professionals • Powered by Gemini & Open-Meteo • Designed by Karthik Chowdary
      </footer>
    </div>
  );
};

export default App;
