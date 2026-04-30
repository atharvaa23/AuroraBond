"use client";

import type { PageKey } from "../../lib/types";
import { PetalCanvas } from "../ui/PetalCanvas";

interface LandingPageProps {
  setPage: (page: PageKey) => void;
}

const LANDING_CSS = `
  .landing {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; position: relative; z-index: 2;
    padding: 20px;
  }
  .landing-eyebrow {
    font-size: 11px; letter-spacing: 5px; text-transform: uppercase;
    color: var(--aurora1); margin-bottom: 28px;
    animation: fadeInUp 1s ease 0.2s both;
  }
  .landing-title {
    font-family: var(--font-serif);
    font-size: clamp(60px, 10vw, 120px); font-weight: 300; line-height: 0.95;
    margin-bottom: 24px; animation: fadeInUp 1s ease 0.4s both;
    background: linear-gradient(135deg, #fff 0%, var(--aurora2) 40%, var(--aurora1) 70%, var(--aurora3) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .landing-sub {
    font-size: 16px; color: var(--muted); letter-spacing: 1px; max-width: 400px;
    line-height: 1.8; margin-bottom: 48px; animation: fadeInUp 1s ease 0.6s both;
  }
  .landing-cta {
    display: flex; gap: 16px; align-items: center; justify-content: center;
    animation: fadeInUp 1s ease 0.8s both; flex-wrap: wrap;
  }
`;

/**
 * LandingPage
 * ───────────
 * Pure display component — no state, no side effects.
 * Owns: hero layout, CTA buttons, background effects.
 * Does NOT own: auth, routing logic (delegated via setPage).
 */
export function LandingPage({ setPage }: LandingPageProps) {
  return (
    <>
      <style>{LANDING_CSS}</style>
      <div className="page">
        <div className="aurora-bg" />
        <PetalCanvas />

        <div className="landing">
          <div className="landing-eyebrow">✦ A shared emotional universe ✦</div>
          <h1 className="landing-title">
            Aurora
            <br />
            Bond
          </h1>
          <p className="landing-sub">
            The space where two hearts share one living, breathing digital world.
          </p>
          <div className="landing-cta">
            <button className="btn-primary" onClick={() => setPage("login")}>
              Enter Our Universe
            </button>
            <button className="btn-ghost" onClick={() => setPage("login")}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    </>
  );
}