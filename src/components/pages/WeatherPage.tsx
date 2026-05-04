"use client";

import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import type { User, Partner, Bond } from "../../lib/types";
import { PetalCanvas } from "../ui/PetalCanvas";

const CACHE_TIME = 20 * 60 * 1000;

type WeatherInfo = {
  icon: string;
  desc: string;
  temp: number;
  humidity: number;
  wind: number;
};

async function fetchWeatherByCity(city: string): Promise<WeatherInfo> {
  const key = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  console.log("Weather API key:", key);
  console.log("OpenWeather key:", process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY);
  if (!key) {
    throw new Error("Missing OpenWeather API key");
  }

  const cleanedCity = city.trim();

  if (!cleanedCity) {
    throw new Error("City is empty");
  }

  const cacheKey = `weather_${cleanedCity.toLowerCase()}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    const parsed = JSON.parse(cached);

    if (Date.now() - parsed.savedAt < CACHE_TIME) {
      return parsed.data;
    }
  }

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      cleanedCity
    )}&appid=${key}&units=metric`
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Weather fetch failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  const weather: WeatherInfo = {
    icon: getWeatherEmoji(data.weather?.[0]?.main),
    desc: data.weather?.[0]?.description ?? "Weather",
    temp: Math.round(data.main.temp),
    humidity: data.main.humidity,
    wind: Math.round(data.wind.speed * 3.6),
  };

  localStorage.setItem(
    cacheKey,
    JSON.stringify({
      savedAt: Date.now(),
      data: weather,
    })
  );

  return weather;
}

async function fetchWeatherByCoords(lat: number, lon: number) {
  const key = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  if (!key) throw new Error("Missing OpenWeather API key");

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Location weather fetch failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  const weather = {
    icon: getWeatherEmoji(data.weather?.[0]?.main),
    desc: data.weather?.[0]?.description ?? "Weather",
    temp: Math.round(data.main.temp),
    humidity: data.main.humidity,
    wind: Math.round(data.wind.speed * 3.6),
  };

  localStorage.setItem(
    `weather_${data.name.toLowerCase()}`,
    JSON.stringify({ savedAt: Date.now(), data: weather })
  );

  return {
    city: data.name,
    weather,
  };
}

function getWeatherEmoji(main?: string) {
  switch (main) {
    case "Clear":
      return "☀️";
    case "Clouds":
      return "☁️";
    case "Rain":
      return "🌧️";
    case "Thunderstorm":
      return "⛈️";
    case "Drizzle":
      return "🌦️";
    case "Snow":
      return "❄️";
    case "Mist":
    case "Fog":
    case "Haze":
      return "🌫️";
    default:
      return "🌤️";
  }
}

interface WeatherPageProps {
  user: User | null;
  partner: Partner | null;
  bond: Bond | null;
}

const WEATHER_CSS = `
  .weather-city-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .weather-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  @media (max-width: 640px) {
    .weather-grid {
      grid-template-columns: 1fr;
    }
  }

  .weather-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 36px;
    backdrop-filter: blur(20px);
    text-align: center;
  }

  .weather-name {
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--aurora1);
    margin-bottom: 8px;
  }

  .weather-city-input {
    max-width: 180px;
    text-align: center;
    margin: 0 auto;
  }

  .weather-actions {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 12px;
  }

  .weather-action-btn {
    padding: 8px 16px;
    font-size: 11px;
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

  .weather-action-btn:hover {
    background: linear-gradient(135deg, rgba(192,132,252,0.2), rgba(251,113,133,0.15));
    color: white;
    box-shadow: 0 0 12px rgba(192,132,252,0.4);
    transform: translateY(-1px) scale(1.03);
  }

  .weather-action-btn:active {
    transform: scale(0.97);
    box-shadow: 0 0 6px rgba(192,132,252,0.3);
  }

  .weather-icon {
    font-size: 64px;
    margin-bottom: 16px;
    animation: weatherFloat 2.8s ease-in-out infinite;
  }

  .weather-icon.weather-change {
    animation:
      weatherPop 0.45s ease,
      weatherFloat 2.8s ease-in-out infinite;
  }

  @keyframes weatherFloat {
    0%, 100% {
      transform: translateY(0) rotate(0deg);
    }

    50% {
      transform: translateY(-6px) rotate(3deg);
    }
  }

  @keyframes weatherPop {
    0% {
      transform: scale(0.6) rotate(-12deg);
      opacity: 0;
      filter: blur(6px);
    }

    70% {
      transform: scale(1.18) rotate(5deg);
      opacity: 1;
      filter: blur(0);
    }

    100% {
      transform: scale(1) rotate(0deg);
    }
  }

  .weather-temp {
    font-family: var(--font-serif);
    font-size: 56px;
    font-weight: 300;
    margin-bottom: 8px;
  }

  .weather-desc {
    color: var(--muted);
    font-size: 14px;
    min-height: 20px;
  }

  .weather-detail {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-top: 20px;
  }

  .weather-detail-item {
    text-align: center;
  }

  .weather-detail-val {
    font-size: 18px;
    font-weight: 500;
  }

  .weather-detail-key {
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 1px;
  }
`;

