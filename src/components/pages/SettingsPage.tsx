"use client";

import { useState } from "react";
import type { User, Partner } from "../../lib/types";
import { AVATARS } from "../../lib/constants";
import { PetalCanvas } from "../ui/PetalCanvas";

interface SettingsPageProps {
  user: User | null;
  setUser: (user: User) => void;
  partner: Partner | null;
  setPartner: (partner: Partner) => void;
  reunionDate: string;
  setReunionDate: (date: string) => void;
}

const SETTINGS_CSS = `
  .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  @media (max-width: 640px) { .settings-grid { grid-template-columns: 1fr; } }
  .settings-card {
    background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-lg);
    padding: 28px; backdrop-filter: blur(20px);
  }
  .settings-card-title {
    font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--aurora1); margin-bottom: 20px;
  }
  .avatar-preview {
    width: 80px; height: 80px; border-radius: 50%;
    border: 2px dashed var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; margin: 0 auto 16px; background: rgba(255,255,255,0.03);
    transition: all 0.3s;
  }
  .avatar-chip-sm {
    width: 34px; height: 34px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 18px; transition: all 0.2s;
    border: 1.5px solid var(--border); background: rgba(255,255,255,0.03);
  }
  .avatar-chip-sm.selected { border-color: var(--aurora1); background: rgba(192,132,252,0.15); }
  .reunion-highlight {
    padding: 16px 24px; background: rgba(192,132,252,0.1);
    border-radius: 12px; border: 1px solid var(--aurora1);
    text-align: center;
  }
  .save-success { color: #86efac; }
`;

interface ProfileCardProps {
  title: string;
  value: { name: string; nickname: string; avatar: string };
  onChange: (updates: Partial<{ name: string; nickname: string; avatar: string }>) => void;
  nameLabel?: string;
  nicknameLabel?: string;
}

function ProfileCard({ title, value, onChange, nameLabel = "Name", nicknameLabel = "Nickname" }: ProfileCardProps) {
  return (
    <div className="settings-card">
      <div className="settings-card-title">{title}</div>
      <div className="avatar-preview">{value.avatar}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 16 }}>
        {AVATARS.map((a) => (
          <div
            key={a}
            className={`avatar-chip-sm ${value.avatar === a ? "selected" : ""}`}
            onClick={() => onChange({ avatar: a })}
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
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>
      <div className="input-wrap">
        <label className="input-label">{nicknameLabel}</label>
        <input
          className="input-field"
          value={value.nickname}
          onChange={(e) => onChange({ nickname: e.target.value })}
        />
      </div>
    </div>
  );
}

/**
 * SettingsPage
 * ────────────
 * Owns: local form state for profiles + reunion date.
 * Writes back to parent (and localStorage) only on Save.
 * Does NOT own: actual user state (held by App root).
 *
 * Firebase-ready:
 *  - save() should updateDoc() the user's Firestore profile.
 *  - Reunion date stored in the shared bond document.
 *  - Partner profile edits sync to both partners in real-time.
 */
export function SettingsPage({
  user, setUser,
  partner, setPartner,
  reunionDate, setReunionDate,
}: SettingsPageProps) {
  const [myForm, setMyForm] = useState({
    name:     user?.name     ?? "",
    nickname: user?.nickname ?? "",
    avatar:   user?.avatar   ?? "💜",
  });
  const [partForm, setPartForm] = useState({
    name:     partner?.name     ?? "",
    nickname: partner?.nickname ?? "",
    avatar:   partner?.avatar   ?? "🌸",
  });
  const [reunion, setReunion] = useState(reunionDate ?? "");
  const [saved, setSaved] = useState(false);

  const save = () => {
    const newUser: User       = { ...(user    as User),    ...myForm   };
    const newPartner: Partner = { ...(partner as Partner), ...partForm };

    setUser(newUser);
    setPartner(newPartner);
    setReunionDate(reunion);

    try {
      localStorage.setItem("ab_user",    JSON.stringify(newUser));
      localStorage.setItem("ab_partner", JSON.stringify(newPartner));
    } catch {}

    setSaved(true);
    setTimeout(() => setSaved(false), 2_000);
  };

  const daysToGo = reunion
    ? Math.max(0, Math.ceil((new Date(reunion).getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <>
      <style>{SETTINGS_CSS}</style>
      <div className="page">
        <div className="aurora-bg" />
        <PetalCanvas />

        <div className="inner-wrap">
          <div className="page-title"><span>Settings</span></div>
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
              nicknameLabel="Their Nickname for You"
            />

            {/* Reunion date — spans full width */}
            <div className="settings-card" style={{ gridColumn: "span 2" }}>
              <div className="settings-card-title">Reunion Countdown</div>
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
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
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--aurora1)" }}>
                      {daysToGo}
                    </div>
                    <div style={{ fontSize: 11, letterSpacing: 1, color: "var(--muted)", textTransform: "uppercase" }}>
                      days to go
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            className="save-btn"
            style={{ maxWidth: 300, marginTop: 32, display: "block" }}
            onClick={save}
          >
            {saved ? <span className="save-success">✓ Saved!</span> : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}