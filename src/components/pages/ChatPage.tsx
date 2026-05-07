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
    height: 100dvh;
  }

  .chat-shell {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding-bottom: 20px;
  }

  .chat-outer {
    display: flex;
    flex-direction: column;
    height: calc(100dvh - 200px);
    min-height: 0;
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 16px;
  }

  .chat-title-wrap {
    flex: 1;
    min-width: 0;
  }

  .presence-line {
    margin-top: 10px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--border);
    color: var(--muted);
    font-size: 12px;
    backdrop-filter: blur(12px);
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
    box-shadow: 0 0 12px rgba(192, 132, 252, 0.8);
  }

  .clear-chat-btn {
    padding: 8px 16px;
    border-radius: 999px;
    border: 1px solid rgba(251, 113, 133, 0.45);
    background: rgba(251, 113, 133, 0.08);
    color: #fb7185;
    font-size: 11px;
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

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
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
    margin-top: 40px;
  }

  .chat-date-divider {
    display: flex;
    justify-content: center;
    margin: 18px 0 8px;
  }

  .chat-date-divider span {
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid var(--border);
    color: var(--muted);
    font-size: 11px;
    letter-spacing: 1px;
  }

  .chat-time-divider {
    text-align: center;
    color: var(--muted2);
    font-size: 10px;
    margin: 8px 0;
    opacity: 0.8;
  }

  .msg-row {
    width: 100%;
    display: flex;
    margin-bottom: 6px;
  }

  .msg-row.mine {
    justify-content: flex-end;
  }

  .msg-row.theirs {
    justify-content: flex-start;
  }

  .msg {
    max-width: 70%;
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
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .msg-bubble {
    padding: 12px 18px;
    border-radius: 18px;
    font-size: 14px;
    line-height: 1.6;
    backdrop-filter: blur(20px);
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  .msg.mine .msg-bubble {
    background: linear-gradient(
      135deg,
      rgba(192,132,252,0.3),
      rgba(251,113,133,0.2)
    );
    border: 1px solid rgba(192,132,252,0.3);
    border-bottom-right-radius: 6px;
  }

  .msg.theirs .msg-bubble {
    background: var(--card);
    border: 1px solid var(--border);
    border-bottom-left-radius: 6px;
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
    padding: 16px 0;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .chat-input {
    flex: 1;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    color: var(--text);
    padding: 12px 20px;
    font-family: var(--font-sans);
    font-size: 14px;
    outline: none;
    transition: all 0.3s;
    min-width: 0;
  }

  .chat-input:focus {
    border-color: var(--aurora1);
  }

  .chat-input::placeholder {
    color: var(--muted2);
  }

  .chat-send {
    background: linear-gradient(135deg, var(--aurora1), var(--aurora3));
    color: white;
    border: none;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
    flex-shrink: 0;
  }

  .chat-send:hover {
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(192,132,252,0.4);
  }

  @media (max-width: 640px) {
    .chat-page {
      height: 100dvh;
    }

    .chat-shell {
      padding-bottom: 96px;
    }

    .chat-outer {
      height: calc(100dvh - 215px);
    }

    .chat-header {
      gap: 12px;
    }

    .presence-line {
      font-size: 11px;
      padding: 5px 10px;
    }

    .clear-chat-btn {
      padding: 7px 11px;
      font-size: 9px;
      letter-spacing: 0.5px;
    }

    .chat-messages {
      padding: 14px 0;
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
      padding: 12px 0;
      gap: 8px;
    }

    .chat-input {
      padding: 11px 16px;
      font-size: 13px;
    }

    .chat-send {
      width: 40px;
      height: 40px;
      font-size: 15px;
    }
  }
`;

export function ChatPage({ user, partner, bond }: ChatPageProps) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [clearing, setClearing] = useState(false);
  const [partnerPresence, setPartnerPresence] = useState<Presence | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
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

  const send = async () => {
    const text = draft.trim();

    if (!text || !bondId || !currentUid) return;

    await addDoc(collection(db, "bonds", bondId, "messages"), {
      sender: currentUid,
      text,
      createdAt: serverTimestamp(),
    });

    setDraft("");
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

        <div className="inner-wrap chat-shell">
          <div className="chat-header">
            <div className="chat-title-wrap">
              <div className="page-title">
                Chat <span>∞</span>
              </div>

              <div className="page-sub" style={{ marginBottom: 0 }}>
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

          <div className="chat-outer">
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
              <input
                className="chat-input"
                placeholder="Write something beautiful…"
                value={draft}
                onChange={(event) => handleDraftChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") send();
                }}
              />

              <button className="chat-send" type="button" onClick={send}>
                ↑
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}