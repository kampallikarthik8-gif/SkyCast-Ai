
import { WeatherData, SearchResult } from '../types';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const AQI_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

export const searchCities = async (query: string): Promise<SearchResult[]> => {
  try {
    const res = await fetch(`${GEO_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    return [];
  }
};

export const reverseGeocode = async (lat: number, lon: number): Promise<{ name: string; country: string }> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en'
      }
    });
    
    if (!res.ok) throw new Error('Geocoding service unavailable');
    
    const data = await res.json();
    const address = data.address || {};
    
    const name = address.city || 
                 address.town || 
                 address.village || 
                 address.municipality || 
                 address.suburb || 
                 address.neighbourhood || 
                 address.county || 
                 'Current Location';
                 
    const country = address.country || '';
    
    return { name, country };
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return { name: 'Current Location', country: '' };
  }
};

export const getWeatherData = async (lat: number, lon: number, name: string, country: string): Promise<WeatherData> => {
  const weatherParams = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: 'temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m,wind_direction_10m,uv_index',
    hourly: 'temperature_2m,weather_code,precipitation_probability,uv_index',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,daylight_duration',
    timezone: 'auto',
    forecast_days: '7'
  });

  const aqiParams = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: 'us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone',
    hourly: 'us_aqi'
  });

  const [weatherRes, aqiRes] = await Promise.all([
    fetch(`${BASE_URL}?${weatherParams.toString()}`),
    fetch(`${AQI_URL}?${aqiParams.toString()}`)
  ]);

  if (!weatherRes.ok) {
    const errorText = await weatherRes.text();
    throw new Error(`Weather API error: ${weatherRes.status} ${errorText}`);
  }
  
  const weatherData = await weatherRes.json();
  const aqiData = aqiRes.ok ? await aqiRes.json() : null;

  const now = new Date();
  let currentIndex = weatherData.hourly.time.findIndex((t: string) => new Date(t) >= now);
  if (currentIndex === -1) currentIndex = 0;

  const hourlySlice = {
    time: weatherData.hourly.time.slice(currentIndex, currentIndex + 24),
    temp: weatherData.hourly.temperature_2m.slice(currentIndex, currentIndex + 24),
    weatherCode: weatherData.hourly.weather_code.slice(currentIndex, currentIndex + 24),
    precipitation_probability: weatherData.hourly.precipitation_probability.slice(currentIndex, currentIndex + 24),
    uvIndex: weatherData.hourly.uv_index.slice(currentIndex, currentIndex + 24),
    aqi: aqiData?.hourly?.us_aqi?.slice(currentIndex, currentIndex + 24)
  };

  return {
    current: {
      temp: weatherData.current.temperature_2m,
      windSpeed: weatherData.current.wind_speed_10m,
      windDirection: weatherData.current.wind_direction_10m,
      humidity: weatherData.current.relative_humidity_2m,
      weatherCode: weatherData.current.weather_code,
      isDay: weatherData.current.is_day === 1,
      time: weatherData.current.time,
      uvIndex: weatherData.current.uv_index,
      aqi: aqiData?.current?.us_aqi,
      pollutants: aqiData ? {
        pm2_5: aqiData.current.pm2_5,
        pm10: aqiData.current.pm10,
        no2: aqiData.current.nitrogen_dioxide,
        so2: aqiData.current.sulphur_dioxide,
        o3: aqiData.current.ozone,
        co: aqiData.current.carbon_monoxide,
      } : undefined
    },
    hourly: hourlySlice,
    daily: {
      time: weatherData.daily.time,
      weatherCode: weatherData.daily.weather_code,
      tempMax: weatherData.daily.temperature_2m_max,
      tempMin: weatherData.daily.temperature_2m_min,
      sunrise: weatherData.daily.sunrise,
      sunset: weatherData.daily.sunset,
      uvIndexMax: weatherData.daily.uv_index_max,
      daylight_duration: weatherData.daily.daylight_duration,
    },
    location: { name, country, lat, lon }
  };
};
