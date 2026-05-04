"use client";

import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { AVATARS } from "../../lib/constants";
import { PetalCanvas } from "../ui/PetalCanvas";
import type { User, Partner, Bond } from "../../lib/types";
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

  .reunion-highlight {
    padding: 16px 24px;
    background: rgba(192,132,252,0.1);
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
    box-shadow: 0 0 14px rgba(192,132,252,0.25);
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
    setReunion(reunionDate ?? "");
  }, [reunionDate]);

  const save = async () => {
    if (!auth.currentUser || !user?.bondId || !user?.uid) return;

    const newUser: User = {
      ...(user as User),
      ...myForm,
    };

    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      name: myForm.name,
      nickname: myForm.nickname,
      avatar: myForm.avatar,
    });

    const bondUpdates: Record<string, string> = {
      reunionDate: reunion,
      [`nicknames.${user.uid}`]: myForm.nickname,
    };

    if (partner?.uid) {
      bondUpdates[`nicknames.${partner.uid}`] = partForm.nickname;
    }

    await updateDoc(doc(db, "bonds", user.bondId), bondUpdates);

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
        <PetalCanvas />

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

              <div
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label className="input-label">Reunion Date &amp; Time</label>
                  <input
                    className="input-field"
                    type="datetime-local"
                    value={reunion}
                    onChange={(e) => setReunion(e.target.value)}
                  />
                </div>

                {daysToGo !== null && (
                  <div className="reunion-highlight">
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 22,
                        color: "var(--aurora1)",
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

          <button
            className="save-btn"
            style={{
              maxWidth: 300,
              marginTop: 32,
              display: "block",
            }}
            onClick={save}
          >
            {saved ? (
              <span className="save-success">✓ Saved!</span>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </>
  );
}