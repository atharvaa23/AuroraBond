"use client";

import type { PageKey, User, Partner } from "../../lib/types";
import { NAV_LINKS } from "../../lib/constants";

interface NavbarProps {
  page: PageKey;
  setPage: (page: PageKey) => void;
  user: User | null;
  partner: Partner | null;
}

const NAV_CSS = `
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 40px;
    background: rgba(7,4,15,0.6);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }
  .nav-logo {
    font-family: var(--font-serif);
    font-size: 22px; font-weight: 300; letter-spacing: 3px;
    background: linear-gradient(135deg, var(--aurora1), var(--aurora2), var(--aurora3));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; cursor: pointer;
  }
  .nav-links { display: flex; gap: 8px; align-items: center; }
  .nav-btn {
    background: none; border: 1px solid var(--border); color: var(--muted);
    padding: 6px 16px; border-radius: var(--radius-full); cursor: pointer;
    font-family: var(--font-sans); font-size: 12px; letter-spacing: 0.5px;
    transition: all 0.3s ease;
  }
  .nav-btn:hover { border-color: var(--aurora1); color: var(--aurora1); background: rgba(192,132,252,0.08); }
  .nav-btn.active { border-color: var(--aurora1); color: var(--aurora1); background: rgba(192,132,252,0.1); }
  .nav-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    border: 1.5px solid var(--aurora1);
    object-fit: cover; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; background: rgba(192,132,252,0.15);
    transition: all 0.3s;
  }
  .nav-avatar:hover { border-color: var(--aurora2); transform: scale(1.05); }
  @media (max-width: 640px) {
    .nav { padding: 16px 20px; }
    .nav-logo { font-size: 18px; }
  }
`;

/**
 * Navbar
 * ──────
 * Owns: navigation link rendering, active-state highlighting.
 * Does NOT own: page content, auth state.
 *
 * Firebase-ready: user avatar can swap to a real profile photo URL.
 */
export function Navbar({ page, setPage, user }: NavbarProps) {
  return (
    <>
      <style>{NAV_CSS}</style>
      <nav className="nav">
        <div className="nav-logo" onClick={() => setPage("dashboard")}>
          AuroraBond
        </div>

        <div className="nav-links">
          {NAV_LINKS.map(({ label, page: p }) => (
            <button
              key={p}
              className={`nav-btn ${page === p ? "active" : ""}`}
              onClick={() => setPage(p as PageKey)}
            >
              {label}
            </button>
          ))}

          <div
            className="nav-avatar"
            onClick={() => setPage("settings")}
            title="Settings"
          >
            {user?.avatar ?? "💜"}
          </div>
        </div>
      </nav>
    </>
  );
}