import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, CloudRain, Wind, Droplets, Sun, Cloud, Calendar, MapPin, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function WeatherDashboard() {
  const [weather, setWeather] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lon: number; name: string }>({
    lat: 20.5937,
    lon: 78.9629,
    name: 'Nagpur (Default)'
  });

  useEffect(() => {
    // Try to get real location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            name: 'Current Location'
          });
        },
        (error) => {
          // Silent fallback for permission denied to avoid console noise
          let msg = "Unknown error";
          if (error) {
            switch(error.code) {
              case 1: 
                console.log("Location permission denied, using default.");
                return; // Exit without toast or warning
              case 2: msg = "Position Unavailable"; break;
              case 3: msg = "Timeout"; break;
              default: msg = error.message || msg;
            }
          }
          console.warn("Geolocation fallback enabled:", msg);
          toast.info("Location access skipped. Using default location (Nagpur).");
        }
      );
    }
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [location.lat, location.lon]);

  const fetchWeather = async () => {
    setLoading(true);
    
    // Use client-side mock data only
    const mockWeather = Array.from({ length: 7 }, (_, i) => ({
      day: new Date(Date.now() + i * 86400000).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
      temp_max: (28 + Math.random() * 8).toFixed(1),
      temp_min: (18 + Math.random() * 6).toFixed(1),
      conditions: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
      humidity: (60 + Math.random() * 20).toFixed(0),
      windSpeed: (5 + Math.random() * 10).toFixed(1),
      rainfall: (Math.random() * 10).toFixed(1)
    }));
    
    setWeather(mockWeather);
    setLoading(false);
  };

  const getWeatherIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('rain')) return <CloudRain className="w-8 h-8 text-blue-400" />;
    if (c.includes('cloud')) return <Cloud className="w-8 h-8 text-gray-400" />;
    if (c.includes('clear') || c.includes('sun')) return <Sun className="w-8 h-8 text-amber-400" />;
    return <Cloud className="w-8 h-8 text-gray-400" />;
  };

  const today = weather[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link to="/" className="text-white hover:bg-white/10 p-2 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Weather Dashboard</h1>
            <div className="flex items-center gap-1 text-xs text-blue-100">
              <MapPin className="w-3 h-3" />
              {location.name}
            </div>
          </div>
          <button 
            onClick={fetchWeather} 
            className="ml-auto p-2 hover:bg-white/10 rounded-full"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-500">Forecasting...</p>
          </div>
        ) : !today ? (
          <div className="text-center py-20 text-gray-500">No weather data available.</div>
        ) : (
          <>
            {/* Today's Highlight */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-blue-100">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white relative">
                <div className="flex justify-between items-start">
                   <div>
                     <p className="text-blue-100 font-medium mb-1">Today, {today.day}</p>
                     <h2 className="text-5xl font-bold mb-2">{today.temp_max}°</h2>
                     <p className="text-xl opacity-90">{today.conditions}</p>
                   </div>
                   <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                      {getWeatherIcon(today.conditions)}
                   </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-1 text-blue-100 text-xs uppercase font-bold">
                      <Wind className="w-3 h-3" /> Wind
                    </div>
                    <p className="font-bold">{today.windSpeed} km/h</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-1 text-blue-100 text-xs uppercase font-bold">
                      <Droplets className="w-3 h-3" /> Humidity
                    </div>
                    <p className="font-bold">{today.humidity}%</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-1 text-blue-100 text-xs uppercase font-bold">
                      <CloudRain className="w-3 h-3" /> Rain
                    </div>
                    <p className="font-bold">{today.rainfall} mm</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 7-Day Forecast */}
            <div>
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" /> 7-Day Forecast
              </h3>
              <div className="space-y-3">
                {weather.slice(1).map((day, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 text-center">
                        <p className="text-xs text-gray-500 font-bold uppercase">{day.day.split(',')[0]}</p>
                      </div>
                      {getWeatherIcon(day.conditions)}
                      <div>
                        <p className="font-bold text-gray-800">{day.conditions}</p>
                        <p className="text-xs text-gray-500">Wind: {day.windSpeed} km/h</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="font-bold text-lg text-gray-800">{day.temp_max}°</p>
                       <p className="text-xs text-gray-400">{day.temp_min}°</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-800">
               ⚠️ Weather forecasts are estimates. Local conditions may vary.
            </div>
          </>
        )}
      </div>
    </div>
  );
}