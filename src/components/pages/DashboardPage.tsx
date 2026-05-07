"use client";

import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DASHBOARD_CARDS } from "../../lib/constants";
import type { Bond, PageKey, Partner, User, NavigateMode } from "../../lib/types";
import { CountdownClock } from "../ui/CountdownClock";
import { PetalCanvas } from "../ui/PetalCanvas";

interface DashboardPageProps {
  setPage: (page: PageKey, mode?: NavigateMode) => void;
  user: User | null;
  partner: Partner | null;
  reunionDate: string;
  bond: Bond | null;
}

interface Mood {
  emoji: string;
  label: string;
}

const MOODS: Mood[] = [
  { emoji: "🥰", label: "Loved" },
  { emoji: "😊", label: "Happy" },
  { emoji: "😌", label: "Calm" },
  { emoji: "🥺", label: "Missing you" },
  { emoji: "😴", label: "Sleepy" },
  { emoji: "😤", label: "Annoyed" },
  { emoji: "🥲", label: "Emotional" },
  { emoji: "🤍", label: "Soft" },
];

const DASH_CSS = `
  .dash-wrap {
    padding: 100px 40px 60px;
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    z-index: 2;
  }

  .dash-hero {
    text-align: center;
    margin-bottom: 60px;
  }

  .hero-couple-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    margin-bottom: 32px;
  }

  .hero-person {
    text-align: center;
  }

  .hero-avatar {
    font-size: 40px;
    margin-bottom: 6px;
  }

  .hero-name {
    font-size: 13px;
    color: var(--muted);
  }

  .couple-names {
    font-family: var(--font-serif);
    font-size: 32px;
    font-weight: 300;
    margin-bottom: 4px;
  }

  .couple-tagline {
    color: var(--muted);
    font-size: 13px;
    letter-spacing: 1px;
  }

  .orb {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(
      135deg,
      rgba(192, 132, 252, 0.3),
      rgba(251, 113, 133, 0.2)
    );
    animation: orb 4s ease-in-out infinite;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    position: relative;
  }

  .orb::before,
  .orb::after {
    content: "";
    position: absolute;
    border-radius: 50%;
    border: 1px solid rgba(192, 132, 252, 0.3);
    animation: pulseRing 3s ease-out infinite;
    width: 100%;
    height: 100%;
  }

  .orb::after {
    animation-delay: 1.5s;
  }

  .section-header {
    margin-top: 40px;
    margin-bottom: 14px;
  }

  .section-title {
    font-family: var(--font-serif);
    font-size: 26px;
    font-weight: 300;
  }

  .section-label {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--aurora1);
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }

  .dash-card {
    width: 100%;
    text-align: left;
    color: var(--text);
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 28px;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    backdrop-filter: blur(20px);
    position: relative;
    overflow: hidden;
    font-family: var(--font-sans);
  }

  .dash-card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: var(--radius-lg);
    background: linear-gradient(
      135deg,
      transparent 0%,
      rgba(192, 132, 252, 0.05) 100%
    );
    opacity: 0;
    transition: opacity 0.4s;
    pointer-events: none;
  }

  .dash-card:hover {
    transform: translateY(-4px) scale(1.01);
    border-color: var(--border-glow);
    background: var(--card-hover);
  }

  .dash-card:hover::before {
    opacity: 1;
  }

  .dash-card-icon {
    font-size: 28px;
    margin-bottom: 16px;
  }

  .dash-card-tag {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--aurora1);
    margin-bottom: 8px;
  }

  .dash-card-title {
    font-family: var(--font-serif);
    font-size: 24px;
    font-weight: 400;
    margin-bottom: 8px;
  }

  .dash-card-desc {
    color: var(--muted);
    font-size: 13px;
    line-height: 1.6;
    padding-right: 20px;
  }

  .dash-card-arrow {
    position: absolute;
    bottom: 24px;
    right: 24px;
    color: var(--muted2);
    font-size: 20px;
    transition: all 0.3s;
  }

  .dash-card:hover .dash-card-arrow {
    color: var(--aurora1);
    transform: translate(2px, -2px);
  }

  .mood-card,
  .quote-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 28px;
    backdrop-filter: blur(20px);
  }

  .mood-card {
    margin-bottom: 32px;
  }

  .mood-top {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    margin-bottom: 22px;
    flex-wrap: wrap;
  }

  .mood-title {
    font-family: var(--font-serif);
    font-size: 24px;
    font-weight: 300;
  }

  .mood-sub {
    color: var(--muted);
    font-size: 13px;
    margin-top: 4px;
  }

  .mood-saving {
    color: var(--muted);
    font-size: 12px;
  }

  .mood-display-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 22px;
  }

  .mood-person {
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.04);
    border-radius: 20px;
    padding: 20px;
    text-align: center;
  }

  .mood-avatar {
    font-size: 34px;
    margin-bottom: 8px;
  }

  .mood-name {
    color: var(--muted);
    font-size: 12px;
    margin-bottom: 10px;
  }

  .mood-current {
    font-family: var(--font-serif);
    font-size: 26px;
  }

  .mood-current span {
    margin-right: 8px;
  }

  .mood-empty {
    color: var(--muted2);
    font-style: italic;
    font-size: 15px;
  }

  .mood-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .mood-chip {
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text);
    border-radius: var(--radius-full);
    padding: 9px 14px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.25s ease;
  }

  .mood-chip:hover {
    border-color: var(--aurora1);
    background: rgba(192, 132, 252, 0.1);
    transform: translateY(-1px);
  }

  .mood-chip.active {
    border-color: var(--aurora1);
    background: linear-gradient(
      135deg,
      rgba(192, 132, 252, 0.24),
      rgba(251, 113, 133, 0.14)
    );
    color: white;
  }

  .mood-chip:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .quotes-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .quote-author {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--aurora1);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .quote-text {
    font-family: var(--font-serif);
    font-size: 20px;
    font-weight: 300;
    font-style: italic;
    color: var(--text);
    line-height: 1.6;
    min-height: 60px;
  }

  .quote-placeholder {
    color: var(--muted2);
    font-style: italic;
  }

  .quote-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text);
    padding: 12px 16px;
    font-family: var(--font-serif);
    font-size: 18px;
    font-style: italic;
    outline: none;
    transition: all 0.3s;
    resize: none;
    margin-top: 12px;
  }

  .quote-input:focus {
    border-color: var(--aurora1);
  }

  .quote-input::placeholder {
    color: var(--muted2);
  }

  .quote-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 10px;
  }

  .quote-save-btn {
    background: none;
    border: 1px solid var(--aurora1);
    color: var(--aurora1);
    padding: 6px 16px;
    border-radius: var(--radius-full);
    cursor: pointer;
    font-size: 12px;
    transition: all 0.3s;
    font-family: var(--font-sans);
  }

  .quote-save-btn:hover {
    background: rgba(192, 132, 252, 0.1);
  }

  .quote-save-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .dash-footer {
    text-align: center;
    margin-top: 60px;
    padding-top: 40px;
    border-top: 1px solid var(--border);
  }

  .dash-footer-title {
    font-family: var(--font-serif);
    font-size: 28px;
    font-weight: 300;
    margin-bottom: 8px;
  }

  .dash-footer-sub {
    color: var(--muted);
    font-size: 13px;
  }

  @media (max-width: 640px) {
    .dash-wrap {
      padding: 100px 20px 130px;
    }

    .dash-hero {
      margin-bottom: 42px;
    }

    .hero-couple-row {
      gap: 18px;
    }

    .orb {
      width: 82px;
      height: 82px;
      font-size: 30px;
    }

    .couple-names {
      font-size: 28px;
    }

    .mood-display-grid,
    .quotes-grid {
      grid-template-columns: 1fr;
    }

    .dash-card,
    .mood-card,
    .quote-card {
      padding: 22px;
    }
  }
`;

