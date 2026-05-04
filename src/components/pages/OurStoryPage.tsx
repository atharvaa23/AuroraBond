"use client";
import { useEffect, useState } from "react";
import type { User, Partner, StoryEvent } from "../../lib/types";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PetalCanvas } from "../ui/PetalCanvas";

interface OurStoryPageProps {
  user: User | null;
  partner: Partner | null;
}

const STORY_CSS = `
  .timeline { position: relative; padding-left: 32px; }
  .timeline::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 1px;
    background: linear-gradient(to bottom, var(--aurora1), var(--aurora3), transparent);
  }
  .timeline-item { position: relative; margin-bottom: 40px; }
  .timeline-dot {
    position: absolute; left: -38px; top: 4px; width: 12px; height: 12px;
    border-radius: 50%; background: linear-gradient(135deg, var(--aurora1), var(--aurora3));
    box-shadow: 0 0 12px rgba(192,132,252,0.5);
  }
  .timeline-date { font-size: 11px; letter-spacing: 2px; color: var(--aurora1); text-transform: uppercase; margin-bottom: 6px; }
  .timeline-card {
    background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-md);
    padding: 20px 24px; backdrop-filter: blur(20px); transition: all 0.3s;
  }
  .timeline-card:hover { border-color: var(--border-glow); }
  .timeline-event-emoji { font-size: 24px; margin-bottom: 8px; }
  .timeline-event-title { font-family: var(--font-serif); font-size: 22px; margin-bottom: 6px; }
  .timeline-event-desc { color: var(--muted); font-size: 13px; line-height: 1.6; }
`;

function formatDate(raw: string) {
  try {
    return new Date(raw).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
  } catch {
    return raw;
  }
}

/**
 * OurStoryPage
 * ────────────
 * Owns: event list state, add/remove event, chronological sort.
 * Does NOT own: user identity (props), navigation.
 *
 * Firebase-ready:
 *  - Replace useStorage with Firestore collection on bond document.
 *  - Events stored as sub-collection: /bonds/{bondId}/events/{eventId}.
 *  - Both partners see events in real-time via onSnapshot.
 */
export function OurStoryPage({ user, partner }: OurStoryPageProps) {
  const [events, setEvents] = useState<StoryEvent[]>([]);
  const bondId = user?.bondId;
  useEffect(() => {
    if (!bondId) return;

    const q = query(
      collection(db, "bonds", bondId, "events"),
      orderBy("date", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as StoryEvent[];

      setEvents(data);
    });

    return unsub;
  }, [bondId]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date: "", emoji: "💜", title: "", desc: "" });

  const addEvent = async () => {
    if (!bondId || !form.title.trim() || !form.date) return;

    await addDoc(collection(db, "bonds", bondId, "events"), {
      ...form,
    });

    setForm({ date: "", emoji: "💜", title: "", desc: "" });
    setShowAdd(false);
  };


  const removeEvent = async (id: string) => {
    if (!bondId) return;

    await deleteDoc(doc(db, "bonds", bondId, "events", id));
  };

  const sorted = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <>
      <style>{STORY_CSS}</style>
      <div className="page">
        <div className="aurora-bg" />
        <PetalCanvas />

        <div className="inner-wrap">
          <div className="page-title">Our <span>Story</span></div>
          <div className="page-sub">Every chapter of your love, written in the stars.</div>

          <button className="add-btn" onClick={() => setShowAdd(true)}>+ Add a Moment</button>

          <div className="timeline">
            {sorted.map((ev) => (
              <div className="timeline-item" key={ev.id}>
                <div className="timeline-dot" />
                <div className="timeline-date">{formatDate(ev.date)}</div>
                <div className="timeline-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div className="timeline-event-emoji">{ev.emoji}</div>
                      <div className="timeline-event-title">{ev.title}</div>
                      <div className="timeline-event-desc">{ev.desc}</div>
                    </div>
                    <span
                      style={{ cursor: "pointer", color: "var(--muted2)", fontSize: 18, paddingLeft: 16 }}
                      onClick={() => removeEvent(ev.id)}
                    >
                      ×
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showAdd && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}>
            <div className="modal">
              <div className="modal-title">Add a Moment</div>
              {(
                [
                  { label: "Date", key: "date", type: "date" },
                  { label: "Emoji", key: "emoji", type: "text" },
                  { label: "Title", key: "title", type: "text" },
                  { label: "Description", key: "desc", type: "text" },
                ] as const
              ).map(({ label, key, type }) => (
                <div className="input-wrap" key={key}>
                  <label className="input-label">{label}</label>
                  <input
                    className="input-field"
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn-primary btn-confirm" onClick={addEvent}>Add to Our Story</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}