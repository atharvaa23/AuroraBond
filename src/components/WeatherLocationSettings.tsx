"use client";

import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User, Bond } from "../lib/types";

interface WeatherLocationSettingsProps {
    user: User | null;
    bond: Bond | null;
}

async function fetchCityByCoords(lat: number, lon: number) {
    const key = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

    if (!key) {
        throw new Error("Missing OpenWeather API key");
    }

    const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`
    );

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Location weather fetch failed: ${res.status} ${text}`);
    }

    const data = await res.json();

    return data.name || "";
}

const WEATHER_SETTINGS_CSS = `
  .weather-settings-row {
    display: flex;
    gap: 14px;
    align-items: flex-end;
    flex-wrap: wrap;
  }

  .weather-settings-input-wrap {
    flex: 1;
    min-width: 220px;
  }

  .weather-settings-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .weather-small-btn {
    padding: 11px 16px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.05);
    color: var(--text);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.25s ease;
    white-space: nowrap;
  }

  .weather-small-btn:hover {
    border-color: var(--aurora1);
    box-shadow: 0 0 14px rgba(192,132,252,0.25);
    transform: translateY(-1px);
  }

  .weather-small-btn.primary {
    background: linear-gradient(
      135deg,
      rgba(192,132,252,0.25),
      rgba(251,113,133,0.18)
    );
    border-color: rgba(192,132,252,0.45);
  }

  .weather-small-btn.danger {
    color: #fb7185;
    border-color: rgba(251,113,133,0.4);
  }

  .weather-small-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .weather-settings-note {
    margin-top: 12px;
    font-size: 12px;
    color: var(--muted);
    line-height: 1.6;
  }

  .weather-settings-status {
    margin-top: 12px;
    font-size: 12px;
    color: #86efac;
  }

  .weather-settings-error {
    margin-top: 12px;
    font-size: 12px;
    color: #fb7185;
  }
`;

export function WeatherLocationSettings({
    user,
    bond,
}: WeatherLocationSettingsProps) {
    const savedCity =
        user?.uid && bond?.weatherCities?.[user.uid]
            ? bond.weatherCities[user.uid]
            : "";

    const [city, setCity] = useState(savedCity);
    const [saving, setSaving] = useState(false);
    const [locating, setLocating] = useState(false);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        setCity(savedCity);
    }, [savedCity]);

    const saveCity = async () => {
        const cleaned = city.trim();

        if (!user?.bondId || !user?.uid) {
            setError("User or bond not loaded yet.");
            return;
        }

        if (!cleaned) {
            setError("Enter a city name first.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setStatus("");

            await updateDoc(doc(db, "bonds", user.bondId), {
                [`weatherCities.${user.uid}`]: cleaned,
            });

            setStatus("Weather location saved ✓");
            setTimeout(() => setStatus(""), 2000);
        } catch (err) {
            console.error("Weather city save error:", err);
            setError("Could not save weather location.");
        } finally {
            setSaving(false);
        }
    };

    const clearCity = async () => {
        if (!user?.bondId || !user?.uid) {
            setError("User or bond not loaded yet.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setStatus("");

            setCity("");

            await updateDoc(doc(db, "bonds", user.bondId), {
                [`weatherCities.${user.uid}`]: "",
            });

            setStatus("Weather location cleared ✓");
            setTimeout(() => setStatus(""), 2000);
        } catch (err) {
            console.error("Weather city clear error:", err);
            setError("Could not clear weather location.");
        } finally {
            setSaving(false);
        }
    };

    const useMyLocation = () => {
        if (!navigator.geolocation) {
            setError("Location is not supported in this browser.");
            return;
        }

        if (!user?.bondId || !user?.uid) {
            setError("User or bond not loaded yet.");
            return;
        }

        setLocating(true);
        setError("");
        setStatus("");

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    const detectedCity = await fetchCityByCoords(latitude, longitude);

                    if (!detectedCity) {
                        throw new Error("Could not detect city name.");
                    }

                    setCity(detectedCity);

                    await updateDoc(doc(db, "bonds", user.bondId!), {
                        [`weatherCities.${user.uid}`]: detectedCity,
                    });

                    setStatus(`Location saved as ${detectedCity} ✓`);
                    setTimeout(() => setStatus(""), 2500);
                } catch (err) {
                    console.error("Use location error:", err);
                    setError("Could not fetch location. Check API key or browser permission.");
                } finally {
                    setLocating(false);
                }
            },
            (err) => {
                console.error("Geolocation error:", err);
                setError("Location permission denied or unavailable.");
                setLocating(false);
            }
        );
    };

    return (
        <>
            <style>{WEATHER_SETTINGS_CSS}</style>

            <div className="settings-card">
                <div className="settings-card-title">Weather Location</div>

                <div className="weather-settings-row">
                    <div className="weather-settings-input-wrap">
                        <label className="input-label">Your City</label>
                        <input
                            className="input-field"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Example: Chennai"
                        />
                    </div>

                    <div className="weather-settings-actions">
                        <button
                            className="weather-small-btn"
                            onClick={useMyLocation}
                            disabled={locating || saving}
                            type="button"
                        >
                            {locating ? "Detecting..." : "📍 Use location"}
                        </button>

                        <button
                            className="weather-small-btn primary"
                            onClick={saveCity}
                            disabled={saving || locating}
                            type="button"
                        >
                            {saving ? "Saving..." : "Save city"}
                        </button>

                        <button
                            className="weather-small-btn danger"
                            onClick={clearCity}
                            disabled={saving || locating || !city.trim()}
                            type="button"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                <div className="weather-settings-note">
                    This controls only your weather card. Your partner should set their own
                    weather location from their account.
                </div>

                {status && <div className="weather-settings-status">{status}</div>}
                {error && <div className="weather-settings-error">{error}</div>}
            </div>
        </>
    );
}