interface CurrentMoodCardProps {
  user: User | null;
  partner: Partner | null;
  bond: Bond | null;
  myDisplayNickname: string;
  partnerDisplayNickname: string;
}

function CurrentMoodCard({
  user,
  partner,
  bond,
  myDisplayNickname,
  partnerDisplayNickname,
}: CurrentMoodCardProps) {
  const [saving, setSaving] = useState(false);

  const currentUid = user?.uid;
  const partnerUid =
    bond?.user1Uid === currentUid ? bond?.user2Uid : bond?.user1Uid;

  const myMood = currentUid ? bond?.currentMoods?.[currentUid] : null;
  const partnerMood = partnerUid ? bond?.currentMoods?.[partnerUid] : null;

  const saveMood = async (mood: Mood) => {
    if (!user?.bondId || !currentUid) return;

    try {
      setSaving(true);

      await updateDoc(doc(db, "bonds", user.bondId), {
        [`currentMoods.${currentUid}`]: mood,
      });
    } catch (error) {
      console.error("Mood save error:", error);
      alert("Could not save mood.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mood-card">
      <div className="mood-top">
        <div>
          <div className="mood-title">Current Mood</div>
          <div className="mood-sub">
            A tiny status for what your heart feels right now.
          </div>
        </div>

        {saving && <div className="mood-saving">Saving...</div>}
      </div>

      <div className="mood-display-grid">
        <div className="mood-person">
          <div className="mood-avatar">{user?.avatar ?? "💜"}</div>
          <div className="mood-name">{myDisplayNickname}</div>

          {myMood ? (
            <div className="mood-current">
              <span>{myMood.emoji}</span>
              {myMood.label}
            </div>
          ) : (
            <div className="mood-empty">No mood set yet</div>
          )}
        </div>

        <div className="mood-person">
          <div className="mood-avatar">{partner?.avatar ?? "🌸"}</div>
          <div className="mood-name">{partnerDisplayNickname}</div>

          {partnerMood ? (
            <div className="mood-current">
              <span>{partnerMood.emoji}</span>
              {partnerMood.label}
            </div>
          ) : (
            <div className="mood-empty">Waiting for their mood...</div>
          )}
        </div>
      </div>

      <div className="mood-picker">
        {MOODS.map((mood) => {
          const active =
            myMood?.emoji === mood.emoji && myMood?.label === mood.label;

          return (
            <button
              key={`${mood.emoji}-${mood.label}`}
              type="button"
              className={`mood-chip ${active ? "active" : ""}`}
              onClick={() => saveMood(mood)}
              disabled={saving}
            >
              {mood.emoji} {mood.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface QuoteCardProps {
  quote: string;
  field: "quote1" | "quote2";
  bondId?: string;
  avatar: string;
  nickname: string;
  placeholder: string;
}

function QuoteCard({
  quote,
  field,
  bondId,
  avatar,
  nickname,
  placeholder,
}: QuoteCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(quote);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) {
      setDraft(quote);
    }
  }, [quote, editing]);

  const save = async () => {
    if (!bondId) return;

    try {
      setSaving(true);

      await updateDoc(doc(db, "bonds", bondId), {
        [field]: draft.trim(),
      });

      setEditing(false);
    } catch (error) {
      console.error("Quote save error:", error);
      alert("Could not save quote.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="quote-card">
      <div className="quote-author">
        <span>{avatar}</span>
        <span>{nickname} says</span>
      </div>

      {!editing ? (
        <>
          <div className="quote-text">
            {quote ? (
              quote
            ) : (
              <span className="quote-placeholder">{placeholder}</span>
            )}
          </div>

          <button
            className="quote-save-btn"
            type="button"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        </>
      ) : (
        <>
          <textarea
            className="quote-input"
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write something beautiful…"
          />

          <div className="quote-actions">
            <button
              className="quote-save-btn"
              type="button"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>

            <button
              className="quote-save-btn"
              type="button"
              onClick={() => {
                setDraft(quote);
                setEditing(false);
              }}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function DashboardPage({
  setPage,
  user,
  partner,
  reunionDate,
  bond,
}: DashboardPageProps) {
  const currentUid = user?.uid;
  const partnerUid =
    bond?.user1Uid === currentUid ? bond?.user2Uid : bond?.user1Uid;

  const myDisplayNickname =
    bond?.nicknames?.[currentUid || ""] || user?.nickname || "You";

  const partnerDisplayNickname =
    bond?.nicknames?.[partnerUid || ""] || partner?.nickname || "Partner";

  return (
    <>
      <style>{DASH_CSS}</style>

      <div className="page">
        <div className="aurora-bg" />
        <PetalCanvas />

        <div className="dash-wrap">
          <div className="dash-hero">
            <div className="hero-couple-row">
              <div className="hero-person">
                <div className="hero-avatar">{user?.avatar ?? "💜"}</div>
                <div className="hero-name">{myDisplayNickname}</div>
              </div>

              <div className="orb">💜</div>

              <div className="hero-person">
                <div className="hero-avatar">{partner?.avatar ?? "🌸"}</div>
                <div className="hero-name">{partnerDisplayNickname}</div>
              </div>
            </div>

            <div className="couple-names">
              {myDisplayNickname} & {partnerDisplayNickname}
            </div>

            <div className="couple-tagline">
              ∞ bonded across every distance ∞
            </div>
          </div>

          {reunionDate ? (
            <CountdownClock reunionDate={reunionDate} />
          ) : (
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <button
                className="btn-ghost"
                type="button"
                onClick={() => setPage("settings")}
              >
                Set Reunion Date →
              </button>
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <span className="section-label">Your Universe</span>
          </div>

          <div className="cards-grid">
            {DASHBOARD_CARDS.map((card) => (
              <button
                key={card.page}
                type="button"
                className="dash-card"
                onClick={() => setPage(card.page)}
              >
                <div className="dash-card-icon">{card.icon}</div>
                <div className="dash-card-tag">{card.tag}</div>
                <div className="dash-card-title">{card.title}</div>
                <div className="dash-card-desc">{card.desc}</div>
                <div className="dash-card-arrow">↗</div>
              </button>
            ))}
          </div>

          <div className="section-header">
            <div className="section-title">Mood Check</div>
          </div>

          <CurrentMoodCard
            user={user}
            partner={partner}
            bond={bond}
            myDisplayNickname={myDisplayNickname}
            partnerDisplayNickname={partnerDisplayNickname}
          />

          <div className="section-header">
            <div className="section-title">Words for Each Other</div>
          </div>

          <div className="quotes-grid">
            <QuoteCard
              quote={bond?.quote1 ?? ""}
              field="quote1"
              bondId={user?.bondId}
              avatar={user?.avatar ?? "💜"}
              nickname={myDisplayNickname}
              placeholder="Leave a quote for your love…"
            />

            <QuoteCard
              quote={bond?.quote2 ?? ""}
              field="quote2"
              bondId={user?.bondId}
              avatar={partner?.avatar ?? "🌸"}
              nickname={partnerDisplayNickname}
              placeholder="Waiting for their words…"
            />
          </div>

          <div className="dash-footer">
            <div className="dash-footer-title">
              Made with love, built for two.
            </div>

            <div className="dash-footer-sub">
              AuroraBond — your shared emotional universe
            </div>
          </div>
        </div>
      </div>
    </>
  );
}