"use client";

import type { PageKey, User, Partner } from "../../lib/types";
import { NAV_LINKS } from "../../lib/constants";

interface NavbarProps {
  page: PageKey;
  setPage: (page: PageKey) => void;
  user: User | null;
  partner: Partner | null;
  hasUnreadChat?: boolean;
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
    background: rgba(7,4,15,0.72);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }

  .nav-logo {
    font-family: var(--font-serif);
    font-size: 22px;
    font-weight: 300;
    letter-spacing: 3px;
    background: linear-gradient(135deg, var(--aurora1), var(--aurora2), var(--aurora3));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    cursor: pointer;
    white-space: nowrap;
  }

  .desktop-nav-links {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .nav-btn {
    position: relative;
    background: none;
    border: 1px solid var(--border);
    color: var(--muted);
    padding: 6px 16px;
    border-radius: var(--radius-full);
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 12px;
    letter-spacing: 0.5px;
    transition: all 0.3s ease;
    white-space: nowrap;
  }

  .nav-btn:hover {
    border-color: var(--aurora1);
    color: var(--aurora1);
    background: rgba(192,132,252,0.08);
  }

  .nav-btn.active {
    border-color: var(--aurora1);
    color: var(--aurora1);
    background: rgba(192,132,252,0.1);
  }

  .nav-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1.5px solid var(--aurora1);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    background: rgba(192,132,252,0.15);
    transition: all 0.3s;
    flex-shrink: 0;
  }

  .nav-avatar:hover {
    border-color: var(--aurora2);
    transform: scale(1.05);
  }

  .nav-unread-dot {
    position: absolute;
    top: -4px;
    right: -3px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #fb7185;
    box-shadow: 0 0 12px rgba(251,113,133,0.8);
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
      font-size: 18px;
      letter-spacing: 2px;
      max-width: calc(100vw - 90px);
      overflow: hidden;
      text-overflow: ellipsis;
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

      width: calc(100% - 20px);
      max-width: 430px;

      transform: translateX(-50%);

      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(78px, 1fr));
  gap: 7px;
  padding: 9px;

  align-items: center;
  justify-items: center;

  background: rgba(7,4,15,0.88);
  border: 1px solid var(--border);
  border-radius: 24px;
  backdrop-filter: blur(24px);
  box-shadow: 0 14px 45px rgba(0,0,0,0.45);
}

.mobile-nav-tabs .nav-btn {
  width: 100%;
  height: 38px;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 0 4px;
  border-radius: 15px;
  font-size: 9.5px;
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
    max-width: 340px;
    grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  }

  .mobile-nav-tabs .nav-btn {
    height: 36px;
    font-size: 9px;
  }
}
`;

export function Navbar({
  page,
  setPage,
  user,
  hasUnreadChat = false,
}: NavbarProps) {
  const renderNavButton = (label: string, p: string) => {
    const isChat = p === "chat";
    const showUnread = isChat && hasUnreadChat && page !== "chat";

    return (
      <button
        key={p}
        className={`nav-btn ${page === p ? "active" : ""}`}
        onClick={() => setPage(p as PageKey)}
        type="button"
      >
        {label}
        {showUnread && <span className="nav-unread-dot" />}
      </button>
    );
  };

  return (
    <>
      <style>{NAV_CSS}</style>

      <nav className="nav-top">
        <div className="nav-logo" onClick={() => setPage("dashboard")}>
          AuroraBond
        </div>

        <div className="desktop-nav-links">
          {NAV_LINKS.map(({ label, page: p }) => renderNavButton(label, p))}
        </div>

        <div
          className="nav-avatar"
          onClick={() => setPage("settings")}
          title="Settings"
        >
          {user?.avatar ?? "💜"}
        </div>
      </nav>

      <div className="mobile-nav-tabs">
        {NAV_LINKS.map(({ label, page: p }) => renderNavButton(label, p))}
      </div>
    </>
  );
}