"use client";

import type { Timestamp } from "firebase/firestore";
import { Fragment, useState, useRef, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  writeBatch,
  doc,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { User, Partner, Bond } from "../../lib/types";
import { PetalCanvas } from "../ui/PetalCanvas";

interface ChatPageProps {
  user: (User & { bondId?: string; uid?: string }) | null;
  partner: (Partner & { uid?: string }) | null;
  bond: Bond | null;
}

export interface Message {
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

function toDate(value: Timestamp | null | undefined): Date | null {
  if (!value) return null;

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  return null;
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
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
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

function isPartnerRecentlyOnline(presence: Presence | null) {
  if (!presence?.isOnline) return false;

  const lastSeenDate = toDate(presence.lastSeen);
  if (!lastSeenDate) return false;

  return Date.now() - lastSeenDate.getTime() < ONLINE_TIMEOUT;
}

const CHAT_CSS = `
  .chat-outer {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 200px);
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }

  .chat-title-wrap {
    flex: 1;
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

.msg.mine .msg-bubble {
  border-bottom-right-radius: 6px;
}

.msg.theirs .msg-bubble {
  border-bottom-left-radius: 6px;
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
  }

  .msg.mine .msg-bubble {
    background: linear-gradient(
      135deg,
      rgba(192,132,252,0.3),
      rgba(251,113,133,0.2)
    );
    border: 1px solid rgba(192,132,252,0.3);
  }

  .msg.theirs .msg-bubble {
    background: var(--card);
    border: 1px solid var(--border);
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
    .chat-header {
      align-items: flex-start;
    }

    .clear-chat-btn {
      padding: 7px 12px;
      font-size: 10px;
    }

    .msg {
      max-width: 82%;
    }
  }
`;

export function ChatPage({ user, partner, bond }: ChatPageProps) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [clearing, setClearing] = useState(false);
  const [partnerPresence, setPartnerPresence] = useState<Presence | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bondId = user?.bondId;
  const currentUid = auth.currentUser?.uid || user?.uid;
  console.log("CHAT DEBUG:", {
    authUid: auth.currentUser?.uid,
    userUid: user?.uid,
    currentUid,
    bondId,
    bondUser1Uid: bond?.user1Uid,
    bondUser2Uid: bond?.user2Uid,
    isUser1: currentUid === bond?.user1Uid,
    isUser2: currentUid === bond?.user2Uid,
  });
  const partnerDisplayNickname =
    bond?.nicknames?.[partner?.uid || ""] || partner?.nickname || "Partner";

  const partnerOnline = isPartnerRecentlyOnline(partnerPresence);
  const partnerTyping = Boolean(partnerPresence?.typing) && partnerOnline;

  useEffect(() => {
    if (!bondId) return;

    const q = query(
      collection(db, "bonds", bondId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const msgs = snap.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            sender: data.sender || "",
            text: data.text || "",
            createdAt: data.createdAt || null,
          };
        }) as Message[];

        setMessages(msgs);
      },
      (error) => {
        console.error("Chat messages listener error:", error);
      }
    );

    return unsub;
  }, [bondId]);

  useEffect(() => {
    if (!bondId || !currentUid) return;

    const presenceRef = doc(db, "bonds", bondId, "presence", currentUid);

    const setOnline = async () => {
      await setDoc(
        presenceRef,
        {
          isOnline: true,
          typing: false,
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    };

    const setOffline = () => {
      setDoc(
        presenceRef,
        {
          isOnline: false,
          typing: false,
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => { });
    };

    setOnline();

    const heartbeat = window.setInterval(() => {
      setDoc(
        presenceRef,
        {
          isOnline: true,
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => { });
    }, 20000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setOnline();
      } else {
        setDoc(
          presenceRef,
          {
            typing: false,
            lastSeen: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => { });
      }
    };

    window.addEventListener("beforeunload", setOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener("beforeunload", setOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      setOffline();
    };
  }, [bondId, currentUid]);

  useEffect(() => {
    if (!bondId || !partner?.uid) return;

    const partnerPresenceRef = doc(db, "bonds", bondId, "presence", partner.uid);

    const unsub = onSnapshot(partnerPresenceRef, (snap) => {
      if (!snap.exists()) {
        setPartnerPresence(null);
        return;
      }

      setPartnerPresence(snap.data() as Presence);
    });

    return unsub;
  }, [bondId, partner?.uid]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerTyping]);

  const updateTypingStatus = (typing: boolean) => {
    if (!bondId || !currentUid) return;

    const presenceRef = doc(db, "bonds", bondId, "presence", currentUid);

    setDoc(
      presenceRef,
      {
        isOnline: true,
        typing,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch(() => { });
  };

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
      }, 2500);
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
    }
  };

  const clearChat = async () => {
    if (!bondId || messages.length === 0) return;

    const confirmClear = window.confirm("Clear the entire chat?");
    if (!confirmClear) return;

    try {
      setClearing(true);

      const messagesRef = collection(db, "bonds", bondId, "messages");
      const snap = await getDocs(messagesRef);

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

          <div
            style={{
              color: "var(--muted)",
              marginTop: 40,
              textAlign: "center",
            }}
          >
            No bond connected yet ✨
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{CHAT_CSS}</style>

      <div className="page" style={{ height: "100vh" }}>
        <div className="aurora-bg" />
        <PetalCanvas />

        <div
          className="inner-wrap"
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            paddingBottom: 20,
          }}
        >
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
              onClick={clearChat}
              disabled={clearing || messages.length === 0}
            >
              {clearing ? "Clearing..." : "Clear chat"}
            </button>
          </div>

          <div className="chat-outer">
            <div className="chat-messages">
              {messages.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--muted)",
                    marginTop: 40,
                  }}
                >
                  Start your first conversation ✨
                </div>
              )}

              {messages.map((m, index) => {
                const isMine = m.sender === currentUid;

                const currentDate = toDate(m.createdAt);
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
                  <Fragment key={m.id}>
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

                        <div className="msg-bubble">{m.text}</div>
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
                onChange={(e) => handleDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
              />

              <button className="chat-send" onClick={send}>
                ↑
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}