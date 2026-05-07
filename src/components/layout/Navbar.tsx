"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PageKey, User, Partner } from "../../lib/types";
import { NAV_LINKS } from "../../lib/constants";

interface NavbarProps {
  page?: PageKey;
  setPage?: (page: PageKey) => void;
  user: User | null;
  partner?: Partner | null;
  hasUnreadChat?: boolean;
}

const PAGE_PATHS: Record<string, string> = {
  landing: "/",
  login: "/login",
  dashboard: "/dashboard",
  weather: "/weather",
  movies: "/movies",
  chat: "/chat",
  games: "/games",
  music: "/music",
  story: "/story",
  settings: "/settings",
  memories: "/memories",
  bucket: "/bucket",
};

function getPagePath(page: PageKey | string) {
  return PAGE_PATHS[page] ?? "/dashboard";
}

const NAV_CSS = `
  .nav-top {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;

    height: 74px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 0 40px;
    background: var(--nav-bg);
    backdrop-filter: blur(22px);
    border-bottom: 1px solid var(--nav-border);
    box-shadow: var(--nav-shadow);
  }

  .nav-logo {
    font-family: var(--font-serif);
    font-size: 22px;
    font-weight: 300;
    letter-spacing: 3px;
    white-space: nowrap;
    cursor: pointer;
    text-decoration: none;

    background: linear-gradient(
      135deg,
      var(--aurora1),
      var(--aurora2),
      var(--aurora3)
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .desktop-nav-links {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);

    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .nav-btn {
    position: relative;

    border: 1px solid var(--border);
    background: color-mix(in srgb, var(--bg2) 36%, transparent);
    color: var(--muted);

    padding: 6px 16px;
    border-radius: var(--radius-full);

    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 12px;
    letter-spacing: 0.5px;
    white-space: nowrap;

    transition: all 0.25s ease;
    text-decoration: none;

    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .nav-btn:hover {
    border-color: var(--aurora1);
    color: var(--aurora1);
    background: color-mix(in srgb, var(--aurora1) 10%, transparent);
    box-shadow: 0 0 16px color-mix(in srgb, var(--aurora1) 18%, transparent);
  }

  .nav-btn.active {
    border-color: var(--aurora1);
    color: var(--text);
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--aurora1) 18%, transparent),
      color-mix(in srgb, var(--aurora3) 10%, transparent)
    );
    box-shadow: 0 0 18px color-mix(in srgb, var(--aurora1) 16%, transparent);
  }

  .nav-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1.5px solid var(--aurora1);

    display: flex;
    align-items: center;
    justify-content: center;

    cursor: pointer;
    font-size: 14px;
    background: color-mix(in srgb, var(--aurora1) 16%, transparent);
    transition: all 0.25s ease;
    flex-shrink: 0;
    text-decoration: none;
    box-shadow: 0 0 16px color-mix(in srgb, var(--aurora1) 10%, transparent);
  }

  .nav-avatar:hover {
    border-color: var(--aurora2);
    transform: scale(1.05);
    box-shadow: 0 0 22px color-mix(in srgb, var(--aurora2) 20%, transparent);
  }

  .nav-unread-dot {
    position: absolute;
    top: -4px;
    right: -3px;

    width: 9px;
    height: 9px;
    border-radius: 50%;

    background: var(--aurora3);
    box-shadow: 0 0 12px color-mix(in srgb, var(--aurora3) 80%, transparent);
  }

  .mobile-nav-tabs {
    display: none;
  }

  @media (max-width: 760px) {
    .nav-top {
      height: 64px;
      padding: 0 18px;
    }

    .nav-logo {
      max-width: calc(100vw - 90px);
      overflow: hidden;
      text-overflow: ellipsis;

      font-size: 18px;
      letter-spacing: 2px;
    }

    .desktop-nav-links {
      display: none;
    }

    .nav-avatar {
      width: 32px;
      height: 32px;
      font-size: 13px;
    }

    .mobile-nav-tabs {
      position: fixed;
      left: 50%;
      bottom: 10px;
      z-index: 150;

      width: calc(100% - 28px);
      max-width: 360px;

      transform: translateX(-50%);

      display: grid;
      grid-template-columns: repeat(3, 1fr);
      align-items: center;
      justify-items: center;
      gap: 8px;

      padding: 9px;

      background: var(--mobile-nav-bg);
      border: 1px solid var(--nav-border);
      border-radius: 24px;
      backdrop-filter: blur(24px);
      box-shadow: var(--mobile-nav-shadow);
    }

    .mobile-nav-tabs .nav-btn {
      width: 100%;
      height: 38px;

      display: flex;
      align-items: center;
      justify-content: center;

      padding: 0 6px;
      border-radius: 15px;

      font-size: 10px;
      letter-spacing: 0;
      text-align: center;

      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mobile-nav-tabs .nav-unread-dot {
      top: 5px;
      right: 8px;
      width: 8px;
      height: 8px;
    }

    body {
      padding-bottom: 92px;
    }
  }

  @media (max-width: 380px) {
    .mobile-nav-tabs {
      width: calc(100% - 18px);
      max-width: 330px;
      gap: 6px;
      padding: 8px;
    }

    .mobile-nav-tabs .nav-btn {
      height: 36px;
      font-size: 9px;
      padding: 0 4px;
    }
  }
`;

export function Navbar({ user, hasUnreadChat = false }: NavbarProps) {
  const pathname = usePathname();

  const renderNavButton = (label: string, targetPage: PageKey | string) => {
    const href = getPagePath(targetPage);
    const isActive = pathname === href;
    const showUnread =
      targetPage === "chat" && hasUnreadChat && pathname !== "/chat";

    return (
      <Link
        key={targetPage}
        href={href}
        className={`nav-btn ${isActive ? "active" : ""}`}
      >
        {label}
        {showUnread && <span className="nav-unread-dot" />}
      </Link>
    );
  };

  return (
    <>
      <style>{NAV_CSS}</style>

      <nav className="nav-top">
        <Link href="/dashboard" className="nav-logo">
          AuroraBond
        </Link>

        <div className="desktop-nav-links">
          {NAV_LINKS.map(({ label, page: targetPage }) =>
            renderNavButton(label, targetPage)
          )}
        </div>

        <Link href="/settings" className="nav-avatar" title="Settings">
          {user?.avatar ?? "💜"}
        </Link>
      </nav>

      <div className="mobile-nav-tabs">
        {NAV_LINKS.map(({ label, page: targetPage }) =>
          renderNavButton(label, targetPage)
        )}
      </div>
    </>
  );
}