/// <reference types="vite/client" />
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

// Initialize Gemini for fallback
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface WeatherData {
  city: string;
  country: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  sunrise: number;
  sunset: number;
  condition: string;
  description: string;
  icon: string;
  dt: number;
  timezone: number;
  isSimulated?: boolean;
}

export interface ForecastItem {
  dt: number;
  temp: number;
  condition: string;
  icon: string;
  description: string;
}

export interface Suggestion {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

export const weatherService = {
  async fetchWeather(city: string, units: 'metric' | 'imperial' = 'metric'): Promise<WeatherData> {
    if (!API_KEY) return this.simulateWeather(city, units);

    try {
      const response = await fetch(`${BASE_URL}/weather?q=${city}&units=${units}&appid=${API_KEY}`);
      if (!response.ok) throw new Error('City not found');
      const data = await response.json();
      return this.mapWeatherData(data);
    } catch (error) {
      console.warn('Falling back to simulation:', error);
      return this.simulateWeather(city, units);
    }
  },

  async fetchWeatherByCoords(lat: number, lon: number, units: 'metric' | 'imperial' = 'metric'): Promise<WeatherData> {
    if (!API_KEY) return this.simulateWeather('Current Location', units);

    try {
      const response = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`);
      if (!response.ok) throw new Error('Location not found');
      const data = await response.json();
      return this.mapWeatherData(data);
    } catch (error) {
      return this.simulateWeather('Current Location', units);
    }
  },

  mapWeatherData(data: any): WeatherData {
    return {
      city: data.name,
      country: data.sys.country,
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      pressure: data.main.pressure,
      visibility: data.visibility / 1000, // km
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      dt: data.dt,
      timezone: data.timezone,
    };
  },

  async fetchForecast(city: string, units: 'metric' | 'imperial' = 'metric'): Promise<{ hourly: ForecastItem[], daily: ForecastItem[] }> {
    if (!API_KEY) return this.simulateForecast(city, units);

    try {
      const response = await fetch(`${BASE_URL}/forecast?q=${city}&units=${units}&appid=${API_KEY}`);
      if (!response.ok) throw new Error('Forecast failed');
      const data = await response.json();
      
      const hourly = data.list.slice(0, 8).map((item: any) => ({
        dt: item.dt,
        temp: Math.round(item.main.temp),
        condition: item.weather[0].main,
        icon: item.weather[0].icon,
        description: item.weather[0].description,
      }));

      const daily = data.list
        .filter((_: any, index: number) => index % 8 === 0)
        .map((item: any) => ({
          dt: item.dt,
          temp: Math.round(item.main.temp),
          condition: item.weather[0].main,
          icon: item.weather[0].icon,
          description: item.weather[0].description,
        }));

      return { hourly, daily };
    } catch (error) {
      return this.simulateForecast(city, units);
    }
  },

  async fetchSuggestions(query: string): Promise<Suggestion[]> {
    if (!API_KEY || query.length < 3) return [];
    try {
      const response = await fetch(`${GEO_URL}/direct?q=${query}&limit=5&appid=${API_KEY}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      return [];
    }
  },

  async simulateWeather(city: string, units: 'metric' | 'imperial'): Promise<WeatherData> {
    const prompt = `Generate realistic current weather data for ${city} in ${units} units. 
    Return JSON: { country: string, temp: number, feelsLike: number, humidity: number, windSpeed: number, pressure: number, visibility: number, sunrise: number, sunset: number, condition: string, description: string, icon: string }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            country: { type: Type.STRING },
            temp: { type: Type.NUMBER },
            feelsLike: { type: Type.NUMBER },
            humidity: { type: Type.NUMBER },
            windSpeed: { type: Type.NUMBER },
            pressure: { type: Type.NUMBER },
            visibility: { type: Type.NUMBER },
            sunrise: { type: Type.NUMBER },
            sunset: { type: Type.NUMBER },
            condition: { type: Type.STRING },
            description: { type: Type.STRING },
            icon: { type: Type.STRING },
          },
          required: ["temp", "condition", "icon"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return {
      ...data,
      city,
      dt: Math.floor(Date.now() / 1000),
      timezone: 0,
      isSimulated: true
    };
  },

  async simulateForecast(city: string, units: 'metric' | 'imperial'): Promise<{ hourly: ForecastItem[], daily: ForecastItem[] }> {
    const prompt = `Generate realistic 24h hourly (8 items) and 7-day daily (7 items) forecast for ${city} in ${units} units. 
    Return JSON: { hourly: Array<{temp: number, condition: string, icon: string, description: string}>, daily: Array<{temp: number, condition: string, icon: string, description: string}> }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hourly: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { temp: { type: Type.NUMBER }, condition: { type: Type.STRING }, icon: { type: Type.STRING }, description: { type: Type.STRING } } } },
            daily: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { temp: { type: Type.NUMBER }, condition: { type: Type.STRING }, icon: { type: Type.STRING }, description: { type: Type.STRING } } } },
          }
        }
      }
    });

    const data = JSON.parse(response.text);
    const now = Math.floor(Date.now() / 1000);
    
    return {
      hourly: data.hourly.map((item: any, i: number) => ({ ...item, dt: now + (i * 3600 * 3) })),
      daily: data.daily.map((item: any, i: number) => ({ ...item, dt: now + (i * 86400) }))
    };
  },

  getIconUrl(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
  }
};
