import { useState, useEffect, useCallback } from "react";

// ─── useStorage ────────────────────────────────────────────────────────────
// localStorage-backed state with JSON serialization.
// Falls back to `defaultValue` if key is absent or parse fails.
// Firebase-ready: swap the localStorage calls for Firestore writes.

export function useStorage<T>(key: string, defaultValue: T): [T, (val: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const set = useCallback(
    (newVal: T) => {
      setValue(newVal);
      try {
        localStorage.setItem(key, JSON.stringify(newVal));
      } catch {
        // quota exceeded or private browsing — fail silently
      }
    },
    [key]
  );

  return [value, set];
}

// ─── useCountdown ──────────────────────────────────────────────────────────
// Returns { days, hours, minutes, seconds } until `targetDate`.
// Updates every second. Returns all-zeros when past or no date given.

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function useCountdown(targetDate: string): CountdownTime {
  const [time, setTime] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;

    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTime({
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1_000),
      });
    };

    calc();
    const id = setInterval(calc, 1_000);
    return () => clearInterval(id);
  }, [targetDate]);

  return time;
}

// ─── useWeather ────────────────────────────────────────────────────────────
// Returns a weather preset key based on current hour.
// Firebase-ready: replace with a real weather API call.

export function useWeatherKey(offset: number = 0): string {
  const presets = ["sunny", "cloudy", "rainy", "windy", "stormy", "snowy"];
  const idx = (new Date().getHours() + offset) % presets.length;
  return presets[idx];
}