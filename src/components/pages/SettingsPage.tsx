"use client";

import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { AVATARS, THEME_OPTIONS } from "../../lib/constants";
import { ThemeBackdrop } from "../ui/ThemeBackdrop";
import type { User, Partner, Bond, ThemeKey } from "../../lib/types";
import { WeatherLocationSettings } from "../WeatherLocationSettings";

interface SettingsPageProps {
  user: User | null;
  setUser: (user: User) => void;
  partner: Partner | null;
  setPartner?: (partner: Partner) => void;
  reunionDate: string;
  setReunionDate: (date: string) => void;
  bond: Bond | null;
}

type BondWithCode = Bond & {
  code?: string;
  bondCode?: string;
  inviteCode?: string;
  pairingCode?: string;
};

function cleanText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

const SETTINGS_CSS = `
  .settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .settings-wide {
    grid-column: span 2;
  }

  @media (max-width: 640px) {
    .settings-grid {
      grid-template-columns: 1fr;
    }

    .settings-wide {
      grid-column: span 1;
    }
  }

  .settings-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 28px;
    backdrop-filter: blur(20px);
  }

  .settings-card-title {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--aurora1);
    margin-bottom: 20px;
  }

  .avatar-preview {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 2px dashed var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    margin: 0 auto 16px;
    background: rgba(255,255,255,0.03);
    transition: all 0.3s;
  }

  .avatar-chip-sm {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 18px;
    transition: all 0.2s;
    border: 1.5px solid var(--border);
    background: rgba(255,255,255,0.03);
  }

  .avatar-chip-sm.selected {
    border-color: var(--aurora1);
    background: rgba(192,132,252,0.15);
  }

  .theme-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }

  .theme-option {
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.04);
    color: var(--text);
    border-radius: 18px;
    padding: 14px;
    cursor: pointer;
    text-align: left;
    transition: all 0.25s ease;
    font-family: var(--font-sans);
  }

  .theme-option:hover {
    border-color: var(--aurora1);
    transform: translateY(-1px);
  }

  .theme-option.active {
    border-color: var(--aurora1);
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--aurora1) 18%, transparent),
      color-mix(in srgb, var(--aurora3) 10%, transparent)
    );
    box-shadow: 0 0 18px color-mix(in srgb, var(--aurora1) 18%, transparent);
  }

  .theme-preview {
    height: 42px;
    border-radius: 14px;
    margin-bottom: 12px;
    border: 1px solid var(--border);
    position: relative;
    overflow: hidden;
  }

  .theme-preview::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(255,255,255,0.16),
      transparent 42%,
      rgba(255,255,255,0.06)
    );
    pointer-events: none;
  }

  .theme-name {
    font-size: 13px;
    margin-bottom: 4px;
  }

  .theme-desc {
    color: var(--muted);
    font-size: 11px;
    line-height: 1.5;
  }

  .theme-preview[data-theme-preview="aurora"] {
    background:
      radial-gradient(circle at 20% 25%, #7dd3fc, transparent 34%),
      radial-gradient(circle at 75% 70%, #fb7185, transparent 36%),
      linear-gradient(135deg, #050816, #0b1026);
  }

  .theme-preview[data-theme-preview="moonlight"] {
    background:
      radial-gradient(circle at 24% 28%, #e0f2fe, transparent 18%),
      radial-gradient(circle at 72% 26%, #93c5fd, transparent 28%),
      radial-gradient(circle at 76% 76%, #c4b5fd, transparent 34%),
      linear-gradient(135deg, #020617, #111827);
  }

  .theme-preview[data-theme-preview="breeze"] {
    background:
      linear-gradient(120deg, transparent 18%, rgba(255,255,255,0.34) 20%, transparent 24%),
      radial-gradient(circle at 20% 25%, #67e8f9, transparent 34%),
      radial-gradient(circle at 78% 72%, #bae6fd, transparent 36%),
      linear-gradient(135deg, #04121c, #083344);
  }

  .theme-preview[data-theme-preview="ocean"] {
    background:
      radial-gradient(circle at 20% 25%, #38bdf8, transparent 34%),
      radial-gradient(circle at 75% 70%, #818cf8, transparent 36%),
      linear-gradient(135deg, #03111f, #062033);
  }

  .theme-preview[data-theme-preview="rose"] {
    background:
      radial-gradient(circle at 20% 25%, #f9a8d4, transparent 34%),
      radial-gradient(circle at 75% 70%, #fb7185, transparent 36%),
      linear-gradient(135deg, #170712, #25101d);
  }

  .theme-preview[data-theme-preview="cosmic"] {
    background:
      radial-gradient(circle at 20% 25%, #a78bfa, transparent 34%),
      radial-gradient(circle at 75% 70%, #f0abfc, transparent 36%),
      linear-gradient(135deg, #08051a, #120a2e);
  }

  .theme-preview[data-theme-preview="forest"] {
    background:
      radial-gradient(circle at 20% 25%, #6ee7b7, transparent 34%),
      radial-gradient(circle at 75% 70%, #a7f3d0, transparent 36%),
      linear-gradient(135deg, #04120d, #092019);
  }

  .theme-preview[data-theme-preview="sunset"] {
    background:
      radial-gradient(circle at 20% 25%, #fb923c, transparent 34%),
      radial-gradient(circle at 75% 70%, #f472b6, transparent 36%),
      linear-gradient(135deg, #170b08, #28120d);
  }

  .reunion-highlight {
    width: fit-content;
    min-width: 130px;
    margin: 18px auto 0;
    padding: 16px 24px;
    background: color-mix(in srgb, var(--aurora1) 12%, transparent);
    border-radius: 12px;
    border: 1px solid var(--aurora1);
    text-align: center;
  }

  .save-success {
    color: #86efac;
  }

  .bond-code-box {
    width: 100%;
    padding: 14px 18px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.04);
    color: var(--text);
    font-family: monospace;
    font-size: 18px;
    letter-spacing: 2px;
    text-align: center;
    user-select: all;
  }

  .settings-action-row {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 16px;
  }

  .small-settings-btn {
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.05);
    color: var(--text);
    padding: 10px 18px;
    border-radius: 999px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.25s ease;
  }

  .small-settings-btn:hover {
    border-color: var(--aurora1);
    color: var(--aurora1);
    box-shadow: 0 0 14px color-mix(in srgb, var(--aurora1) 25%, transparent);
    transform: translateY(-1px);
  }

  .logout-card {
    border-color: rgba(251,113,133,0.35);
  }

  .logout-btn {
    border: 1px solid rgba(251,113,133,0.45);
    background: rgba(251,113,133,0.08);
    color: #fb7185;
    padding: 11px 22px;
    border-radius: 999px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.25s ease;
  }

  .logout-btn:hover {
    background: rgba(251,113,133,0.18);
    color: white;
    box-shadow: 0 0 16px rgba(251,113,133,0.35);
    transform: translateY(-1px);
  }

  .logout-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .settings-muted {
    color: var(--muted);
    font-size: 13px;
    line-height: 1.6;
  }

  .reunion-date-block {
    max-width: 430px;
    margin: 0 auto;
  }

  .settings-save-wrap {
    display: flex;
    justify-content: center;
    margin-top: 32px;
  }

  .settings-save-wrap .save-btn {
    max-width: 300px;
    width: 100%;
  }

  @media (max-width: 900px) {
    .theme-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 760px) {
    .theme-grid {
      grid-template-columns: 1fr;
    }
  }
`;

