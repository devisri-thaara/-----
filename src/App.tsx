import { 
  AlertCircle, 
  CloudRain, 
  Compass, 
  Droplets, 
  Eye, 
  Gauge, 
  Loader2, 
  MapPin, 
  Navigation, 
  Search, 
  Sunrise, 
  Sunset, 
  Thermometer, 
  Wind,
  Calendar,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { ForecastItem, Suggestion, WeatherData, weatherService } from './services/weatherService';
import { WeatherBackground } from './components/WeatherBackground';
import { WeatherEffects } from './components/WeatherEffects';
import { WeatherChart } from './components/WeatherChart';
import { UnitsToggle } from './components/UnitsToggle';

const STORAGE_KEY = 'weather_pro_max_city';

export default function App() {
  const [city, setCity] = useState(() => localStorage.getItem(STORAGE_KEY) || 'New York');
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [hourly, setHourly] = useState<ForecastItem[]>([]);
  const [daily, setDaily] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async (searchCity: string, currentUnit: 'metric' | 'imperial') => {
    setLoading(true);
    setError(null);
    try {
      const [weatherData, forecastData] = await Promise.all([
        weatherService.fetchWeather(searchCity, currentUnit),
        weatherService.fetchForecast(searchCity, currentUnit)
      ]);
      setWeather(weatherData);
      setHourly(forecastData.hourly);
      setDaily(forecastData.daily);
      localStorage.setItem(STORAGE_KEY, searchCity);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchByCoords = useCallback(async (lat: number, lon: number, currentUnit: 'metric' | 'imperial') => {
    setLoading(true);
    setError(null);
    try {
      const weatherData = await weatherService.fetchWeatherByCoords(lat, lon, currentUnit);
      setWeather(weatherData);
      const forecastData = await weatherService.fetchForecast(weatherData.city, currentUnit);
      setHourly(forecastData.hourly);
      setDaily(forecastData.daily);
      setCity(weatherData.city);
      localStorage.setItem(STORAGE_KEY, weatherData.city);
    } catch (err) {
      setError('Could not get weather for your location');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation && !localStorage.getItem(STORAGE_KEY)) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchByCoords(pos.coords.latitude, pos.coords.longitude, unit),
        () => fetchData(city, unit)
      );
    } else {
      fetchData(city, unit);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        const results = await weatherService.fetchSuggestions(searchQuery);
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (s: Suggestion) => {
    setCity(s.name);
    fetchData(s.name, unit);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleUnitChange = (newUnit: 'metric' | 'imperial') => {
    setUnit(newUnit);
    fetchData(city, newUnit);
  };

  const tempUnit = unit === 'metric' ? '°C' : '°F';
  const windUnit = unit === 'metric' ? 'm/s' : 'mph';

  return (
    <div className="min-h-screen text-white selection:bg-blue-500/30 overflow-x-hidden">
      <WeatherBackground condition={weather?.condition} />
      <WeatherEffects condition={weather?.condition} />
      
      <main className="container mx-auto px-4 py-6 md:py-10 max-w-6xl">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30">
              <Navigation className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Weather Pro Max</h1>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">
                {format(new Date(), 'EEEE, MMM do')}
              </p>
            </div>
          </motion.div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div ref={searchRef} className="relative flex-grow md:w-80">
              <div className="relative group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city..."
                  className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all group-hover:bg-white/15"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              </div>
              
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 glass-dark rounded-2xl overflow-hidden z-50 border border-white/10"
                  >
                    {suggestions.map((s, i) => (
                      <button
                        key={`${s.lat}-${s.lon}-${i}`}
                        onClick={() => handleSuggestionClick(s)}
                        className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0"
                      >
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="text-sm font-medium">{s.name}</p>
                          <p className="text-[10px] text-white/40 uppercase tracking-wider">{s.state ? `${s.state}, ` : ''}{s.country}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <UnitsToggle unit={unit} onChange={handleUnitChange} />
          </div>
        </header>

        <AnimatePresence mode="wait">
          {loading && !weather ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
              <p className="text-white/60 font-medium animate-pulse">Analyzing atmosphere...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-dark p-10 rounded-[2.5rem] border-red-500/20 flex flex-col items-center text-center mx-auto max-w-md"
            >
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Connection Interrupted</h3>
              <p className="text-white/60 mb-6">{error}</p>
              <button
                onClick={() => fetchData(city, unit)}
                className="px-8 py-3 bg-blue-500 hover:bg-blue-400 rounded-2xl transition-all font-bold shadow-lg shadow-blue-500/20"
              >
                Retry Connection
              </button>
            </motion.div>
          ) : weather ? (
            <motion.div
              key="weather-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Main Card */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="glass p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Compass className="w-40 h-40 animate-spin-slow" />
                  </div>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">{weather.city}</h2>
                        <span className="px-2 py-1 bg-white/10 rounded-lg text-xs font-bold text-white/60">{weather.country}</span>
                      </div>
                      <p className="text-white/60 text-lg font-medium capitalize mb-6">{weather.description}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-8xl md:text-9xl font-bold tracking-tighter leading-none">
                          {weather.temp}
                        </span>
                        <span className="text-4xl md:text-5xl font-light text-white/40">{tempUnit}</span>
                      </div>
                    </div>
                    
                    <motion.div
                      animate={{ y: [0, -15, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                      className="relative"
                    >
                      <img 
                        src={weatherService.getIconUrl(weather.icon)} 
                        alt={weather.condition}
                        className="w-48 h-48 md:w-64 md:h-64 drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                  </div>

                  {weather.isSimulated && (
                    <div className="mt-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-400/60 bg-blue-400/5 px-4 py-2 rounded-full w-fit">
                      <AlertCircle className="w-3 h-3" />
                      Simulated Environment
                    </div>
                  )}
                </div>

                {/* Hourly Forecast */}
                <div className="glass p-8 rounded-[2.5rem]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-400" />
                      Hourly Forecast
                    </h3>
                  </div>
                  <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar snap-x">
                    {hourly.map((item, i) => (
                      <div key={item.dt} className="flex-shrink-0 flex flex-col items-center gap-2 snap-start min-w-[80px]">
                        <span className="text-xs font-bold text-white/40 uppercase">
                          {i === 0 ? 'Now' : format(new Date(item.dt * 1000), 'ha')}
                        </span>
                        <img 
                          src={weatherService.getIconUrl(item.icon)} 
                          alt={item.condition}
                          className="w-12 h-12"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-lg font-bold">{item.temp}°</span>
                      </div>
                    ))}
                  </div>
                  <WeatherChart data={hourly} unit={unit} />
                </div>
              </div>

              {/* Sidebar: Details & Daily */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <DetailCard icon={<Wind className="text-blue-400" />} label="Wind" value={`${weather.windSpeed} ${windUnit}`} />
                  <DetailCard icon={<Droplets className="text-cyan-400" />} label="Humidity" value={`${weather.humidity}%`} />
                  <DetailCard icon={<Gauge className="text-purple-400" />} label="Pressure" value={`${weather.pressure} hPa`} />
                  <DetailCard icon={<Eye className="text-emerald-400" />} label="Visibility" value={`${weather.visibility} km`} />
                  <DetailCard icon={<Sunrise className="text-orange-400" />} label="Sunrise" value={format(new Date(weather.sunrise * 1000), 'p')} />
                  <DetailCard icon={<Sunset className="text-rose-400" />} label="Sunset" value={format(new Date(weather.sunset * 1000), 'p')} />
                </div>

                {/* 7-Day Forecast */}
                <div className="glass p-8 rounded-[2.5rem] flex-grow">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    7-Day Forecast
                  </h3>
                  <div className="flex flex-col gap-4">
                    {daily.map((item, i) => (
                      <div key={item.dt} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors">
                        <span className="w-12 text-sm font-bold text-white/60">
                          {i === 0 ? 'Today' : format(new Date(item.dt * 1000), 'EEE')}
                        </span>
                        <div className="flex items-center gap-3">
                          <img 
                            src={weatherService.getIconUrl(item.icon)} 
                            alt={item.condition}
                            className="w-10 h-10"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-xs font-medium text-white/40 capitalize hidden sm:inline">{item.description}</span>
                        </div>
                        <div className="flex items-center gap-3 w-16 justify-end">
                          <span className="text-base font-bold">{item.temp}°</span>
                          <span className="text-xs font-bold text-white/20">{Math.round(item.temp - 5)}°</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <footer className="mt-12 py-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">
          <p>© 2026 Weather Pro Max • Engineered for Precision</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">API Reference</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </footer>
      </main>
    </div>
  );
}

function DetailCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="glass p-5 rounded-3xl flex flex-col gap-3 hover:bg-white/15 transition-all group">
      <div className="p-2 bg-white/5 rounded-xl w-fit group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}
