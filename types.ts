
export interface WeatherData {
  current: {
    temp: number;
    windSpeed: number;
    windDirection: number;
    humidity: number;
    weatherCode: number;
    isDay: boolean;
    time: string;
    aqi?: number;
    aqiLabel?: string;
    uvIndex?: number;
    pollutants?: {
      pm2_5?: number;
      pm10?: number;
      no2?: number;
      so2?: number;
      o3?: number;
      co?: number;
    };
  };
  hourly: {
    time: string[];
    temp: number[];
    weatherCode: number[];
    precipitation_probability: number[];
    aqi?: number[];
    uvIndex?: number[];
  };
  daily: {
    time: string[];
    weatherCode: number[];
    tempMax: number[];
    tempMin: number[];
    sunrise: string[];
    sunset: string[];
    uvIndexMax: number[];
    daylight_duration: number[];
  };
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
  };
}

export interface SavedLocation {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export type TempUnit = 'C' | 'F';
export type WindUnit = 'kmh' | 'mph';

export interface UnitSettings {
  temp: TempUnit;
  wind: WindUnit;
}

export interface SearchResult {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  admin1?: string;
}

export interface AIInsight {
  summary: string;
  smartStatus: string; // Concise, punchy status (e.g. "Perfect Beach Vibe")
  clothing: string[];
  activities: string[];
  vibeScore: number; // 0-100 score of the day's quality
  bestTimeFor: {
    activity: string;
    time: string;
  }[];
}

export interface LocalPlace {
  name: string;
  uri: string;
  type: string;
}

export interface LocalGuide {
  recommendation: string;
  places: LocalPlace[];
}
