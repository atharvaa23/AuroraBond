"use client";

import { useCountdown } from "../../lib/hooks";

interface CountdownClockProps {
  reunionDate: string;
}

const COUNTDOWN_CSS = `
  .countdown-section { margin: 40px 0; }
  .countdown-label {
    font-size: 11px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--aurora1); text-align: center; margin-bottom: 24px;
  }
  .countdown-grid { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }
  .countdown-unit {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-lg); padding: 20px 28px;
    text-align: center; min-width: 90px; backdrop-filter: blur(20px);
  }
  .countdown-num {
    font-family: var(--font-serif); font-size: 48px; font-weight: 300;
    background: linear-gradient(135deg, var(--aurora1), var(--aurora2));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; line-height: 1; animation: tick 1s ease-in-out infinite;
  }
  .countdown-unit-label {
    font-size: 10px; letter-spacing: 2px; color: var(--muted);
    text-transform: uppercase; margin-top: 8px;
  }
`;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

const UNITS = [
  { key: "days"    as const, label: "days"    },
  { key: "hours"   as const, label: "hours"   },
  { key: "minutes" as const, label: "minutes" },
  { key: "seconds" as const, label: "seconds" },
];

/**
 * CountdownClock
 * ──────────────
 * Displays a live countdown to `reunionDate`.
 * Owns its own interval via useCountdown — no timers leak into parent.
 * Firebase-ready: pass `reunionDate` from Firestore directly.
 */
export function CountdownClock({ reunionDate }: CountdownClockProps) {
  const time = useCountdown(reunionDate);

  return (
    <>
      <style>{COUNTDOWN_CSS}</style>
      <div className="countdown-section">
        <div className="countdown-label">✦ Reunion Countdown ✦</div>
        <div className="countdown-grid">
          {UNITS.map(({ key, label }) => (
            <div className="countdown-unit" key={key}>
              <div className="countdown-num">{pad(time[key])}</div>
              <div className="countdown-unit-label">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}