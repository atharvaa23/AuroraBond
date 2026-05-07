"use client";

import { useEffect, useState } from "react";
import type { User, Partner, Bond } from "../../lib/types";
import { ThemeBackdrop } from "../ui/ThemeBackdrop";
import { fetchWeatherByCity, type WeatherData } from "@/lib/weather";

interface WeatherPageProps {
  user: User | null;
  partner: Partner | null;
  bond: Bond | null;
}

const WEATHER_CSS = `
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

  .weather-city {
    font-family: var(--font-serif);
    font-size: 26px;
    margin-bottom: 20px;
  }

  .weather-empty-city {
    color: var(--muted2);
    font-size: 16px;
    margin-bottom: 20px;
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

  .weather-settings-note {
    margin-top: 14px;
    color: var(--muted2);
    font-size: 12px;
  }
`;

interface WeatherCardProps {
  city: string;
  avatar: string;
  nickname: string;
  emptyText: string;
}

function WeatherCard({ city, avatar, nickname, emptyText }: WeatherCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [iconChanged, setIconChanged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const cleanedCity = city.trim();

    if (!cleanedCity) {
      setWeather(null);
      setError("");
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const data = await fetchWeatherByCity(cleanedCity);
        setWeather(data);

        setIconChanged(true);
        setTimeout(() => setIconChanged(false), 500);
      } catch (err) {
        console.error("Weather fetch error:", err);
        setWeather(null);
        setError("Could not fetch weather");
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [city]);

  return (
    <div className="weather-card">
      <div className="weather-name">
        {avatar} {nickname}
      </div>

      {city.trim() ? (
        <div className="weather-city">{city}</div>
      ) : (
        <div className="weather-empty-city">{emptyText}</div>
      )}

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

      {!city.trim() && (
        <div className="weather-settings-note">
          City can be set from Settings.
        </div>
      )}
    </div>
  );
}

export function WeatherPage({ user, partner, bond }: WeatherPageProps) {
  const myCity = bond?.weatherCities?.[user?.uid || ""] ?? "";
  const partnerCity = bond?.weatherCities?.[partner?.uid || ""] ?? "";

  return (
    <>
      <style>{WEATHER_CSS}</style>

      <div className="page">
        <div className="aurora-bg" />
        <ThemeBackdrop />

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
              avatar={user?.avatar ?? "💜"}
              nickname={user?.nickname ?? "You"}
              emptyText="Set your city in Settings"
            />

            <WeatherCard
              city={partnerCity}
              avatar={partner?.avatar ?? "🌸"}
              nickname={partner?.nickname ?? "Partner"}
              emptyText="Partner has not set their city yet"
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