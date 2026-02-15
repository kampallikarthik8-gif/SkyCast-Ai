
import { GoogleGenAI, Type } from "@google/genai";
import { WeatherData, AIInsight, LocalGuide, LocalPlace } from "../types";
import { getWeatherDescription } from "../constants";

export const getAIWeatherInsights = async (weather: WeatherData): Promise<AIInsight> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const description = getWeatherDescription(weather.current.weatherCode);
  const prompt = `
    Analyze this weather data for ${weather.location.name}:
    - Current Condition: ${description}
    - Temperature: ${weather.current.temp}°C
    - Wind: ${weather.current.windSpeed} km/h
    - Humidity: ${weather.current.humidity}%
    - UV Index: ${weather.current.uvIndex}
    - 24-Hour Forecast Summary: ${weather.hourly.temp.join(', ')} (temps)
    
    Task:
    1. Provide a witty, concise summary of the overall outlook.
    2. Provide a "Smart Status" - a punchy, personalized 2-4 word alternative to standard weather descriptions (e.g., instead of "Partly Cloudy", use "Shifty Sun & Shadows" or "Crisp Morning Glow").
    3. Suggest clothing.
    4. List 3 activities.
    5. Calculate a "Vibe Score" (0-100) based on how perfect the weather is for human happiness (100 is 22°C, sunny, low wind).
    6. Look at the next 24 hours and suggest the "Best Time" for 3 specific activities (e.g., "Photography", "Running", "Stargazing").
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          smartStatus: { type: Type.STRING },
          clothing: { type: Type.ARRAY, items: { type: Type.STRING } },
          activities: { type: Type.ARRAY, items: { type: Type.STRING } },
          vibeScore: { type: Type.NUMBER },
          bestTimeFor: { 
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                activity: { type: Type.STRING },
                time: { type: Type.STRING }
              },
              required: ["activity", "time"]
            }
          }
        },
        required: ["summary", "smartStatus", "clothing", "activities", "vibeScore", "bestTimeFor"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}") as AIInsight;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return {
      summary: "Weather data looks interesting today!",
      smartStatus: description,
      clothing: ["Comfortable layers"],
      activities: ["Check the forecast again later"],
      vibeScore: 70,
      bestTimeFor: [{ activity: "Walking", time: "Now" }]
    };
  }
};

export const getLocalGuideRecommendations = async (weather: WeatherData): Promise<LocalGuide> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const description = getWeatherDescription(weather.current.weatherCode);
  
  const prompt = `Based on the current ${description} weather at ${weather.location.lat}, ${weather.location.lon}, recommend 3 specific real-world places (parks if sunny, cafes/museums if rainy) nearby that people should visit right now. Explain why for each.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite-latest",
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: weather.location.lat,
            longitude: weather.location.lon
          }
        }
      }
    },
  });

  const places: LocalPlace[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  chunks.forEach((chunk: any) => {
    if (chunk.maps) {
      places.push({
        name: chunk.maps.title || 'Interesting Spot',
        uri: chunk.maps.uri,
        type: 'Place'
      });
    }
  });

  return {
    recommendation: response.text || "Explore your local surroundings!",
    places: places.slice(0, 3)
  };
};
