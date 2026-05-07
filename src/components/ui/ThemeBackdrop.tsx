"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { ThemeKey } from "../../lib/types";

const PETAL_SHAPES = [
    "M0,-20 Q8,-10 0,0 Q-8,-10 0,-20",
    "M0,-18 Q10,-8 5,2 Q0,8 -5,2 Q-10,-8 0,-18",
    "M0,-22 Q12,-14 8,0 Q4,10 0,4 Q-4,10 -8,0 Q-12,-14 0,-22",
    "M0,-16 C6,-12 10,-4 8,4 C6,10 -6,10 -8,4 C-10,-4 -6,-12 0,-16",
] as const;

const PETAL_COLORS = [
    "rgba(251,113,133,0.55)",
    "rgba(240,171,252,0.5)",
    "rgba(192,132,252,0.45)",
    "rgba(254,205,211,0.4)",
    "rgba(216,180,254,0.45)",
    "rgba(249,168,212,0.5)",
] as const;

type BackdropTheme = ThemeKey;

type ParticleKind =
    | "petal"
    | "symbol"
    | "wind"
    | "bubble"
    | "firefly";

interface ThemeParticle {
    id: number;
    left: number;
    delay: number;
    duration: number;
    size: number;
    drift: number;
    spin: number;
    color: string;
    kind: ParticleKind;
    symbol?: string;
    shape?: string;
    sway?: number;
    swayDuration?: number;
    startRotation?: number;
}

const THEME_PARTICLE_MAP: Record<
    BackdropTheme,
    {
        count: number;
        kinds: Array<"petal" | "symbol" | "wind" | "bubble" | "firefly">;
        symbols: string[];
        colors: string[];
        minSize: number;
        maxSize: number;
        minDuration: number;
        maxDuration: number;
    }
> = {
    aurora: {
        count: 30,
        kinds: ["petal"],
        symbols: [],
        colors: [...PETAL_COLORS],
        minSize: 10,
        maxSize: 24,
        minDuration: 8,
        maxDuration: 17,
    },
    moonlight: {
        count: 30,
        kinds: ["symbol"],
        symbols: ["✦", "✧", "·", "⋆"],
        colors: [
            "rgba(255,255,255,0.8)",
            "rgba(219,234,254,0.75)",
            "rgba(196,181,253,0.58)",
        ],
        minSize: 8,
        maxSize: 18,
        minDuration: 11,
        maxDuration: 22,
    },
    breeze: {
        count: 24,
        kinds: ["wind"],
        symbols: [],
        colors: [
            "rgba(186,230,253,0.5)",
            "rgba(103,232,249,0.42)",
            "rgba(255,255,255,0.32)",
        ],
        minSize: 48,
        maxSize: 120,
        minDuration: 9,
        maxDuration: 18,
    },
    ocean: {
        count: 34,
        kinds: ["bubble"],
        symbols: [],
        colors: [
            "rgba(186,230,253,0.42)",
            "rgba(34,211,238,0.3)",
            "rgba(129,140,248,0.26)",
        ],
        minSize: 10,
        maxSize: 30,
        minDuration: 8,
        maxDuration: 18,
    },
    rose: {
        count: 30,
        kinds: ["petal", "symbol"],
        symbols: ["♡", "✦"],
        colors: [
            "rgba(251,113,133,0.48)",
            "rgba(249,168,212,0.45)",
            "rgba(240,171,252,0.38)",
        ],
        minSize: 10,
        maxSize: 22,
        minDuration: 8,
        maxDuration: 17,
    },
    cosmic: {
        count: 42,
        kinds: ["symbol"],
        symbols: ["✦", "✧", "·", "✺", "⋆"],
        colors: [
            "rgba(192,132,252,0.65)",
            "rgba(240,171,252,0.52)",
            "rgba(129,140,248,0.55)",
            "rgba(255,255,255,0.65)",
        ],
        minSize: 7,
        maxSize: 20,
        minDuration: 9,
        maxDuration: 22,
    },
    forest: {
        count: 30,
        kinds: ["firefly"],
        symbols: [],
        colors: [
            "rgba(110,231,183,0.55)",
            "rgba(167,243,208,0.42)",
            "rgba(52,211,153,0.38)",
        ],
        minSize: 6,
        maxSize: 13,
        minDuration: 7,
        maxDuration: 16,
    },
    sunset: {
        count: 30,
        kinds: ["petal", "symbol"],
        symbols: ["✦", "·"],
        colors: [
            "rgba(251,146,60,0.5)",
            "rgba(251,113,133,0.44)",
            "rgba(244,114,182,0.38)",
        ],
        minSize: 9,
        maxSize: 23,
        minDuration: 8,
        maxDuration: 17,
    },
};

