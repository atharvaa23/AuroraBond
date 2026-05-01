"use client";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import type { User, Partner, Bond } from "../../lib/types";
import { PetalCanvas } from "../ui/PetalCanvas";


const CACHE_TIME = 20 * 60 * 1000;

async function fetchWeatherByCity(city: string) {
  const key = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  const cacheKey = `weather_${city.toLowerCase()}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.savedAt < CACHE_TIME) return parsed.data;
  }

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric`
  );

  if (!res.ok) throw new Error("Weather fetch failed");

  const data = await res.json();

  const weather = {
    icon: getWeatherEmoji(data.weather?.[0]?.main),
    desc: data.weather?.[0]?.description ?? "Weather",
    temp: Math.round(data.main.temp),
    humidity: data.main.humidity,
    wind: Math.round(data.wind.speed * 3.6),
  };

  localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), data: weather }));

  return weather;
}
async function fetchWeatherByCoords(lat: number, lon: number) {
  const key = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`
  );

  if (!res.ok) throw new Error("Location weather fetch failed");

  const data = await res.json();

  return {
    city: data.name,
    weather: {
      icon: getWeatherEmoji(data.weather?.[0]?.main),
      desc: data.weather?.[0]?.description ?? "Weather",
      temp: Math.round(data.main.temp),
      humidity: data.main.humidity,
      wind: Math.round(data.wind.speed * 3.6),
    },
  };
}

function getWeatherEmoji(main: string) {
  switch (main) {
    case "Clear": return "☀️";
    case "Clouds": return "☁️";
    case "Rain": return "🌧️";
    case "Thunderstorm": return "⛈️";
    case "Drizzle": return "🌦️";
    case "Snow": return "❄️";
    case "Mist":
    case "Fog":
    case "Haze": return "🌫️";
    default: return "🌤️";
  }
}

interface WeatherPageProps {
  user: User | null;
  partner: Partner | null;
  bond: Bond | null;
}

const WEATHER_CSS = `
.weather-location-btn {
  margin-top: 12px;
  padding: 8px 18px;
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  border-radius: 999px;
  border: 1px solid var(--aurora1);
  color: var(--aurora1);
  background: rgba(192,132,252,0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.weather-location-btn:hover {
  background: linear-gradient(135deg, rgba(192,132,252,0.2), rgba(251,113,133,0.15));
  color: white;
  box-shadow: 0 0 12px rgba(192,132,252,0.4);
  transform: translateY(-1px) scale(1.03);
}

.weather-location-btn:active {
  transform: scale(0.97);
  box-shadow: 0 0 6px rgba(192,132,252,0.3);
}
  .weather-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 640px) { .weather-grid { grid-template-columns: 1fr; } }
  .weather-card {
    background: var(--card); border: 1px solid var(--border); border-radius: 24px;
    padding: 36px; backdrop-filter: blur(20px); text-align: center;
  }
  .weather-name { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: var(--aurora1); margin-bottom: 8px; }
  .weather-city { font-family: var(--font-serif); font-size: 26px; margin-bottom: 20px; }
  .weather-icon { font-size: 64px; margin-bottom: 16px; }
  .weather-temp { font-family: var(--font-serif); font-size: 56px; font-weight: 300; margin-bottom: 8px; }
  .weather-desc { color: var(--muted); font-size: 14px; }
  .weather-detail { display: flex; justify-content: center; gap: 24px; margin-top: 20px; }
  .weather-detail-item { text-align: center; }
  .weather-detail-val { font-size: 18px; font-weight: 500; }
  .weather-detail-key { font-size: 11px; color: var(--muted); letter-spacing: 1px; }
  .weather-city-input { max-width: 160px; text-align: center; margin: 0 auto; }
`;

interface WeatherCardProps {
  city: string;
  onCityChange: (city: string) => void;
  label: string;
  avatar: string;
  nickname: string;
  showLocationButton?: boolean;
}

function WeatherCard({
  city,
  onCityChange,
  label,
  avatar,
  nickname,
  showLocationButton = false,
}: WeatherCardProps) {
  const [weather, setWeather] = useState<any>(null);

useEffect(() => {
  if (!city) return;

  const timer = setTimeout(() => {
    fetchWeatherByCity(city)
      .then(setWeather)
      .catch(() => {});
  }, 500); // wait 500ms after typing stops

  return () => clearTimeout(timer);
}, [city]);
const useMyLocation = () => {
  if (!navigator.geolocation) {
    alert("Location is not supported in this browser");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const { latitude, longitude } = pos.coords;
      const result = await fetchWeatherByCoords(latitude, longitude);

      onCityChange(result.city);
      setWeather(result.weather);
    } catch {
      alert("Could not fetch weather for your location");
    }
  });
};

  return (
    <div className="weather-card">
      <div className="weather-name">{avatar} {nickname}</div>
      <div style={{ marginBottom: 20 }}>
        <input
          className="input-field weather-city-input"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="City name"
        />
        {showLocationButton && (
  <button
    className="weather-location-btn"
    onClick={useMyLocation}
  >
    📍 Use my location
  </button>
)}
      </div>
      <div className="weather-icon">{weather?.icon ?? "🌤️"}</div>
      <div className="weather-temp">{weather?.temp ?? "--"}°</div>
      <div className="weather-desc">{weather?.desc ?? "Loading weather..."}</div>
      <div className="weather-detail">
        <div className="weather-detail-item">
          <div className="weather-detail-val">💧 {weather?.humidity ?? "--"}%</div>
          <div className="weather-detail-key">Humidity</div>
        </div>
        <div className="weather-detail-item">
          <div className="weather-detail-val">💨 {weather?.wind ?? "--"}</div>
          <div className="weather-detail-key">km/h wind</div>
        </div>
      </div>
    </div>
  );
}

/**
 * WeatherPage
 * ───────────
 * Owns: city persistence (localStorage), weather preset lookup.
 * Does NOT own: user data (props), navigation.
 *
 * Firebase-ready: replace WEATHER_DATA lookup with a real weather API call
 * (e.g. OpenWeatherMap) keyed to the stored city name.
 * City preference can move from localStorage → Firestore user document.
 */
export function WeatherPage({ user, partner, bond }: WeatherPageProps) {
  const myCity =
  bond?.weatherCities?.[user?.uid || ""] || "Chennai";

const partnerCity =
  bond?.weatherCities?.[partner?.uid || ""] || "Mumbai";

const updateMyCity = async (city: string) => {
  if (!user?.bondId || !user?.uid) return;

  await updateDoc(doc(db, "bonds", user.bondId), {
    [`weatherCities.${user.uid}`]: city,
  });
};

const updatePartnerCity = async (city: string) => {
  if (!user?.bondId || !partner?.uid) return;

  await updateDoc(doc(db, "bonds", user.bondId), {
    [`weatherCities.${partner.uid}`]: city,
  });
};

  return (
    <>
      <style>{WEATHER_CSS}</style>
      <div className="page">
        <div className="aurora-bg" />
        <PetalCanvas />

        <div className="inner-wrap">
          <div className="page-title">The <span>Weather</span></div>
          <div className="page-sub">Two skies, one connection — feel each other's world.</div>

          <div className="weather-grid">
 <WeatherCard
  city={myCity}
  onCityChange={updateMyCity}
  label="You"
  avatar={user?.avatar ?? "💜"}
  nickname={user?.nickname ?? "You"}
  showLocationButton
/>

 <WeatherCard
  city={partnerCity}
  onCityChange={updatePartnerCity}
  label="Partner"
  avatar={partner?.avatar ?? "🌸"}
  nickname={partner?.nickname ?? "Partner"}
/>
</div>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 300, fontStyle: "italic", color: "var(--muted)" }}>
              "Even when skies are different, we share the same stars."
            </div>
          </div>
        </div>
      </div>
    </>
  );
}