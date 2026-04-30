"use client";

import type { User, Partner } from "../../lib/types";
import { WEATHER_DATA, WEATHER_CYCLE_MY, WEATHER_CYCLE_PARTNER } from "../../lib/constants";
import { useStorage } from "../../lib/hooks";
import { PetalCanvas } from "../ui/PetalCanvas";

interface WeatherPageProps {
  user: User | null;
  partner: Partner | null;
}

const WEATHER_CSS = `
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
  storageKey: string;
  defaultCity: string;
  label: string;
  avatar: string;
  nickname: string;
  weatherKey: string;
}

function WeatherCard({ storageKey, defaultCity, label, avatar, nickname, weatherKey }: WeatherCardProps) {
  const [city, setCity] = useStorage(storageKey, defaultCity);
  const weather = WEATHER_DATA[weatherKey] ?? WEATHER_DATA.sunny;

  return (
    <div className="weather-card">
      <div className="weather-name">{avatar} {nickname}</div>
      <div style={{ marginBottom: 20 }}>
        <input
          className="input-field weather-city-input"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City name"
        />
      </div>
      <div className="weather-icon">{weather.icon}</div>
      <div className="weather-temp">{weather.temp}°</div>
      <div className="weather-desc">{weather.desc}</div>
      <div className="weather-detail">
        <div className="weather-detail-item">
          <div className="weather-detail-val">💧 {weather.humidity}%</div>
          <div className="weather-detail-key">Humidity</div>
        </div>
        <div className="weather-detail-item">
          <div className="weather-detail-val">💨 {weather.wind}</div>
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
export function WeatherPage({ user, partner }: WeatherPageProps) {
  const hour = new Date().getHours();
  const myWeatherKey      = WEATHER_CYCLE_MY[hour % WEATHER_CYCLE_MY.length];
  const partnerWeatherKey = WEATHER_CYCLE_PARTNER[hour % WEATHER_CYCLE_PARTNER.length];

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
              storageKey="ab_my_city"
              defaultCity="Chennai"
              label="You"
              avatar={user?.avatar ?? "💜"}
              nickname={user?.nickname ?? "You"}
              weatherKey={myWeatherKey}
            />
            <WeatherCard
              storageKey="ab_partner_city"
              defaultCity="Mumbai"
              label="Partner"
              avatar={partner?.avatar ?? "🌸"}
              nickname={partner?.nickname ?? "Partner"}
              weatherKey={partnerWeatherKey}
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