interface ProfileCardProps {
  title: string;
  value: {
    name: string;
    nickname: string;
    avatar: string;
  };
  onChange: (
    updates: Partial<{
      name: string;
      nickname: string;
      avatar: string;
    }>
  ) => void;
  nameLabel?: string;
  nicknameLabel?: string;
  locked?: boolean;
}

function ProfileCard({
  title,
  value,
  onChange,
  nameLabel = "Name",
  nicknameLabel = "Nickname",
  locked = false,
}: ProfileCardProps) {
  return (
    <div className="settings-card">
      <div className="settings-card-title">{title}</div>

      <div className="avatar-preview">{value.avatar}</div>

      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        {AVATARS.map((a) => (
          <div
            key={a}
            className={`avatar-chip-sm ${value.avatar === a ? "selected" : ""}`}
            onClick={() => !locked && onChange({ avatar: a })}
            style={{
              opacity: locked ? 0.45 : 1,
              cursor: locked ? "not-allowed" : "pointer",
            }}
          >
            {a}
          </div>
        ))}
      </div>

      <div className="input-wrap">
        <label className="input-label">{nameLabel}</label>
        <input
          className="input-field"
          value={value.name}
          disabled={locked}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <div className="input-wrap">
        <label className="input-label">{nicknameLabel}</label>
        <input
          className="input-field"
          value={value.nickname}
          disabled={false}
          onChange={(e) => onChange({ nickname: e.target.value })}
        />
      </div>
    </div>
  );
}