const THEME_BACKDROP_CSS = `
  .theme-extra-bg {
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    overflow: hidden;
  }

  .theme-fixed-orb {
    position: absolute;
    z-index: 0;
  }

  .theme-moon {
    top: 96px;
    right: 7%;
    width: 92px;
    height: 92px;
    border-radius: 50%;
    background:
      radial-gradient(circle at 35% 32%, rgba(255,255,255,0.98), rgba(226,232,240,0.96) 26%, rgba(203,213,225,0.92) 52%, rgba(148,163,184,0.82) 100%);
    box-shadow:
      0 0 18px rgba(255,255,255,0.22),
      0 0 42px rgba(191,219,254,0.24),
      0 0 90px rgba(147,197,253,0.16);
  }

  .theme-moon::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background:
      radial-gradient(circle at 28% 30%, rgba(148,163,184,0.18) 0 6px, transparent 7px),
      radial-gradient(circle at 63% 38%, rgba(148,163,184,0.16) 0 7px, transparent 8px),
      radial-gradient(circle at 40% 67%, rgba(148,163,184,0.14) 0 5px, transparent 6px),
      radial-gradient(circle at 70% 70%, rgba(148,163,184,0.12) 0 4px, transparent 5px);
    opacity: 0.85;
  }

  .theme-moon::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background:
      radial-gradient(circle at 25% 22%, rgba(255,255,255,0.55), transparent 28%),
      radial-gradient(circle at 78% 82%, rgba(15,23,42,0.16), transparent 34%);
  }

  .theme-sun {
    top: 94px;
    left: 7%;
    width: 118px;
    height: 118px;
    border-radius: 50%;
    background:
      radial-gradient(circle at 34% 34%, rgba(255,251,235,1) 0%, rgba(254,240,138,0.98) 18%, rgba(251,191,36,0.94) 42%, rgba(249,115,22,0.92) 74%, rgba(251,113,133,0.72) 100%);
    box-shadow:
      0 0 28px rgba(251,191,36,0.28),
      0 0 66px rgba(251,146,60,0.24),
      0 0 120px rgba(251,113,133,0.14);
  }

  .theme-sun::before {
    content: "";
    position: absolute;
    inset: -12px;
    border-radius: 50%;
    background:
      radial-gradient(circle, rgba(251,191,36,0.2), rgba(251,146,60,0.08) 52%, transparent 72%);
  }

  .theme-sun::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background:
      radial-gradient(circle at 30% 28%, rgba(255,255,255,0.38), transparent 25%),
      radial-gradient(circle at 70% 72%, rgba(251,113,133,0.14), transparent 34%);
  }

  .theme-cloud {
    position: absolute;
    border-radius: 999px;
    background: rgba(255,255,255,0.07);
    filter: blur(12px);
  }

  .theme-cloud.one {
    width: 230px;
    height: 72px;
    top: 168px;
    left: 6%;
  }

  .theme-cloud.two {
    width: 190px;
    height: 58px;
    top: 142px;
    right: 8%;
  }

  .theme-wave {
    position: absolute;
    left: -10%;
    right: -10%;
    bottom: -70px;
    height: 210px;
    background:
      radial-gradient(ellipse at 20% 0%, color-mix(in srgb, var(--aurora1) 24%, transparent), transparent 42%),
      radial-gradient(ellipse at 70% 20%, color-mix(in srgb, var(--aurora2) 18%, transparent), transparent 46%);
    opacity: 0.75;
    filter: blur(10px);
    animation: waveMove 9s ease-in-out infinite;
  }

  .theme-wave::before {
    content: "";
    position: absolute;
    inset: 40px 0 auto;
    height: 80px;
    background:
      repeating-radial-gradient(ellipse at center, rgba(255,255,255,0.10) 0 1px, transparent 2px 34px);
    opacity: 0.28;
  }

  .theme-forest-glow {
    position: absolute;
    inset: auto 0 -90px;
    height: 250px;
    background:
      radial-gradient(ellipse at 25% 40%, rgba(52,211,153,0.16), transparent 44%),
      radial-gradient(ellipse at 70% 30%, rgba(167,243,208,0.12), transparent 48%);
    filter: blur(18px);
    animation: forestGlow 7s ease-in-out infinite;
  }

  .theme-particle {
    position: absolute;
    left: var(--left);
    z-index: 1;
    will-change: transform, opacity;
  }

  .theme-particle.float {
    top: 100%;
    animation: themeParticleFloat var(--duration) linear var(--delay) infinite;
    opacity: 0;
  }

  .theme-particle.fall {
    top: -80px;
    animation: themePetalFall var(--duration) linear var(--delay) infinite;
    opacity: 0;
  }

  .theme-petal-svg {
    filter: blur(0.4px);
    transform: rotate(var(--start-rot));
    animation: themePetalSway var(--sway-duration) ease-in-out var(--delay) infinite;
  }

  .theme-symbol {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    font-size: var(--size);
    line-height: 1;
    color: var(--particle-color);
    text-shadow: 0 0 14px color-mix(in srgb, var(--particle-color) 70%, transparent);
  }

  .theme-wind-line {
    width: 100%;
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--particle-color),
      transparent
    );
    box-shadow: 0 0 14px var(--particle-color);
  }

  .theme-bubble {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 1px solid var(--particle-color);
    background:
      radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45), transparent 18%),
      color-mix(in srgb, var(--particle-color) 18%, transparent);
    box-shadow:
      0 0 18px color-mix(in srgb, var(--particle-color) 45%, transparent),
      inset 0 0 14px color-mix(in srgb, var(--particle-color) 26%, transparent);
  }

  .theme-firefly {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: var(--particle-color);
    box-shadow:
      0 0 12px var(--particle-color),
      0 0 28px color-mix(in srgb, var(--particle-color) 70%, transparent);
    animation: fireflyPulse 2.6s ease-in-out infinite;
  }

  @keyframes themeParticleFloat {
    0% {
      transform: translate3d(0, 110vh, 0) rotate(0deg);
      opacity: 0;
    }

    10% {
      opacity: 0.75;
    }

    90% {
      opacity: 0.55;
    }

    100% {
      transform: translate3d(var(--drift), -120vh, 0) rotate(var(--spin));
      opacity: 0;
    }
  }

  @keyframes themePetalFall {
    0% {
      transform: translate3d(0, -40px, 0) rotate(0deg);
      opacity: 0;
    }

    10% {
      opacity: 1;
    }

    90% {
      opacity: 0.72;
    }

    100% {
      transform: translate3d(var(--drift), 115vh, 0) rotate(var(--spin));
      opacity: 0;
    }
  }

  @keyframes themePetalSway {
    0%, 100% {
      transform: translateX(0) rotate(var(--start-rot));
    }

    50% {
      transform: translateX(var(--sway)) rotate(calc(var(--start-rot) + 10deg));
    }
  }

  @keyframes waveMove {
    0%, 100% {
      transform: translateY(0) skewY(-2deg);
    }

    50% {
      transform: translateY(-18px) skewY(2deg);
    }
  }

  @keyframes forestGlow {
    0%, 100% {
      opacity: 0.65;
    }

    50% {
      opacity: 1;
    }
  }

  @keyframes fireflyPulse {
    0%, 100% {
      transform: scale(0.9);
      opacity: 0.45;
    }

    50% {
      transform: scale(1.25);
      opacity: 1;
    }
  }

  @media (max-width: 640px) {
    .theme-moon {
      top: 88px;
      right: 5%;
      width: 72px;
      height: 72px;
    }

    .theme-sun {
      top: 88px;
      left: 5%;
      width: 92px;
      height: 92px;
    }

    .theme-cloud.one {
      width: 160px;
      height: 52px;
      top: 148px;
    }

    .theme-cloud.two {
      width: 130px;
      height: 44px;
      top: 132px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .theme-particle,
    .theme-petal-svg,
    .theme-wave,
    .theme-forest-glow,
    .theme-firefly {
      animation: none;
    }
  }
`;

