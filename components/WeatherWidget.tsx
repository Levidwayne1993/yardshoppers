// ============================================================
// PASTE INTO: components/WeatherWidget.tsx
// ============================================================
"use client";

import { useEffect, useState } from "react";

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  high: number;
  low: number;
  precipChance: number;
}

interface Props {
  lat?: number | null;
  lng?: number | null;
  city?: string;
  state?: string;
}

// WMO Weather interpretation codes → icon + label
function getWeatherInfo(code: number, isDay: boolean) {
  const map: Record<number, { icon: string; label: string; bg: string }> = {
    0:  { icon: isDay ? "fa-sun" : "fa-moon",               label: "Clear sky",        bg: isDay ? "from-sky-400 to-blue-500"    : "from-indigo-800 to-slate-900" },
    1:  { icon: isDay ? "fa-sun" : "fa-moon",               label: "Mainly clear",     bg: isDay ? "from-sky-400 to-blue-500"    : "from-indigo-800 to-slate-900" },
    2:  { icon: "fa-cloud-sun",                              label: "Partly cloudy",    bg: isDay ? "from-sky-300 to-blue-400"    : "from-indigo-700 to-slate-800" },
    3:  { icon: "fa-cloud",                                  label: "Overcast",         bg: "from-gray-400 to-gray-500" },
    45: { icon: "fa-smog",                                   label: "Foggy",            bg: "from-gray-300 to-gray-400" },
    48: { icon: "fa-smog",                                   label: "Icy fog",          bg: "from-gray-300 to-gray-400" },
    51: { icon: "fa-cloud-rain",                             label: "Light drizzle",    bg: "from-gray-400 to-blue-400" },
    53: { icon: "fa-cloud-rain",                             label: "Drizzle",          bg: "from-gray-400 to-blue-400" },
    55: { icon: "fa-cloud-rain",                             label: "Heavy drizzle",    bg: "from-gray-500 to-blue-500" },
    61: { icon: "fa-cloud-showers-heavy",                    label: "Light rain",       bg: "from-blue-400 to-blue-600" },
    63: { icon: "fa-cloud-showers-heavy",                    label: "Rain",             bg: "from-blue-500 to-blue-700" },
    65: { icon: "fa-cloud-showers-heavy",                    label: "Heavy rain",       bg: "from-blue-600 to-blue-800" },
    71: { icon: "fa-snowflake",                              label: "Light snow",       bg: "from-blue-100 to-blue-300" },
    73: { icon: "fa-snowflake",                              label: "Snow",             bg: "from-blue-200 to-blue-400" },
    75: { icon: "fa-snowflake",                              label: "Heavy snow",       bg: "from-blue-300 to-blue-500" },
    77: { icon: "fa-snowflake",                              label: "Snow grains",      bg: "from-blue-200 to-blue-400" },
    80: { icon: "fa-cloud-showers-heavy",                    label: "Rain showers",     bg: "from-blue-400 to-blue-600" },
    81: { icon: "fa-cloud-showers-heavy",                    label: "Heavy showers",    bg: "from-blue-500 to-blue-700" },
    82: { icon: "fa-cloud-showers-heavy",                    label: "Violent showers",  bg: "from-blue-600 to-blue-800" },
    85: { icon: "fa-snowflake",                              label: "Snow showers",     bg: "from-blue-200 to-blue-400" },
    86: { icon: "fa-snowflake",                              label: "Heavy snow showers", bg: "from-blue-300 to-blue-500" },
    95: { icon: "fa-bolt",                                   label: "Thunderstorm",     bg: "from-gray-600 to-purple-700" },
    96: { icon: "fa-bolt",                                   label: "Thunderstorm + hail", bg: "from-gray-700 to-purple-800" },
    99: { icon: "fa-bolt",                                   label: "Severe thunderstorm", bg: "from-gray-800 to-purple-900" },
  };
  return map[code] || { icon: "fa-cloud", label: "Cloudy", bg: "from-gray-400 to-gray-500" };
}

export default function WeatherWidget({ lat, lng, city, state }: Props) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!lat || !lng) {
      setLoading(false);
      return;
    }

    async function fetchWeather() {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=1`
        );
        const data = await res.json();

        if (data.current) {
          setWeather({
            temperature: Math.round(data.current.temperature_2m),
            feelsLike: Math.round(data.current.apparent_temperature),
            humidity: data.current.relative_humidity_2m,
            windSpeed: Math.round(data.current.wind_speed_10m),
            weatherCode: data.current.weather_code,
            isDay: data.current.is_day === 1,
            high: Math.round(data.daily.temperature_2m_max[0]),
            low: Math.round(data.daily.temperature_2m_min[0]),
            precipChance: data.daily.precipitation_probability_max?.[0] ?? 0,
          });
        }
      } catch {
        setError(true);
      }
      setLoading(false);
    }

    fetchWeather();
  }, [lat, lng]);

  // No location set
  if (!lat || !lng) {
    return (
      <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl p-5 text-center">
        <i className="fa-solid fa-cloud text-3xl text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">
          Set your city in your profile to see local weather
        </p>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl p-5 text-white text-center animate-pulse">
        <i className="fa-solid fa-spinner fa-spin text-2xl mb-2" />
        <p className="text-sm text-white/80">Loading weather...</p>
      </div>
    );
  }

  // Error
  if (error || !weather) {
    return (
      <div className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl p-5 text-center">
        <i className="fa-solid fa-cloud-xmark text-3xl text-gray-500 mb-2" />
        <p className="text-sm text-gray-600">Weather unavailable</p>
      </div>
    );
  }

  const info = getWeatherInfo(weather.weatherCode, weather.isDay);

  return (
    <div className={`bg-gradient-to-br ${info.bg} rounded-2xl p-5 text-white relative overflow-hidden`}>
      {/* Decorative circles */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />

      {/* Location */}
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-3">
          <i className="fa-solid fa-location-dot text-white/80 text-xs" />
          <span className="text-sm font-medium text-white/90">
            {city}{state ? `, ${state}` : ""}
          </span>
        </div>

        {/* Main temp + icon */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-4xl font-bold tracking-tight">
              {weather.temperature}°
            </div>
            <p className="text-sm text-white/80 mt-0.5">{info.label}</p>
          </div>
          <i className={`fa-solid ${info.icon} text-5xl text-white/90`} />
        </div>

        {/* Details row */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/20">
          <div className="text-center">
            <p className="text-[10px] text-white/60 uppercase tracking-wider">Feels</p>
            <p className="text-sm font-bold">{weather.feelsLike}°</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-white/60 uppercase tracking-wider">H / L</p>
            <p className="text-sm font-bold">{weather.high}° / {weather.low}°</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-white/60 uppercase tracking-wider">Wind</p>
            <p className="text-sm font-bold">{weather.windSpeed} mph</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-white/60 uppercase tracking-wider">Rain</p>
            <p className="text-sm font-bold">{weather.precipChance}%</p>
          </div>
        </div>

        {/* Yard sale tip */}
        <div className="mt-3 pt-3 border-t border-white/20">
          <p className="text-xs text-white/70 flex items-center gap-1.5">
            <i className="fa-solid fa-tag text-[10px]" />
            {weather.precipChance > 50
              ? "Rain expected — indoor sales are your best bet today!"
              : weather.temperature > 85
              ? "Hot day — stay hydrated while sale hunting! 🥤"
              : weather.temperature < 40
              ? "Bundle up for outdoor sales today! 🧥"
              : "Great yard sale weather — get out there! 🎯"}
          </p>
        </div>
      </div>
    </div>
  );
}