interface WeatherCardProps {
  city: string;
  onCitySave: (city: string) => void;
  avatar: string;
  nickname: string;
  showLocationButton?: boolean;
  readonly?: boolean;
}

function WeatherCard({
  city,
  onCitySave,
  avatar,
  nickname,
  showLocationButton = false,
  readonly = false,
}: WeatherCardProps) {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [localCity, setLocalCity] = useState(city);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [iconChanged, setIconChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
  if (!isEditing) {
    setLocalCity(city);
  }
}, [city, isEditing]);

  useEffect(() => {
    if (!city.trim()) {
      setWeather(null);
      setError("");
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const data = await fetchWeatherByCity(city);
        setWeather(data);

        setIconChanged(true);
        setTimeout(() => setIconChanged(false), 500);
      } catch (err) {
        console.error("Weather fetch error:", err);
        setError("Weather fetch failed");
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [city]);

 const saveCity = () => {
  if (readonly) return;

  const cleaned = localCity.trim();

  if (cleaned !== city) {
    onCitySave(cleaned);
  }

  setIsEditing(false);
};

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Location is not supported in this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const result = await fetchWeatherByCoords(latitude, longitude);

          setLocalCity(result.city);
          onCitySave(result.city);
          setWeather(result.weather);
        } catch (err) {
          console.error("Weather location error:", err);
          alert("Could not fetch weather. Check console for details.");
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert("Location permission denied or unavailable.");
      }
    );
  };

  return (
    <div className="weather-card">
      <div className="weather-name">
        {avatar} {nickname}
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          className="input-field weather-city-input"
          value={localCity}
          disabled={readonly}
          onFocus={() => setIsEditing(true)}
          onChange={(e) => setLocalCity(e.target.value)}
          onBlur={saveCity}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              saveCity();
              e.currentTarget.blur();
            }
          }}
          placeholder={readonly ? "Partner city" : "Enter city"}
        />
        {!readonly && (
          <div className="weather-actions">
            <button className="weather-action-btn" onClick={saveCity}>
              Save city
            </button>

            {showLocationButton && (
              <button className="weather-action-btn" onClick={useMyLocation}>
                📍 Use my location
              </button>
            )}
          </div>
        )}
      </div>

      <div className={`weather-icon ${iconChanged ? "weather-change" : ""}`}>
        {weather?.icon ?? "🌤️"}
      </div>

      <div className="weather-temp">
        {loading ? "…" : `${weather?.temp ?? "--"}°`}
      </div>

      <div className="weather-desc">
        {loading ? "Fetching weather..." : error ? error : weather?.desc ?? "—"}
      </div>

      <div className="weather-detail">
        <div className="weather-detail-item">
          <div className="weather-detail-val">
            💧 {weather?.humidity ?? "--"}%
          </div>
          <div className="weather-detail-key">Humidity</div>
        </div>

        <div className="weather-detail-item">
          <div className="weather-detail-val">
            💨 {weather?.wind ?? "--"}
          </div>
          <div className="weather-detail-key">km/h wind</div>
        </div>
      </div>
    </div>
  );
}

export function WeatherPage({ user, partner, bond }: WeatherPageProps) {
  const myCity = bond?.weatherCities?.[user?.uid || ""] ?? "";
  const partnerCity = bond?.weatherCities?.[partner?.uid || ""] ?? "";

  const updateMyCity = async (city: string) => {
    if (!user?.bondId || !user?.uid) return;

    await updateDoc(doc(db, "bonds", user.bondId), {
      [`weatherCities.${user.uid}`]: city,
    });
  };

  return (
    <>
      <style>{WEATHER_CSS}</style>

      <div className="page">
        <div className="aurora-bg" />
        <PetalCanvas />

        <div className="inner-wrap">
          <div className="page-title">
            The <span>Weather</span>
          </div>

          <div className="page-sub">
            Two skies, one connection — feel each other's world.
          </div>

          <div className="weather-grid">
            <WeatherCard
              city={myCity}
              onCitySave={updateMyCity}
              avatar={user?.avatar ?? "💜"}
              nickname={user?.nickname ?? "You"}
              showLocationButton
            />

            <WeatherCard
             city={partnerCity}
            onCitySave={() => {}}
            avatar={partner?.avatar ?? "🌸"}
            nickname={partner?.nickname ?? "Partner"}
            readonly
            />
          </div>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 22,
                fontWeight: 300,
                fontStyle: "italic",
                color: "var(--muted)",
              }}
            >
              "Even when skies are different, we share the same stars."
            </div>
          </div>
        </div>
      </div>
    </>
  );
}