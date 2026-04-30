"use client";

import { useRef } from "react";
import { PETAL_SHAPES, PETAL_COLORS } from "../../lib/constants";

interface Petal {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  shape: string;
  sway: number;
  swayDur: number;
  startRot: number;
  endRot: number;
}

function generatePetals(count = 28): Petal[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left:     Math.random() * 100,
    delay:    Math.random() * 12,
    duration: 7 + Math.random() * 9,
    size:     10 + Math.random() * 16,
    color:    PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    shape:    PETAL_SHAPES[Math.floor(Math.random() * PETAL_SHAPES.length)],
    sway:     (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 60),
    swayDur:  3 + Math.random() * 3,
    startRot: Math.random() * 360,
    endRot:   Math.random() * 720 - 360,
  }));
}

/**
 * PetalCanvas
 * ───────────
 * Ambient falling-petal effect. Fully isolated — no props, no state.
 * Petals are generated once on mount via useRef so they never re-randomise
 * on re-renders of parent components.
 *
 * Performance note: all animation is CSS-driven (zero JS on every frame).
 * Safe to render on every page — fixed-position, pointer-events: none.
 */
export function PetalCanvas() {
  const petals = useRef<Petal[]>(generatePetals()).current;

  return (
    <div className="petal-canvas">
      {petals.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: -60,
            animation: `petalFall ${p.duration}s linear ${p.delay}s infinite`,
            ["--sway" as string]: `${p.sway}px`,
            ["--sw"   as string]: `${p.sway}px`,
            ["--rot"  as string]: `${p.endRot}deg`,
          }}
        >
          <svg
            width={p.size * 2}
            height={p.size * 2}
            viewBox="-12 -24 24 28"
            style={{
              transform: `rotate(${p.startRot}deg)`,
              filter: "blur(0.5px)",
              animation: `sway ${p.swayDur}s ease-in-out ${p.delay}s infinite`,
              ["--sw" as string]: `${p.sway * 0.3}px`,
            }}
          >
            <path d={p.shape} fill={p.color} />
          </svg>
        </div>
      ))}
    </div>
  );
}