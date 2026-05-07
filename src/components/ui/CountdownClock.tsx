"use client";

import { useEffect, useState } from "react";

interface CountdownClockProps {
  reunionDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(reunionDate: string): TimeLeft | null {
  const target = new Date(reunionDate).getTime();

  if (Number.isNaN(target)) return null;

  const diff = target - Date.now();

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

const COUNTDOWN_CSS = `
  .countdown-card {
    background:
      radial-gradient(circle at 18% 18%, rgba(96,165,250,0.12), transparent 32%),
      radial-gradient(circle at 82% 74%, rgba(244,114,182,0.13), transparent 36%),
      linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025));
    border: none;
    border-radius: var(--radius-lg);
    padding: 36px;
    backdrop-filter: blur(24px);
    margin-bottom: 40px;
    text-align: center;
    position: relative;
    overflow: hidden;
    box-shadow:
      0 20px 70px rgba(0,0,0,0.24),
      inset 0 1px 0 rgba(255,255,255,0.08);
  }

  .countdown-card::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at center, rgba(192,132,252,0.10), transparent 44%),
      radial-gradient(circle at top right, rgba(244,114,182,0.08), transparent 38%);
    pointer-events: none;
  }

  .countdown-label {
    position: relative;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--aurora1);
    margin-bottom: 12px;
    z-index: 1;
  }

  .countdown-title {
    position: relative;
    font-family: var(--font-serif);
    font-size: clamp(28px, 4vw, 44px);
    font-weight: 300;
    line-height: 1.08;
    margin-bottom: 28px;
    z-index: 1;
    text-align: center;
    background: linear-gradient(135deg, #60a5fa, #c084fc 48%, #f472b6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .countdown-grid {
    position: relative;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    z-index: 1;
  }

  .countdown-box {
    position: relative;
    border: 1px solid rgba(255,255,255,0.08);
    background:
      linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,255,255,0.025));
    border-radius: 22px;
    padding: 22px 12px;
    overflow: hidden;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.08),
      0 12px 35px rgba(0,0,0,0.18);
  }

  .countdown-box::before {
    content: "";
    position: absolute;
    inset: -40%;
    background: radial-gradient(circle, rgba(255,255,255,0.13), transparent 45%);
    opacity: 0.45;
    transform: translateY(-28%);
    pointer-events: none;
  }

  .countdown-box::after {
    content: "";
    position: absolute;
    left: 18%;
    right: 18%;
    bottom: 0;
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(96,165,250,0.75),
      rgba(192,132,252,0.8),
      rgba(244,114,182,0.75),
      transparent
    );
    opacity: 0.85;
  }

  .countdown-number {
    position: relative;
    display: inline-block;
    font-family: var(--font-serif);
    font-size: clamp(34px, 5vw, 52px);
    font-weight: 300;
    line-height: 1;
    margin-bottom: 10px;

    background: linear-gradient(135deg, #a78bfa, #c084fc 45%, #f0abfc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    text-shadow:
      0 0 18px rgba(192,132,252,0.42),
      0 0 32px rgba(168,85,247,0.25),
      0 0 50px rgba(244,114,182,0.10);

    animation: heartBeatDigit 2.35s ease-in-out infinite;
    transform-origin: center;
    will-change: transform;
  }

  .countdown-box:nth-child(1) .countdown-number {
    animation-delay: 0s;
  }

  .countdown-box:nth-child(2) .countdown-number {
    animation-delay: 0.18s;
  }

  .countdown-box:nth-child(3) .countdown-number {
    animation-delay: 0.36s;
  }

  .countdown-box:nth-child(4) .countdown-number {
    animation-delay: 0.54s;
  }

  .countdown-unit {
    position: relative;
    font-size: 10px;
    letter-spacing: 1.8px;
    color: var(--muted);
    text-transform: uppercase;
  }

  .together-card {
    border: none;
    background:
      radial-gradient(circle at 20% 20%, rgba(96,165,250,0.16), transparent 34%),
      radial-gradient(circle at 80% 75%, rgba(244,114,182,0.16), transparent 38%),
      linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025));
    box-shadow:
      0 20px 70px rgba(0,0,0,0.24),
      inset 0 1px 0 rgba(255,255,255,0.08);
  }

  .together-card::before {
    background:
      radial-gradient(circle at center, rgba(192,132,252,0.10), transparent 44%),
      radial-gradient(circle at top right, rgba(244,114,182,0.08), transparent 38%);
  }

  .together-inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .orbit-scene {
    position: relative;
    width: 190px;
    height: 190px;
    margin: 0 auto 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .orbit-center {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 62px;
    height: 62px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      radial-gradient(circle at 30% 30%, rgba(255,255,255,0.22), rgba(255,255,255,0.06)),
      linear-gradient(135deg, rgba(192,132,252,0.18), rgba(251,113,133,0.14));
    font-size: 28px;
    box-shadow:
      0 0 24px rgba(192,132,252,0.25),
      0 0 54px rgba(251,113,133,0.14);
  }

  .orbit-path {
    position: absolute;
    inset: 0;
    animation: orbitSpin 7.5s linear infinite;
    will-change: transform;
  }

  .orbit-path.reverse {
    animation-direction: reverse;
    animation-duration: 9s;
  }

  .orbit-ball {
    position: absolute;
    left: 50%;
    top: 4px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    transform: translateX(-50%);
  }

  .orbit-ball.blue {
    background: radial-gradient(circle at 28% 26%, #eff6ff, #60a5fa 45%, #2563eb 74%);
    box-shadow:
      0 0 14px rgba(96,165,250,0.95),
      0 0 34px rgba(96,165,250,0.62),
      0 0 64px rgba(96,165,250,0.25);
  }

  .orbit-ball.pink {
    background: radial-gradient(circle at 28% 26%, #fdf2f8, #f472b6 45%, #db2777 74%);
    box-shadow:
      0 0 14px rgba(244,114,182,0.95),
      0 0 34px rgba(244,114,182,0.62),
      0 0 64px rgba(244,114,182,0.25);
  }

  .orbit-path.reverse .orbit-ball {
    top: auto;
    bottom: 4px;
  }

  .together-title {
    font-family: var(--font-serif);
    font-size: clamp(34px, 5vw, 52px);
    font-weight: 300;
    line-height: 1.05;
    margin-bottom: 16px;
    letter-spacing: 0.3px;
    text-align: center;
    background: linear-gradient(135deg, #60a5fa, #c084fc 48%, #f472b6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .together-sub {
    color: var(--muted);
    font-size: 15px;
    line-height: 1.85;
    max-width: 620px;
    margin: 0 auto;
    text-align: center;
  }

  .together-sub strong {
    color: var(--text);
    font-weight: 500;
  }

  .together-mini {
    margin-top: 18px;
    color: var(--muted2);
    font-size: 13px;
    font-style: italic;
    text-align: center;
  }

  @keyframes orbitSpin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  @keyframes heartBeatDigit {
    0%, 100% {
      transform: scale(1);
      filter: drop-shadow(0 0 0 rgba(192,132,252,0));
    }

    18% {
      transform: scale(1.045);
      filter: drop-shadow(0 0 8px rgba(192,132,252,0.28));
    }

    34% {
      transform: scale(1);
    }

    50% {
      transform: scale(1.025);
      filter: drop-shadow(0 0 10px rgba(244,114,182,0.18));
    }

    72% {
      transform: scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .countdown-number,
    .orbit-path {
      animation: none;
    }
  }

  @media (max-width: 640px) {
    .countdown-card {
      padding: 26px 18px;
    }

    .countdown-title {
      font-size: 28px;
      margin-bottom: 22px;
    }

    .countdown-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .countdown-box {
      padding: 18px 10px;
      border-radius: 18px;
    }

    .countdown-number {
      font-size: 38px;
    }

    .orbit-scene {
      width: 160px;
      height: 160px;
      margin-bottom: 22px;
    }

    .orbit-center {
      width: 54px;
      height: 54px;
      font-size: 24px;
    }

    .orbit-ball {
      width: 24px;
      height: 24px;
    }

    .together-sub {
      font-size: 13.5px;
      line-height: 1.75;
    }

    .together-mini {
      font-size: 12px;
    }
  }
`;

export function CountdownClock({ reunionDate }: CountdownClockProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    getTimeLeft(reunionDate)
  );

  useEffect(() => {
    setTimeLeft(getTimeLeft(reunionDate));

    const timer = window.setInterval(() => {
      setTimeLeft(getTimeLeft(reunionDate));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [reunionDate]);

  if (!timeLeft) {
    return (
      <>
        <style>{COUNTDOWN_CSS}</style>

        <div className="countdown-card">
          <div className="countdown-label">Reunion Countdown</div>
          <div className="countdown-title">Set a valid reunion date</div>
        </div>
      </>
    );
  }

  const isTogether =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  if (isTogether) {
    return (
      <>
        <style>{COUNTDOWN_CSS}</style>

        <div className="countdown-card together-card">
          <div className="together-inner">
            <div className="orbit-scene">
              <div className="orbit-path">
                <div className="orbit-ball blue" />
              </div>

              <div className="orbit-path reverse">
                <div className="orbit-ball pink" />
              </div>

              <div className="orbit-center">💜</div>
            </div>

            <div className="together-title">Together Forever</div>

            <div className="together-sub">
              The waiting has softened into presence, the calls have become
              real laughter, and every little dream now has a place to begin.
              <br />
              You are no longer counting the days between you — you are
              <strong> collecting moments beside each other.</strong>
            </div>

            <div className="together-mini">
              Two hearts, one orbit, one beautiful forever.
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{COUNTDOWN_CSS}</style>

      <div className="countdown-card">
        <div className="countdown-label">Reunion Countdown</div>
        <div className="countdown-title">Counting Moments Until You Meet</div>

        <div className="countdown-grid">
          <div className="countdown-box">
            <div className="countdown-number">{timeLeft.days}</div>
            <div className="countdown-unit">Days</div>
          </div>

          <div className="countdown-box">
            <div className="countdown-number">{timeLeft.hours}</div>
            <div className="countdown-unit">Hours</div>
          </div>

          <div className="countdown-box">
            <div className="countdown-number">{timeLeft.minutes}</div>
            <div className="countdown-unit">Minutes</div>
          </div>

          <div className="countdown-box">
            <div className="countdown-number">{timeLeft.seconds}</div>
            <div className="countdown-unit">Seconds</div>
          </div>
        </div>
      </div>
    </>
  );
}