function isThemeKey(value: string | null | undefined): value is BackdropTheme {
    return (
        value === "aurora" ||
        value === "moonlight" ||
        value === "breeze" ||
        value === "ocean" ||
        value === "rose" ||
        value === "cosmic" ||
        value === "forest" ||
        value === "sunset"
    );
}

function randomFrom<T>(items: readonly T[]) {
    return items[Math.floor(Math.random() * items.length)];
}

function generateParticles(theme: BackdropTheme): ThemeParticle[] {
    const config = THEME_PARTICLE_MAP[theme];

    return Array.from({ length: config.count }, (_, index) => {
        const chosenKind = randomFrom(config.kinds);
        const size =
            config.minSize + Math.random() * (config.maxSize - config.minSize);

        if (chosenKind === "petal") {
            return {
                id: index,
                left: Math.random() * 100,
                delay: Math.random() * config.maxDuration,
                duration:
                    config.minDuration +
                    Math.random() * (config.maxDuration - config.minDuration),
                size,
                drift: (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 60),
                spin: Math.random() * 720 - 360,
                color: randomFrom(config.colors),
                kind: "petal",
                shape: randomFrom(PETAL_SHAPES),
                sway: (Math.random() > 0.5 ? 1 : -1) * (8 + Math.random() * 18),
                swayDuration: 2.8 + Math.random() * 2.2,
                startRotation: Math.random() * 360,
            };
        }

        if (chosenKind === "wind") {
            return {
                id: index,
                left: Math.random() * 100,
                delay: Math.random() * config.maxDuration,
                duration:
                    config.minDuration +
                    Math.random() * (config.maxDuration - config.minDuration),
                size,
                drift: (Math.random() > 0.5 ? 1 : -1) * (40 + Math.random() * 80),
                spin: Math.random() * 80 - 40,
                color: randomFrom(config.colors),
                kind: "wind",
            };
        }

        if (chosenKind === "bubble") {
            return {
                id: index,
                left: Math.random() * 100,
                delay: Math.random() * config.maxDuration,
                duration:
                    config.minDuration +
                    Math.random() * (config.maxDuration - config.minDuration),
                size,
                drift: (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 60),
                spin: Math.random() * 180 - 90,
                color: randomFrom(config.colors),
                kind: "bubble",
            };
        }

        if (chosenKind === "firefly") {
            return {
                id: index,
                left: Math.random() * 100,
                delay: Math.random() * config.maxDuration,
                duration:
                    config.minDuration +
                    Math.random() * (config.maxDuration - config.minDuration),
                size,
                drift: (Math.random() > 0.5 ? 1 : -1) * (25 + Math.random() * 55),
                spin: 0,
                color: randomFrom(config.colors),
                kind: "firefly",
            };
        }

        return {
            id: index,
            left: Math.random() * 100,
            delay: Math.random() * config.maxDuration,
            duration:
                config.minDuration +
                Math.random() * (config.maxDuration - config.minDuration),
            size,
            drift: (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 70),
            spin: Math.random() * 240 - 120,
            color: randomFrom(config.colors),
            kind: "symbol",
            symbol: randomFrom(config.symbols),
        };
    });
}

