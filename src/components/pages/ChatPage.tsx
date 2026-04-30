"use client";
import type { Timestamp } from "firebase/firestore";
import { useState, useRef, useEffect } from "react";
import type { User, Partner } from "../../lib/types";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

import { PetalCanvas } from "../ui/PetalCanvas";

interface ChatPageProps {
  user: (User & { bondId?: string }) | null;
  partner: Partner | null;
}

const CHAT_CSS = `
  .chat-outer { display: flex; flex-direction: column; height: calc(100vh - 200px); }
  .chat-messages {
    flex: 1; overflow-y: auto; padding: 20px 0;
    display: flex; flex-direction: column; gap: 16px; min-height: 0;
  }
  .chat-messages::-webkit-scrollbar { width: 4px; }
  .chat-messages::-webkit-scrollbar-track { background: transparent; }
  .chat-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .msg { max-width: 70%; }
  .msg.mine { align-self: flex-end; }
  .msg.theirs { align-self: flex-start; }
  .msg-bubble { padding: 12px 18px; border-radius: 18px; font-size: 14px; line-height: 1.6; backdrop-filter: blur(20px); }
  .msg.mine   .msg-bubble { background: linear-gradient(135deg, rgba(192,132,252,0.3), rgba(251,113,133,0.2)); border: 1px solid rgba(192,132,252,0.3); }
  .msg.theirs .msg-bubble { background: var(--card); border: 1px solid var(--border); }
  .msg-time { font-size: 10px; color: var(--muted2); margin-top: 4px; text-align: right; }
  .msg.theirs .msg-time { text-align: left; }

  .chat-input-wrap {
    padding: 16px 0; border-top: 1px solid var(--border);
    display: flex; gap: 12px; align-items: center;
  }
  .chat-input {
    flex: 1; background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-full); color: var(--text); padding: 12px 20px;
    font-family: var(--font-sans); font-size: 14px; outline: none; transition: all 0.3s;
  }
  .chat-input:focus { border-color: var(--aurora1); }
  .chat-input::placeholder { color: var(--muted2); }
  .chat-send {
    background: linear-gradient(135deg, var(--aurora1), var(--aurora3));
    color: white; border: none; width: 44px; height: 44px; border-radius: 50%;
    cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;
    transition: all 0.3s; flex-shrink: 0;
  }
  .chat-send:hover { transform: scale(1.1); box-shadow: 0 0 20px rgba(192,132,252,0.4); }
`;



/**
 * ChatPage
 * ────────
 * Owns: message list state, draft input, scroll-to-bottom.
 * Does NOT own: user identity (props), navigation.
 *
 * Firebase-ready:
 *  - Replace useStorage with a Firestore onSnapshot listener keyed to bond ID.
 *  - Each addDoc() call replaces the local setMessages push.
 *  - Messages arrive in real-time for both partners — no polling needed.
 *  - sender field ("me" / "partner") becomes the user's UID for disambiguation.
 */
export interface Message {
  id: string;
  sender: string;
  text: string;
  createdAt: Timestamp | null;
}
export function ChatPage({ user, partner }: ChatPageProps) {
  
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const bondId = user?.bondId;

 useEffect(() => {
  if (!bondId) return;

  const q = query(
    collection(db, "bonds", bondId, "messages"),
    orderBy("createdAt", "asc")
  );

  const unsub = onSnapshot(q, (snap) => {
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
  });

  return unsub;
}, [bondId]);

useEffect(() => {
  endRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

  const send = async () => {
  if (!draft.trim() || !bondId || !auth.currentUser) return;

  await addDoc(
    collection(db, "bonds", bondId, "messages"),
    {
      sender: auth.currentUser.uid,
      text: draft,
      createdAt: serverTimestamp(),
    }
  );

  setDraft("");
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

        <div className="inner-wrap" style={{ height: "100%", display: "flex", flexDirection: "column", paddingBottom: 20 }}>
          <div className="page-title">Chat <span>∞</span></div>
          <div className="page-sub" style={{ marginBottom: 0 }}>Soft words that travel any distance.</div>

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
              {messages.map((m) => {
  const isMine = m.sender === auth.currentUser?.uid;

  return (
    <div
      key={m.id}
      className={`msg ${isMine ? "mine" : "theirs"}`}
    >
      {!isMine && (
        <div
          style={{
            fontSize: 12,
            color: "var(--muted)",
            marginBottom: 4,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>{partner?.avatar ?? "🌸"}</span>
          {partner?.nickname ?? "Partner"}
        </div>
      )}

      <div className="msg-bubble">{m.text}</div>

      <div className="msg-time">
        {m.createdAt?.toDate?.().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }) || ""}
      </div>
    </div>
  );
})}
              <div ref={endRef} />
            </div>

            <div className="chat-input-wrap">
              <input
                className="chat-input"
                placeholder="Write something beautiful…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button className="chat-send" onClick={send}>↑</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}