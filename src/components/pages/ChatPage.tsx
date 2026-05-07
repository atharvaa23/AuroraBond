"use client";

import type { Timestamp } from "firebase/firestore";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { User, Partner, Bond } from "../../lib/types";
import { ThemeBackdrop } from "../ui/ThemeBackdrop";

interface ChatPageProps {
  user: User | null;
  partner: Partner | null;
  bond: Bond | null;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  createdAt: Timestamp | null;
}

interface Presence {
  isOnline?: boolean;
  typing?: boolean;
  lastSeen?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

const ONLINE_TIMEOUT = 45 * 1000;
const TYPING_TIMEOUT = 2500;

const QUICK_EMOJIS = [
  "🥰",
  "😭",
  "😂",
  "🤍",
  "💜",
  "🌸",
  "✨",
  "🥺",
  "🫶",
  "😘",
  "😌",
  "🌙",
  "⭐",
  "💌",
  "🦋",
  "🫂",
];

function toDate(value: Timestamp | null | undefined): Date | null {
  return value?.toDate?.() ?? null;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getMinuteKey(date: Date) {
  return `${getDateKey(date)}-${date.getHours()}-${date.getMinutes()}`;
}

function getDateLabel(date: Date) {
  const today = new Date();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTimeLabel(date: Date) {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function isRecentlyOnline(presence: Presence | null) {
  if (!presence?.isOnline) return false;

  const lastSeenDate = toDate(presence.lastSeen);
  if (!lastSeenDate) return false;

  return Date.now() - lastSeenDate.getTime() < ONLINE_TIMEOUT;
}

const CHAT_CSS = `
  .chat-page {
    min-height: 100dvh;
  }

  .chat-shell {
    height: 100dvh;
    max-width: 980px;
    padding: 92px 28px 22px;
    margin: 0 auto;
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 18px;
    margin-bottom: 14px;
    flex-shrink: 0;
  }

  .chat-title-wrap {
    flex: 1;
    min-width: 0;
  }

  .chat-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .chat-heart-dot {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background:
      radial-gradient(circle at 30% 25%, rgba(255,255,255,0.2), transparent 35%),
      linear-gradient(
        135deg,
        color-mix(in srgb, var(--aurora1) 24%, transparent),
        color-mix(in srgb, var(--aurora3) 18%, transparent)
      );
    border: 1px solid color-mix(in srgb, var(--aurora1) 26%, transparent);
    box-shadow: 0 0 18px color-mix(in srgb, var(--aurora1) 16%, transparent);
    font-size: 15px;
  }

  .chat-page-title {
    font-family: var(--font-serif);
    font-size: clamp(34px, 5vw, 50px);
    font-weight: 300;
    line-height: 1;
  }

  .chat-page-title span {
    background: linear-gradient(135deg, var(--aurora1), var(--aurora2), var(--aurora3));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .chat-sub {
    color: var(--muted);
    font-size: 13px;
    margin-top: 8px;
    letter-spacing: 0.3px;
  }

  .presence-line {
    margin-top: 12px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 13px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--card) 75%, transparent);
    border: 1px solid var(--border);
    color: var(--muted);
    font-size: 12px;
    backdrop-filter: blur(14px);
  }

  .presence-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--muted2);
    flex-shrink: 0;
  }

  .presence-line.online .presence-dot {
    background: #4ade80;
    box-shadow: 0 0 12px rgba(74, 222, 128, 0.8);
  }

  .presence-line.typing .presence-dot {
    background: var(--aurora1);
    box-shadow: 0 0 12px color-mix(in srgb, var(--aurora1) 75%, transparent);
  }

  .clear-chat-btn {
    padding: 8px 15px;
    border-radius: 999px;
    border: 1px solid rgba(251, 113, 133, 0.42);
    background: rgba(251, 113, 133, 0.08);
    color: #fb7185;
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.25s ease;
    backdrop-filter: blur(10px);
    white-space: nowrap;
  }

  .clear-chat-btn:hover {
    background: rgba(251, 113, 133, 0.18);
    color: white;
    box-shadow: 0 0 14px rgba(251, 113, 133, 0.35);
    transform: translateY(-1px);
  }

  .clear-chat-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .chat-card {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border);
    border-radius: 30px;
    background:
      radial-gradient(circle at 18% 8%, color-mix(in srgb, var(--aurora1) 9%, transparent), transparent 32%),
      radial-gradient(circle at 88% 82%, color-mix(in srgb, var(--aurora3) 8%, transparent), transparent 34%),
      color-mix(in srgb, var(--card) 78%, transparent);
    backdrop-filter: blur(24px);
    box-shadow:
      0 22px 70px rgba(0,0,0,0.22),
      inset 0 1px 0 rgba(255,255,255,0.06);
    overflow: hidden;
  }

  .chat-messages {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 22px 22px 12px;
    display: flex;
    flex-direction: column;
    gap: 7px;
    scroll-behavior: smooth;
  }

  .chat-messages::-webkit-scrollbar {
    width: 4px;
  }

  .chat-messages::-webkit-scrollbar-track {
    background: transparent;
  }

  .chat-messages::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 2px;
  }

  .chat-empty {
    text-align: center;
    color: var(--muted);
    margin: auto;
    line-height: 1.7;
    font-size: 13px;
  }

  .chat-date-divider {
    display: flex;
    justify-content: center;
    margin: 18px 0 8px;
  }

  .chat-date-divider span {
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.075);
    border: 1px solid var(--border);
    color: var(--muted);
    font-size: 11px;
    letter-spacing: 1px;
    backdrop-filter: blur(14px);
  }

  .chat-time-divider {
    text-align: center;
    color: var(--muted2);
    font-size: 10px;
    margin: 8px 0;
    opacity: 0.85;
  }

  .msg-row {
    width: 100%;
    display: flex;
    margin-bottom: 5px;
  }

  .msg-row.mine {
    justify-content: flex-end;
  }

  .msg-row.theirs {
    justify-content: flex-start;
  }

  .msg {
    max-width: min(72%, 560px);
    display: flex;
    flex-direction: column;
  }

  .msg.mine {
    align-items: flex-end;
  }

  .msg.theirs {
    align-items: flex-start;
  }

  .partner-label {
    font-size: 11px;
    color: var(--muted);
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding-left: 4px;
  }

  .msg-bubble {
    padding: 12px 17px;
    border-radius: 20px;
    font-size: 14px;
    line-height: 1.6;
    backdrop-filter: blur(20px);
    word-break: break-word;
    overflow-wrap: anywhere;
    box-shadow: 0 10px 24px rgba(0,0,0,0.12);
  }

  .msg.mine .msg-bubble {
    background:
      radial-gradient(circle at 20% 10%, rgba(255,255,255,0.16), transparent 28%),
      linear-gradient(
        135deg,
        color-mix(in srgb, var(--aurora1) 34%, transparent),
        color-mix(in srgb, var(--aurora3) 24%, transparent)
      );
    border: 1px solid color-mix(in srgb, var(--aurora1) 32%, transparent);
    border-bottom-right-radius: 7px;
  }

  .msg.theirs .msg-bubble {
    background:
      radial-gradient(circle at 18% 12%, rgba(255,255,255,0.08), transparent 28%),
      color-mix(in srgb, var(--card) 92%, transparent);
    border: 1px solid var(--border);
    border-bottom-left-radius: 7px;
  }

  .typing-row {
    align-self: flex-start;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 4px 0 10px;
    color: var(--muted);
    font-size: 12px;
  }

  .typing-bubble {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 10px 14px;
    border-radius: 999px;
    background: var(--card);
    border: 1px solid var(--border);
    backdrop-filter: blur(20px);
  }

  .typing-bubble span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--aurora1);
    animation: typingBounce 1.2s infinite ease-in-out;
  }

  .typing-bubble span:nth-child(2) {
    animation-delay: 0.15s;
  }

  .typing-bubble span:nth-child(3) {
    animation-delay: 0.3s;
  }

  @keyframes typingBounce {
    0%, 80%, 100% {
      transform: translateY(0);
      opacity: 0.45;
    }

    40% {
      transform: translateY(-4px);
      opacity: 1;
    }
  }

  .chat-input-wrap {
    position: relative;
    padding: 14px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 10px;
    align-items: center;
    background:
      linear-gradient(180deg, transparent, rgba(0,0,0,0.08)),
      color-mix(in srgb, var(--bg2) 24%, transparent);
  }

  .chat-composer {
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background:
      radial-gradient(circle at 10% 50%, color-mix(in srgb, var(--aurora1) 8%, transparent), transparent 25%),
      rgba(255,255,255,0.045);
    padding: 6px 8px;
    transition: all 0.25s ease;
  }

  .chat-composer:focus-within {
    border-color: var(--aurora1);
    box-shadow: 0 0 20px color-mix(in srgb, var(--aurora1) 16%, transparent);
    background: rgba(255,255,255,0.06);
  }

  .emoji-toggle {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid transparent;
    background: color-mix(in srgb, var(--aurora2) 11%, transparent);
    color: var(--text);
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 17px;
    transition: all 0.22s ease;
    flex-shrink: 0;
  }

  .emoji-toggle:hover,
  .emoji-toggle.active {
    border-color: color-mix(in srgb, var(--aurora1) 30%, transparent);
    background: color-mix(in srgb, var(--aurora1) 16%, transparent);
    transform: translateY(-1px) scale(1.04);
  }

  .chat-input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    color: var(--text);
    padding: 8px 6px;
    font-family: var(--font-sans);
    font-size: 14px;
    outline: none;
  }

  .chat-input::placeholder {
    color: var(--muted2);
  }

  .emoji-panel {
    position: absolute;
    left: 0;
    bottom: 54px;
    width: min(310px, calc(100vw - 64px));
    padding: 12px;
    border-radius: 22px;
    border: 1px solid var(--border);
    background:
      radial-gradient(circle at 20% 15%, color-mix(in srgb, var(--aurora1) 12%, transparent), transparent 34%),
      color-mix(in srgb, var(--bg2) 88%, black);
    backdrop-filter: blur(24px);
    box-shadow: 0 18px 55px rgba(0,0,0,0.34);
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 6px;
    z-index: 20;
    animation: emojiPop 0.18s ease both;
  }

  @keyframes emojiPop {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .emoji-choice {
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 11px;
    background: transparent;
    cursor: pointer;
    font-size: 18px;
    transition: all 0.18s ease;
  }

  .emoji-choice:hover {
    background: color-mix(in srgb, var(--aurora1) 15%, transparent);
    transform: translateY(-1px) scale(1.12);
  }

  .chat-send {
    position: relative;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--aurora1) 38%, transparent);
    background:
      radial-gradient(circle at 28% 22%, rgba(255,255,255,0.32), transparent 28%),
      linear-gradient(135deg, var(--aurora1), var(--aurora2), var(--aurora3));
    color: white;
    cursor: pointer;
    font-size: 18px;
    display: grid;
    place-items: center;
    transition: all 0.25s ease;
    flex-shrink: 0;
    box-shadow:
      0 0 20px color-mix(in srgb, var(--aurora1) 22%, transparent),
      0 10px 24px rgba(0,0,0,0.18);
    overflow: hidden;
  }

  .chat-send::before {
    content: "";
    position: absolute;
    inset: -40%;
    background: linear-gradient(
      120deg,
      transparent,
      rgba(255,255,255,0.36),
      transparent
    );
    transform: translateX(-70%) rotate(20deg);
    transition: transform 0.45s ease;
  }

  .chat-send:hover::before {
    transform: translateX(70%) rotate(20deg);
  }

  .chat-send:hover {
    transform: translateY(-2px) scale(1.06);
    box-shadow:
      0 0 26px color-mix(in srgb, var(--aurora1) 32%, transparent),
      0 14px 30px rgba(0,0,0,0.22);
  }

  .chat-send:active {
    transform: scale(0.96);
  }

  .chat-send:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .chat-send span {
    position: relative;
    z-index: 1;
    transform: translateX(1px);
  }

  @media (max-width: 640px) {
    .chat-shell {
      padding: 82px 14px 104px;
    }

    .chat-header {
      gap: 10px;
      margin-bottom: 12px;
    }

    .chat-heart-dot {
      width: 30px;
      height: 30px;
      font-size: 13px;
    }

    .chat-page-title {
      font-size: 34px;
    }

    .chat-sub {
      font-size: 12px;
    }

    .presence-line {
      font-size: 11px;
      padding: 5px 10px;
      margin-top: 9px;
    }

    .clear-chat-btn {
      padding: 7px 10px;
      font-size: 9px;
      letter-spacing: 0.5px;
    }

    .chat-card {
      border-radius: 24px;
    }

    .chat-messages {
      padding: 16px 13px 10px;
      gap: 6px;
    }

    .msg {
      max-width: 84%;
    }

    .msg-bubble {
      padding: 10px 14px;
      font-size: 13px;
      line-height: 1.5;
    }

    .partner-label {
      font-size: 11px;
    }

    .chat-input-wrap {
      padding: 10px;
      gap: 8px;
    }

    .chat-composer {
      padding: 5px 7px;
      gap: 6px;
    }

    .emoji-toggle {
      width: 32px;
      height: 32px;
      font-size: 16px;
    }

    .chat-input {
      padding: 7px 4px;
      font-size: 13px;
    }

    .chat-send {
      width: 42px;
      height: 42px;
      font-size: 16px;
    }

    .emoji-panel {
      bottom: 50px;
      width: min(292px, calc(100vw - 42px));
      grid-template-columns: repeat(8, 1fr);
      padding: 10px;
      border-radius: 20px;
    }

    .emoji-choice {
      width: 28px;
      height: 28px;
      font-size: 17px;
    }
  }
`;

export function ChatPage({ user, partner, bond }: ChatPageProps) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [clearing, setClearing] = useState(false);
  const [partnerPresence, setPartnerPresence] = useState<Presence | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bondId = user?.bondId;
  const currentUid = auth.currentUser?.uid || user?.uid;

  const partnerUid =
    bond?.user1Uid === currentUid ? bond?.user2Uid : bond?.user1Uid;

  const partnerDisplayNickname =
    bond?.nicknames?.[partnerUid || ""] || partner?.nickname || "Partner";

  const partnerOnline = isRecentlyOnline(partnerPresence);
  const partnerTyping = Boolean(partnerPresence?.typing) && partnerOnline;

  const writePresence = async (updates: Partial<Presence>) => {
    if (!bondId || !currentUid) return;

    await setDoc(
      doc(db, "bonds", bondId, "presence", currentUid),
      {
        ...updates,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const updateTypingStatus = (typing: boolean) => {
    writePresence({
      isOnline: true,
      typing,
      lastSeen: serverTimestamp() as unknown as Timestamp,
    }).catch(() => { });
  };

  useEffect(() => {
    if (!bondId) return;

    const messagesQuery = query(
      collection(db, "bonds", bondId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(
      messagesQuery,
      (snap) => {
        const nextMessages = snap.docs.map((messageDoc) => {
          const data = messageDoc.data();

          return {
            id: messageDoc.id,
            sender: data.sender || "",
            text: data.text || "",
            createdAt: data.createdAt || null,
          };
        }) as ChatMessage[];

        setMessages(nextMessages);
      },
      (error) => {
        console.error("Chat messages listener error:", error);
      }
    );

    return unsub;
  }, [bondId]);

  useEffect(() => {
    if (!bondId || !partnerUid) return;

    const partnerPresenceRef = doc(db, "bonds", bondId, "presence", partnerUid);

    const unsub = onSnapshot(
      partnerPresenceRef,
      (snap) => {
        setPartnerPresence(snap.exists() ? (snap.data() as Presence) : null);
      },
      (error) => {
        console.error("Partner presence listener error:", error);
      }
    );

    return unsub;
  }, [bondId, partnerUid]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      updateTypingStatus(false);
    };
    // Only run on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDraftChange = (value: string) => {
    setDraft(value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const hasText = value.trim().length > 0;

    updateTypingStatus(hasText);

    if (hasText) {
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingStatus(false);
      }, TYPING_TIMEOUT);
    }
  };

  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    const start = input?.selectionStart ?? draft.length;
    const end = input?.selectionEnd ?? draft.length;

    const nextValue = `${draft.slice(0, start)}${emoji}${draft.slice(end)}`;

    handleDraftChange(nextValue);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
      const nextCursor = start + emoji.length;
      inputRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const send = async () => {
    const text = draft.trim();

    if (!text || !bondId || !currentUid) return;

    await addDoc(collection(db, "bonds", bondId, "messages"), {
      sender: currentUid,
      text,
      createdAt: serverTimestamp(),
    });

    setDraft("");
    setShowEmojiPicker(false);
    updateTypingStatus(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const clearChat = async () => {
    if (!bondId || messages.length === 0) return;

    const confirmClear = window.confirm("Clear the entire chat?");
    if (!confirmClear) return;

    try {
      setClearing(true);

      const snap = await getDocs(collection(db, "bonds", bondId, "messages"));

      if (snap.empty) return;

      const batch = writeBatch(db);

      snap.docs.forEach((messageDoc) => {
        batch.delete(messageDoc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error("Clear chat error:", error);
      alert("Could not clear chat. Check console for details.");
    } finally {
      setClearing(false);
    }
  };

  if (!bondId) {
    return (
      <div className="page">
        <div className="inner-wrap">
          <div className="page-title">Chat</div>
          <div className="chat-empty">No bond connected yet ✨</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{CHAT_CSS}</style>

      <div className="page chat-page">
        <div className="aurora-bg" />
        <ThemeBackdrop />

        <div className="chat-shell">
          <div className="chat-header">
            <div className="chat-title-wrap">
              <div className="chat-title-row">
                <div className="chat-heart-dot">💬</div>

                <div className="chat-page-title">
                  Chat <span>∞</span>
                </div>
              </div>

              <div className="chat-sub">
                Soft words that travel any distance.
              </div>

              <div
                className={`presence-line ${partnerTyping ? "typing" : partnerOnline ? "online" : ""
                  }`}
              >
                <span className="presence-dot" />

                {partnerTyping
                  ? `${partnerDisplayNickname} is typing...`
                  : partnerOnline
                    ? `${partnerDisplayNickname} is online`
                    : `${partnerDisplayNickname} is offline`}
              </div>
            </div>

            <button
              className="clear-chat-btn"
              type="button"
              onClick={clearChat}
              disabled={clearing || messages.length === 0}
            >
              {clearing ? "Clearing..." : "Clear chat"}
            </button>
          </div>

          <div className="chat-card">
            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="chat-empty">
                  Start your first conversation ✨
                </div>
              )}

              {messages.map((message, index) => {
                const isMine = message.sender === currentUid;

                const currentDate = toDate(message.createdAt);
                const previousDate = toDate(messages[index - 1]?.createdAt);

                const showDateDivider =
                  currentDate &&
                  (!previousDate ||
                    getDateKey(currentDate) !== getDateKey(previousDate));

                const showTimeDivider =
                  currentDate &&
                  (!previousDate ||
                    getMinuteKey(currentDate) !== getMinuteKey(previousDate));

                return (
                  <Fragment key={message.id}>
                    {showDateDivider && (
                      <div className="chat-date-divider">
                        <span>{getDateLabel(currentDate)}</span>
                      </div>
                    )}

                    {showTimeDivider && (
                      <div className="chat-time-divider">
                        {getTimeLabel(currentDate)}
                      </div>
                    )}

                    <div className={`msg-row ${isMine ? "mine" : "theirs"}`}>
                      <div className={`msg ${isMine ? "mine" : "theirs"}`}>
                        {!isMine && (
                          <div className="partner-label">
                            <span>{partner?.avatar ?? "🌸"}</span>
                            {partnerDisplayNickname}
                          </div>
                        )}

                        <div className="msg-bubble">{message.text}</div>
                      </div>
                    </div>
                  </Fragment>
                );
              })}

              {partnerTyping && (
                <div className="typing-row">
                  <span>{partner?.avatar ?? "🌸"}</span>

                  <div className="typing-bubble">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>

            <div className="chat-input-wrap">
              <div className="chat-composer">
                <button
                  className={`emoji-toggle ${showEmojiPicker ? "active" : ""}`}
                  type="button"
                  onClick={() => setShowEmojiPicker((current) => !current)}
                  aria-label="Open emoji picker"
                >
                  😊
                </button>

                <input
                  ref={inputRef}
                  className="chat-input"
                  placeholder="Write something beautiful…"
                  value={draft}
                  onChange={(event) => handleDraftChange(event.target.value)}
                  onFocus={() => {
                    if (draft.trim()) updateTypingStatus(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") send();
                    if (event.key === "Escape") setShowEmojiPicker(false);
                  }}
                />

                {showEmojiPicker && (
                  <div className="emoji-panel">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        className="emoji-choice"
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="chat-send"
                type="button"
                onClick={send}
                disabled={!draft.trim()}
                aria-label="Send message"
              >
                <span>➤</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}