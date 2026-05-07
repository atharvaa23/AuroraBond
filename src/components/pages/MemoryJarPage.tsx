"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ThemeBackdrop } from "../ui/ThemeBackdrop";
import type { Bond, MemoryItem, Partner, User } from "../../lib/types";

interface MemoryJarPageProps {
  user: User | null;
  partner: Partner | null;
  bond: Bond | null;
}

function cleanText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function getDisplayName(
  nickname?: string | null,
  name?: string | null,
  fallback = "You"
) {
  const cleanNickname = cleanText(nickname);
  const cleanName = cleanText(name);

  return cleanNickname || cleanName || fallback;
}

function formatMemoryDate(memory: MemoryItem) {
  if (!memory.createdAt) return "just now";

  return memory.createdAt.toDate().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const MEMORY_CSS = `
  .memory-wrap {
    padding: 100px 40px 70px;
    max-width: 1100px;
    margin: 0 auto;
    position: relative;
    z-index: 2;
  }

  .memory-hero {
    text-align: center;
    margin-bottom: 34px;
  }

  .memory-title {
    font-family: var(--font-serif);
    font-size: clamp(42px, 6vw, 64px);
    font-weight: 300;
    margin-bottom: 10px;
    background: linear-gradient(135deg, var(--aurora1), var(--aurora2), var(--aurora3));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .memory-sub {
    color: var(--muted);
    font-size: 14px;
    line-height: 1.8;
    max-width: 650px;
    margin: 0 auto;
  }

  .memory-create-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 28px;
    backdrop-filter: blur(20px);
    margin-bottom: 28px;
    position: relative;
    overflow: hidden;
  }

  .memory-create-card::before {
    content: "";
    position: absolute;
    width: 260px;
    height: 260px;
    top: -120px;
    right: -90px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(251,113,133,0.16), transparent 70%);
    pointer-events: none;
  }

  .memory-create-card::after {
    content: "";
    position: absolute;
    width: 240px;
    height: 240px;
    left: -100px;
    bottom: -130px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(96,165,250,0.13), transparent 70%);
    pointer-events: none;
  }

  .memory-create-inner {
    position: relative;
    z-index: 1;
  }

  .memory-jar-visual {
    width: 126px;
    height: 148px;
    margin: 0 auto 26px;
    border-radius: 36px 36px 46px 46px;
    border: 1px solid rgba(255,255,255,0.16);
    background:
      radial-gradient(circle at 35% 38%, rgba(251,113,133,0.42), transparent 15%),
      radial-gradient(circle at 66% 45%, rgba(96,165,250,0.38), transparent 15%),
      radial-gradient(circle at 48% 68%, rgba(192,132,252,0.4), transparent 16%),
      linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,255,255,0.025));
    box-shadow:
      0 0 45px rgba(192,132,252,0.16),
      0 0 80px rgba(251,113,133,0.08),
      inset 0 0 30px rgba(255,255,255,0.06);
    position: relative;
    animation:
      memoryJarFloat 4.8s ease-in-out infinite,
      memoryJarGlow 3.6s ease-in-out infinite;
  }

  .memory-jar-visual::before {
    content: "";
    position: absolute;
    width: 72px;
    height: 19px;
    border-radius: 999px;
    left: 50%;
    top: -10px;
    transform: translateX(-50%);
    background: linear-gradient(135deg, rgba(192,132,252,0.75), rgba(251,113,133,0.62));
    box-shadow:
      0 8px 20px rgba(251,113,133,0.22),
      inset 0 1px 0 rgba(255,255,255,0.18);
  }

  .memory-jar-visual::after {
    content: "💌";
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 35px;
    filter: drop-shadow(0 0 14px rgba(255,255,255,0.18));
    animation: memoryEnvelopePulse 2.8s ease-in-out infinite;
  }

  .jar-heart {
    position: absolute;
    z-index: 2;
    color: rgba(255,255,255,0.78);
    font-size: 12px;
    pointer-events: none;
    text-shadow: 0 0 12px rgba(251,113,133,0.7);
    animation: jarHeartFloat 3.4s ease-in-out infinite;
  }

  .jar-heart-one {
    left: 26px;
    top: 38px;
    animation-delay: 0s;
  }

  .jar-heart-two {
    right: 26px;
    top: 58px;
    animation-delay: 0.8s;
    color: rgba(125,211,252,0.8);
    text-shadow: 0 0 12px rgba(96,165,250,0.7);
  }

  .jar-heart-three {
    left: 52px;
    bottom: 30px;
    animation-delay: 1.4s;
    color: rgba(240,171,252,0.8);
    text-shadow: 0 0 12px rgba(192,132,252,0.7);
  }

  .jar-shine {
    position: absolute;
    left: 24px;
    top: 26px;
    width: 18px;
    height: 70px;
    border-radius: 999px;
    background: linear-gradient(
      180deg,
      rgba(255,255,255,0.22),
      rgba(255,255,255,0.04),
      transparent
    );
    transform: rotate(12deg);
    opacity: 0.45;
    animation: jarShine 3.8s ease-in-out infinite;
    pointer-events: none;
  }

  @keyframes memoryJarFloat {
    0%, 100% {
      transform: translateY(0) rotate(-1deg);
    }

    50% {
      transform: translateY(-9px) rotate(1.2deg);
    }
  }

  @keyframes memoryJarGlow {
    0%, 100% {
      box-shadow:
        0 0 45px rgba(192,132,252,0.16),
        0 0 80px rgba(251,113,133,0.08),
        inset 0 0 30px rgba(255,255,255,0.06);
    }

    50% {
      box-shadow:
        0 0 58px rgba(192,132,252,0.24),
        0 0 95px rgba(251,113,133,0.13),
        inset 0 0 38px rgba(255,255,255,0.08);
    }
  }

  @keyframes memoryEnvelopePulse {
    0%, 100% {
      transform: scale(1);
    }

    50% {
      transform: scale(1.07);
    }
  }

  @keyframes jarHeartFloat {
    0%, 100% {
      transform: translateY(0) scale(1);
      opacity: 0.55;
    }

    50% {
      transform: translateY(-9px) scale(1.16);
      opacity: 1;
    }
  }

  @keyframes jarShine {
    0%, 100% {
      opacity: 0.25;
      transform: translateX(0) rotate(12deg);
    }

    50% {
      opacity: 0.55;
      transform: translateX(5px) rotate(12deg);
    }
  }

  .memory-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
    align-items: center;
  }

  .memory-input-wrap {
    position: relative;
    width: 100%;
  }

  .memory-input {
    width: 100%;
    min-height: 105px;
    background: rgba(255,255,255,0.045);
    border: 1px solid var(--border);
    border-radius: 24px;
    color: var(--text);
    padding: 18px 18px 32px;
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 1.7;
    outline: none;
    resize: none;
    transition: all 0.3s ease;
  }

  .memory-input:focus {
    border-color: var(--aurora1);
    background: rgba(255,255,255,0.06);
  }

  .memory-input::placeholder {
    color: var(--muted2);
  }

  .memory-count {
    position: absolute;
    right: 18px;
    bottom: 11px;
    color: var(--muted2);
    font-size: 10px;
  }

  .memory-save-btn {
    border: 1px solid rgba(192,132,252,0.45);
    background: linear-gradient(135deg, rgba(192,132,252,0.32), rgba(251,113,133,0.22));
    color: var(--text);
    padding: 14px 26px;
    border-radius: var(--radius-full);
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 13px;
    white-space: nowrap;
    transition: all 0.25s ease;
  }

  .memory-save-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 18px rgba(192,132,252,0.28);
  }

  .memory-save-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .memory-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    margin-bottom: 18px;
    flex-wrap: wrap;
  }

  .memory-section-title {
    font-family: var(--font-serif);
    font-size: 30px;
    font-weight: 300;
  }

  .memory-random-btn {
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.04);
    color: var(--text);
    border-radius: var(--radius-full);
    padding: 9px 15px;
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 12px;
    transition: all 0.25s ease;
  }

  .memory-random-btn:hover {
    border-color: var(--aurora1);
    color: var(--aurora1);
    background: rgba(192,132,252,0.08);
  }

  .memory-random-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .memory-spotlight {
    border-radius: 28px;
    border: 1px solid rgba(255,255,255,0.09);
    background:
      linear-gradient(135deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025)),
      radial-gradient(circle at top left, rgba(251,113,133,0.16), transparent 45%),
      radial-gradient(circle at bottom right, rgba(96,165,250,0.14), transparent 45%);
    padding: 26px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
  }

  .memory-spotlight-icon {
    position: absolute;
    right: 24px;
    top: 18px;
    font-size: 38px;
    opacity: 0.22;
  }

  .memory-spotlight-label {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--aurora1);
    margin-bottom: 12px;
  }

  .memory-spotlight-text {
    font-family: var(--font-serif);
    font-size: 25px;
    font-weight: 300;
    line-height: 1.55;
    padding-right: 46px;
  }

  .memory-spotlight-empty {
    color: var(--muted2);
    font-style: italic;
  }

  .memory-spotlight-meta {
    margin-top: 16px;
    color: var(--muted);
    font-size: 12px;
  }

  .memory-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .memory-note {
    min-height: 150px;
    border-radius: 24px;
    padding: 18px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    transition: all 0.25s ease;
    position: relative;
    overflow: hidden;
  }

  .memory-note:hover {
    transform: translateY(-3px);
    border-color: rgba(192,132,252,0.35);
    background: rgba(255,255,255,0.055);
  }

  .memory-note-text {
    font-family: var(--font-serif);
    font-size: 19px;
    line-height: 1.5;
    color: var(--text);
    margin-bottom: 18px;
  }

  .memory-note-meta {
    color: var(--muted);
    font-size: 11px;
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: center;
  }

  .memory-delete-btn {
    display: block;
    margin: 16px auto 0;
    background: transparent;
    border: 1px solid rgba(251,113,133,0.28);
    color: var(--muted2);
    cursor: pointer;
    font-size: 11px;
    padding: 7px 14px;
    border-radius: var(--radius-full);
    transition: all 0.2s ease;
  }

  .memory-delete-btn:hover {
    color: #fb7185;
    background: rgba(251,113,133,0.1);
    border-color: rgba(251,113,133,0.5);
  }

  .memory-empty,
  .memory-loading {
    text-align: center;
    color: var(--muted);
    border: 1px dashed var(--border);
    border-radius: 24px;
    padding: 36px 20px;
    background: rgba(255,255,255,0.025);
  }

  @media (prefers-reduced-motion: reduce) {
    .memory-jar-visual,
    .memory-jar-visual::after,
    .jar-heart,
    .jar-shine {
      animation: none;
    }
  }

  @media (max-width: 900px) {
    .memory-grid {
      grid-template-columns: 1fr 1fr;
    }

    .memory-save-btn {
      width: fit-content;
    }
  }

  @media (max-width: 640px) {
    .memory-wrap {
      padding: 100px 20px 130px;
    }

    .memory-grid {
      grid-template-columns: 1fr;
    }

    .memory-spotlight-text {
      font-size: 22px;
      padding-right: 24px;
    }
  }
`;

export function MemoryJarPage({ user, partner, bond }: MemoryJarPageProps) {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [spotlightMemory, setSpotlightMemory] = useState<MemoryItem | null>(
    null
  );
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const maxLength = 220;

  const bondId = user?.bondId;
  const currentUid = user?.uid;

  const partnerUid =
    bond?.user1Uid === currentUid ? bond?.user2Uid : bond?.user1Uid;

  const myDisplayName = getDisplayName(
    bond?.nicknames?.[currentUid || ""],
    user?.name,
    "You"
  );

  const partnerDisplayName = getDisplayName(
    bond?.nicknames?.[partnerUid || ""],
    partner?.name,
    "Partner"
  );

  useEffect(() => {
    if (!bondId) {
      setLoading(false);
      return;
    }

    const memoriesQuery = query(
      collection(db, "bonds", bondId, "memories"),
      orderBy("createdAt", "desc"),
      limit(30)
    );

    const unsubscribe = onSnapshot(
      memoriesQuery,
      (snapshot) => {
        const nextMemories = snapshot.docs.map((memoryDoc) => {
          const data = memoryDoc.data();

          return {
            id: memoryDoc.id,
            text: data.text ?? "",
            createdBy: data.createdBy ?? "",
            authorName: data.authorName ?? "Someone",
            authorAvatar: data.authorAvatar ?? "💌",
            createdAt: data.createdAt ?? null,
          } as MemoryItem;
        });

        setMemories(nextMemories);
        setSpotlightMemory((current) => current ?? nextMemories[0] ?? null);
        setLoading(false);
      },
      (error) => {
        console.error("Memory jar load error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [bondId]);

  const addMemory = async () => {
    const text = cleanText(draft);

    if (!text) {
      alert("Write a memory first.");
      return;
    }

    if (!bondId || !currentUid) {
      alert("No bond connected yet.");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "bonds", bondId, "memories"), {
        text,
        createdBy: currentUid,
        authorName: myDisplayName,
        authorAvatar: user?.avatar ?? "💜",
        createdAt: serverTimestamp(),
      });

      setDraft("");
    } catch (error) {
      console.error("Memory save error:", error);
      alert("Could not save memory.");
    } finally {
      setSaving(false);
    }
  };

  const deleteMemory = async (memory: MemoryItem) => {
    if (!bondId || !currentUid) return;

    const confirmDelete = window.confirm("Erase this memory?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "bonds", bondId, "memories", memory.id));

      if (spotlightMemory?.id === memory.id) {
        setSpotlightMemory(null);
      }
    } catch (error) {
      console.error("Memory delete error:", error);
      alert("Could not erase memory.");
    }
  };

  const showRandomMemory = () => {
    if (memories.length === 0) return;

    const randomIndex = Math.floor(Math.random() * memories.length);
    setSpotlightMemory(memories[randomIndex]);
  };

  return (
    <>
      <style>{MEMORY_CSS}</style>

      <div className="page">
        <div className="aurora-bg" />
        <ThemeBackdrop />

        <div className="memory-wrap">
          <div className="memory-hero">
            <div className="memory-title">Memory Jar</div>

            <div className="memory-sub">
              A soft little place for {myDisplayName} and {partnerDisplayName} —
              tiny moments, inside jokes, late-night words, and memories that
              only make sense to the two of you.
            </div>
          </div>

          <div className="memory-create-card">
            <div className="memory-create-inner">
              <div className="memory-jar-visual">
                <span className="jar-shine" />
                <span className="jar-heart jar-heart-one">♡</span>
                <span className="jar-heart jar-heart-two">♡</span>
                <span className="jar-heart jar-heart-three">♡</span>
              </div>

              <div className="memory-form">
                <div className="memory-input-wrap">
                  <textarea
                    className="memory-input"
                    maxLength={maxLength}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Write a tiny memory… maybe a joke, a moment, or something you miss."
                  />

                  <div className="memory-count">
                    {draft.length}/{maxLength}
                  </div>
                </div>

                <button
                  className="memory-save-btn"
                  type="button"
                  onClick={addMemory}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Drop in Jar 💌"}
                </button>
              </div>
            </div>
          </div>

          <div className="memory-toolbar">
            <div className="memory-section-title">Saved Moments</div>

            <button
              className="memory-random-btn"
              type="button"
              onClick={showRandomMemory}
              disabled={memories.length === 0}
            >
              Shuffle a memory ✨
            </button>
          </div>

          <div className="memory-spotlight">
            <div className="memory-spotlight-icon">💌</div>
            <div className="memory-spotlight-label">Soft reminder</div>

            {spotlightMemory ? (
              <>
                <div className="memory-spotlight-text">
                  “{spotlightMemory.text}”
                </div>

                <div className="memory-spotlight-meta">
                  — {spotlightMemory.authorAvatar} {spotlightMemory.authorName},{" "}
                  {formatMemoryDate(spotlightMemory)}
                </div>
              </>
            ) : (
              <div className="memory-spotlight-text memory-spotlight-empty">
                Your first memory is waiting to be written…
              </div>
            )}
          </div>

          {loading ? (
            <div className="memory-loading">Opening the jar...</div>
          ) : memories.length > 0 ? (
            <div className="memory-grid">
              {memories.map((memory) => (
                <div className="memory-note" key={memory.id}>
                  <div className="memory-note-text">“{memory.text}”</div>

                  <div className="memory-note-meta">
                    <span>
                      {memory.authorAvatar} {memory.authorName}
                    </span>
                    <span>{formatMemoryDate(memory)}</span>
                  </div>

                  <button
                    className="memory-delete-btn"
                    type="button"
                    onClick={() => deleteMemory(memory)}
                  >
                    Erase memory
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="memory-empty">
              No memories yet. Drop the first one into the jar ✨
            </div>
          )}
        </div>
      </div>
    </>
  );
}