export function SettingsPage({
  user,
  setUser,
  partner,
  reunionDate,
  setReunionDate,
  bond,
}: SettingsPageProps) {
  const [myForm, setMyForm] = useState({
    name: user?.name ?? "",
    nickname: user?.nickname ?? "",
    avatar: user?.avatar ?? "💜",
  });

  const [partForm, setPartForm] = useState({
    name: partner?.name ?? "",
    nickname:
      bond?.nicknames?.[partner?.uid || ""] ??
      partner?.nickname ??
      "",
    avatar: partner?.avatar ?? "🌸",
  });

  const [theme, setTheme] = useState<ThemeKey>(bond?.theme ?? "aurora");
  const [reunion, setReunion] = useState(reunionDate ?? "");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const bondData = bond as BondWithCode | null;

  const bondingCode =
    bondData?.bondCode ||
    bondData?.code ||
    bondData?.inviteCode ||
    bondData?.pairingCode ||
    "";

  useEffect(() => {
    setMyForm({
      name: user?.name ?? "",
      nickname:
        bond?.nicknames?.[user?.uid || ""] ??
        user?.nickname ??
        "",
      avatar: user?.avatar ?? "💜",
    });
  }, [user, bond?.nicknames]);

  useEffect(() => {
    setPartForm({
      name: partner?.name ?? "",
      nickname:
        bond?.nicknames?.[partner?.uid || ""] ??
        partner?.nickname ??
        "",
      avatar: partner?.avatar ?? "🌸",
    });
  }, [partner, bond?.nicknames]);

  useEffect(() => {
    setTheme(bond?.theme ?? "aurora");
  }, [bond?.theme]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("aurora-theme", theme);
  }, [theme]);

  useEffect(() => {
    setReunion(reunionDate ?? "");
  }, [reunionDate]);

  const save = async () => {
    if (!auth.currentUser || !user?.bondId || !user?.uid) return;

    const cleanedMyName = cleanText(myForm.name) || cleanText(user.name) || "You";
    const cleanedMyNickname = cleanText(myForm.nickname) || cleanedMyName;

    const cleanedPartnerName =
      cleanText(partForm.name) || cleanText(partner?.name) || "Partner";

    const cleanedPartnerNickname =
      cleanText(partForm.nickname) || cleanedPartnerName;

    const newUser: User = {
      ...(user as User),
      name: cleanedMyName,
      nickname: cleanedMyNickname,
      avatar: myForm.avatar,
    };

    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      name: cleanedMyName,
      nickname: cleanedMyNickname,
      avatar: myForm.avatar,
    });

    const bondUpdates: Record<string, string> = {
      reunionDate: reunion,
      theme,
      [`nicknames.${user.uid}`]: cleanedMyNickname,
    };

    if (partner?.uid) {
      bondUpdates[`nicknames.${partner.uid}`] = cleanedPartnerNickname;
    }

    await updateDoc(doc(db, "bonds", user.bondId), bondUpdates);

    setMyForm({
      name: cleanedMyName,
      nickname: cleanedMyNickname,
      avatar: myForm.avatar,
    });

    setPartForm((current) => ({
      ...current,
      name: cleanedPartnerName,
      nickname: cleanedPartnerNickname,
    }));

    setUser(newUser);
    setReunionDate(reunion);

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const copyBondingCode = async () => {
    if (!bondingCode) return;

    try {
      await navigator.clipboard.writeText(bondingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy bonding code error:", error);
      alert("Could not copy bonding code.");
    }
  };

  const logout = async () => {
    const confirmLogout = window.confirm("Log out of AuroraBond?");
    if (!confirmLogout) return;

    try {
      setLoggingOut(true);
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      alert("Could not log out. Check console for details.");
    } finally {
      setLoggingOut(false);
    }
  };

  const daysToGo = reunion
    ? Math.max(
      0,
      Math.ceil((new Date(reunion).getTime() - Date.now()) / 86_400_000)
    )
    : null;

  return (
    <>
      <style>{SETTINGS_CSS}</style>

      <div className="page">
        <div className="aurora-bg" />
        <ThemeBackdrop />

        <div className="inner-wrap">
          <div className="page-title">
            <span>Settings</span>
          </div>

          <div className="page-sub">Personalise your shared universe.</div>

          <div className="settings-grid">
            <ProfileCard
              title="Your Profile"
              value={myForm}
              onChange={(u) => setMyForm((f) => ({ ...f, ...u }))}
            />

            <ProfileCard
              title="Partner's Profile"
              value={partForm}
              onChange={(u) => setPartForm((f) => ({ ...f, ...u }))}
              nameLabel="Partner Name"
              nicknameLabel="Their Nickname"
              locked
            />

            <div className="settings-card settings-wide">
              <div className="settings-card-title">Shared App Theme</div>

              <div className="settings-muted" style={{ marginBottom: 18 }}>
                This theme is shared by both of you. When one person changes it,
                AuroraBond updates for the bond.
              </div>

              <div className="theme-grid">
                {THEME_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    className={`theme-option ${theme === option.key ? "active" : ""
                      }`}
                    type="button"
                    onClick={() => setTheme(option.key)}
                  >
                    <div
                      className="theme-preview"
                      data-theme-preview={option.key}
                    />

                    <div className="theme-name">{option.label}</div>
                    <div className="theme-desc">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-card settings-wide">
              <div className="settings-card-title">Bonding Code</div>

              {bondingCode ? (
                <>
                  <div className="bond-code-box">{bondingCode}</div>

                  <div className="settings-action-row">
                    <button
                      className="small-settings-btn"
                      type="button"
                      onClick={copyBondingCode}
                    >
                      {copied ? "Copied ✓" : "Copy code"}
                    </button>
                  </div>

                  <div className="settings-muted" style={{ marginTop: 12 }}>
                    Share this code only with your partner so they can connect to this bond.
                  </div>
                </>
              ) : (
                <div className="settings-muted">
                  Bonding code is not available yet.
                </div>
              )}
            </div>

            <div className="settings-card settings-wide">
              <div className="settings-card-title">Reunion Countdown</div>

              <div className="reunion-date-block">
                <label className="input-label">Reunion Date &amp; Time</label>
                <input
                  className="input-field"
                  type="datetime-local"
                  value={reunion}
                  onChange={(e) => setReunion(e.target.value)}
                />

                {daysToGo !== null && (
                  <div className="reunion-highlight">
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 22,
                        color: "var(--counter1)",
                      }}
                    >
                      {daysToGo}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        letterSpacing: 1,
                        color: "var(--muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      days to go
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="settings-wide">
              <WeatherLocationSettings user={user} bond={bond} />
            </div>

            <div className="settings-card settings-wide logout-card">
              <div className="settings-card-title">Account</div>

              <div className="settings-muted" style={{ marginBottom: 16 }}>
                Log out from this device. Your bond, messages, weather location,
                and settings will remain saved in database.
              </div>

              <button
                className="logout-btn"
                type="button"
                onClick={logout}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </div>

          <div className="settings-save-wrap">
            <button className="save-btn" type="button" onClick={save}>
              {saved ? (
                <span className="save-success">✓ Saved!</span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}