function getThemeFromDocument(): BackdropTheme {
    if (typeof document === "undefined") return "aurora";

    const currentTheme = document.documentElement.dataset.theme;
    return isThemeKey(currentTheme) ? currentTheme : "aurora";
}

function useDocumentTheme() {
    const [theme, setTheme] = useState<BackdropTheme>("aurora");

    useEffect(() => {
        setTheme(getThemeFromDocument());

        const observer = new MutationObserver(() => {
            setTheme(getThemeFromDocument());
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"],
        });

        return () => observer.disconnect();
    }, []);

    return theme;
}

function ThemeExtras({ theme }: { theme: BackdropTheme }) {
    if (theme === "moonlight") {
        return (
            <>
                <div className="theme-fixed-orb theme-moon" />
                <div className="theme-cloud one" />
                <div className="theme-cloud two" />
            </>
        );
    }

    if (theme === "breeze") {
        return (
            <>
                <div className="theme-cloud one" />
                <div className="theme-cloud two" />
            </>
        );
    }

    if (theme === "ocean") {
        return <div className="theme-wave" />;
    }

    if (theme === "forest") {
        return <div className="theme-forest-glow" />;
    }

    if (theme === "sunset") {
        return <div className="theme-fixed-orb theme-sun" />;
    }

    return null;
}

function ParticleView({ particle }: { particle: ThemeParticle }) {
    const baseStyle = {
        "--left": `${particle.left}%`,
        "--size": `${particle.size}px`,
        "--duration": `${particle.duration}s`,
        "--delay": `${particle.delay}s`,
        "--drift": `${particle.drift}px`,
        "--spin": `${particle.spin}deg`,
        "--particle-color": particle.color,
        "--sway": `${particle.sway ?? 0}px`,
        "--sway-duration": `${particle.swayDuration ?? 3}s`,
        "--start-rot": `${particle.startRotation ?? 0}deg`,
        width: `${particle.size}px`,
        height: `${particle.size}px`,
    } as CSSProperties;

    if (particle.kind === "petal" && particle.shape) {
        return (
            <div className="theme-particle fall" style={baseStyle}>
                <svg
                    className="theme-petal-svg"
                    width={particle.size * 2}
                    height={particle.size * 2}
                    viewBox="-12 -24 24 28"
                >
                    <path d={particle.shape} fill={particle.color} />
                </svg>
            </div>
        );
    }

    if (particle.kind === "wind") {
        return (
            <div className="theme-particle float" style={baseStyle}>
                <div className="theme-wind-line" />
            </div>
        );
    }

    if (particle.kind === "bubble") {
        return (
            <div className="theme-particle float" style={baseStyle}>
                <div className="theme-bubble" />
            </div>
        );
    }

    if (particle.kind === "firefly") {
        return (
            <div className="theme-particle float" style={baseStyle}>
                <div className="theme-firefly" />
            </div>
        );
    }

    return (
        <div className="theme-particle float" style={baseStyle}>
            <div className="theme-symbol">{particle.symbol}</div>
        </div>
    );
}

export function ThemeBackdrop() {
    const theme = useDocumentTheme();
    const [particles, setParticles] = useState<ThemeParticle[]>([]);

    useEffect(() => {
        setParticles(generateParticles(theme));
    }, [theme]);

    return (
        <>
            <style>{THEME_BACKDROP_CSS}</style>

            <div className="theme-extra-bg">
                <ThemeExtras theme={theme} />

                {particles.map((particle) => (
                    <ParticleView key={`${theme}-${particle.id}`} particle={particle} />
                ))}
            </div>
        </>
    );
}