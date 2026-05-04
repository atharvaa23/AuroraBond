"use client";

import { useEffect, useState } from "react";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { PetalCanvas } from "../ui/PetalCanvas";
import type { User, Partner, Bond } from "../../lib/types";

interface MusicPageProps {
    user: User | null;
    partner: Partner | null;
    bond: Bond | null;
}

interface MusicItem {
    id: string;
    title: string;
    url: string;
    type: string;
    note: string;
    addedBy: string;
}

const MUSIC_TYPES = [
    "Playlist",
    "Jam",
    "Song",
    "Album",
    "Artist",
    "Other",
];

function getSpotifyEmbedUrl(link: string) {
    try {
        const url = new URL(link);

        if (!url.hostname.includes("spotify.com")) return "";

        const parts = url.pathname.split("/").filter(Boolean);
        const type = parts[0];
        const id = parts[1];

        const embeddableTypes = [
            "playlist",
            "track",
            "album",
            "artist",
            "show",
            "episode",
        ];

        if (!type || !id || !embeddableTypes.includes(type)) {
            return "";
        }

        return `https://open.spotify.com/embed/${type}/${id}`;
    } catch {
        return "";
    }
}

function isValidUrl(value: string) {
    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
}

const MUSIC_CSS = `
  .music-wrap {
    padding: 100px 40px 60px;
    max-width: 1100px;
    margin: 0 auto;
    position: relative;
    z-index: 2;
  }

  @media (max-width: 640px) {
    .music-wrap {
      padding: 90px 20px 120px;
    }
  }

  .music-create-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 26px;
    backdrop-filter: blur(20px);
    margin-bottom: 28px;
  }

  .music-form-grid {
    display: grid;
    grid-template-columns: 1fr 170px;
    gap: 14px;
    margin-bottom: 14px;
  }

  @media (max-width: 640px) {
    .music-form-grid {
      grid-template-columns: 1fr;
    }
  }

  .music-input,
  .music-select,
  .music-textarea {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 16px;
    color: var(--text);
    padding: 13px 16px;
    font-family: var(--font-sans);
    outline: none;
    transition: all 0.25s ease;
  }

  .music-input:focus,
  .music-select:focus,
  .music-textarea:focus {
    border-color: var(--aurora1);
    box-shadow: 0 0 14px rgba(192,132,252,0.18);
  }

  .music-select {
  width: 100%;
  background: rgba(20, 14, 34, 0.95);
  border: 1px solid var(--border);
  border-radius: 16px;
  color: var(--text);
  padding: 13px 42px 13px 16px;
  font-family: var(--font-sans);
  outline: none;
  transition: all 0.25s ease;
  cursor: pointer;

  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  background-image:
    linear-gradient(45deg, transparent 50%, var(--aurora1) 50%),
    linear-gradient(135deg, var(--aurora1) 50%, transparent 50%);
  background-position:
    calc(100% - 22px) 50%,
    calc(100% - 16px) 50%;
  background-size:
    6px 6px,
    6px 6px;
  background-repeat: no-repeat;
}

.music-select option {
  background: #120c22;
  color: white;
}

  .music-textarea {
    min-height: 76px;
    resize: vertical;
    margin-bottom: 14px;
  }

  .music-add-btn {
    border: 1px solid rgba(192,132,252,0.45);
    background: linear-gradient(135deg, rgba(192,132,252,0.28), rgba(251,113,133,0.18));
    color: var(--text);
    padding: 12px 22px;
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: all 0.25s ease;
  }

  .music-add-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 18px rgba(192,132,252,0.3);
  }

  .music-add-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .music-error {
    margin-top: 12px;
    color: #fb7185;
    font-size: 12px;
  }

  .music-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 18px;
  }

  .music-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 22px;
    backdrop-filter: blur(20px);
    overflow: hidden;
  }

  .music-card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 14px;
  }

  .music-type {
    font-size: 10px;
    letter-spacing: 2px;
    color: var(--aurora1);
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .music-title {
    font-family: var(--font-serif);
    font-size: 23px;
    font-weight: 300;
    line-height: 1.25;
  }

  .music-note {
    color: var(--muted);
    font-size: 13px;
    line-height: 1.6;
    margin-bottom: 16px;
  }

  .music-added {
    color: var(--muted2);
    font-size: 11px;
    margin-bottom: 14px;
  }

  .music-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 14px;
  }

  .music-link-btn,
  .music-delete-btn {
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.04);
    color: var(--text);
    padding: 9px 14px;
    border-radius: var(--radius-full);
    cursor: pointer;
    font-size: 12px;
    text-decoration: none;
    transition: all 0.25s ease;
  }

  .music-link-btn:hover {
    border-color: var(--aurora1);
    color: var(--aurora1);
  }

  .music-delete-btn {
    color: #fb7185;
    border-color: rgba(251,113,133,0.35);
  }

  .music-delete-btn:hover {
    background: rgba(251,113,133,0.12);
  }

  .spotify-frame {
    width: 100%;
    height: 152px;
    border: none;
    border-radius: 16px;
    margin-top: 10px;
  }

  .music-empty {
    text-align: center;
    color: var(--muted);
    margin-top: 50px;
    line-height: 1.7;
  }
`;

export function MusicPage({ user, partner, bond }: MusicPageProps) {
    const [items, setItems] = useState<MusicItem[]>([]);
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [type, setType] = useState("Playlist");
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const bondId = user?.bondId;
    const currentUid = auth.currentUser?.uid || user?.uid;

    const myNickname =
        bond?.nicknames?.[currentUid || ""] || user?.nickname || "You";

    const partnerUid =
        bond?.user1Uid === currentUid ? bond?.user2Uid : bond?.user1Uid;

    const partnerNickname =
        bond?.nicknames?.[partnerUid || ""] || partner?.nickname || "Partner";

    useEffect(() => {
        if (!bondId) return;

        const q = query(
            collection(db, "bonds", bondId, "musicLinks"),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map((musicDoc) => {
                const data = musicDoc.data();

                return {
                    id: musicDoc.id,
                    title: data.title || "Untitled",
                    url: data.url || "",
                    type: data.type || "Other",
                    note: data.note || "",
                    addedBy: data.addedBy || "",
                };
            }) as MusicItem[];

            setItems(list);
        });

        return unsub;
    }, [bondId]);

    const addMusic = async () => {
        const cleanedUrl = url.trim();
        const cleanedTitle = title.trim();
        const cleanedNote = note.trim();

        if (!bondId || !currentUid) return;

        if (!cleanedUrl) {
            setError("Paste a music link first.");
            return;
        }

        if (!isValidUrl(cleanedUrl)) {
            setError("Enter a valid link starting with https://");
            return;
        }

        try {
            setSaving(true);
            setError("");

            await addDoc(collection(db, "bonds", bondId, "musicLinks"), {
                title: cleanedTitle || type,
                url: cleanedUrl,
                type,
                note: cleanedNote,
                addedBy: currentUid,
                createdAt: serverTimestamp(),
            });

            setTitle("");
            setUrl("");
            setType("Playlist");
            setNote("");
        } catch (err) {
            console.error("Add music error:", err);
            setError("Could not save music link.");
        } finally {
            setSaving(false);
        }
    };

    const deleteMusic = async (id: string) => {
        if (!bondId) return;

        const confirmDelete = window.confirm("Delete this music link?");
        if (!confirmDelete) return;

        await deleteDoc(doc(db, "bonds", bondId, "musicLinks", id));
    };

    if (!bondId) {
        return (
            <div className="page">
                <div className="inner-wrap">
                    <div className="page-title">Music</div>

                    <div style={{ color: "var(--muted)", marginTop: 40, textAlign: "center" }}>
                        No bond connected yet 🎧
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{MUSIC_CSS}</style>

            <div className="page">
                <div className="aurora-bg" />
                <PetalCanvas />

                <div className="music-wrap">
                    <div className="page-title">
                        Our <span>Music</span>
                    </div>

                    <div className="page-sub">
                        Playlists, jams, songs, and tiny soundtracks for {myNickname} &{" "}
                        {partnerNickname}.
                    </div>

                    <div className="music-create-card">
                        <div className="music-form-grid">
                            <input
                                className="music-input"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Title, e.g. Late night playlist"
                            />

                            <select
                                className="music-select"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                {MUSIC_TYPES.map((musicType) => (
                                    <option key={musicType} value={musicType}>
                                        {musicType}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <input
                            className="music-input"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Paste Spotify Jam / Playlist / Song link..."
                            style={{ marginBottom: 14 }}
                        />

                        <textarea
                            className="music-textarea"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Optional note, e.g. this feels like us..."
                        />

                        <button
                            className="music-add-btn"
                            type="button"
                            onClick={addMusic}
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Add"}
                        </button>

                        {error && <div className="music-error">{error}</div>}
                    </div>

                    {items.length === 0 ? (
                        <div className="music-empty">
                            No music saved yet.
                            <br />
                            Add your first playlist, jam, or song link ✨
                        </div>
                    ) : (
                        <div className="music-grid">
                            {items.map((item) => {
                                const embedUrl = getSpotifyEmbedUrl(item.url);
                                const addedByName =
                                    item.addedBy === currentUid ? myNickname : partnerNickname;

                                return (
                                    <div className="music-card" key={item.id}>
                                        <div className="music-card-top">
                                            <div>
                                                <div className="music-type">{item.type}</div>
                                                <div className="music-title">{item.title}</div>
                                            </div>
                                        </div>

                                        <div className="music-added">Added by {addedByName}</div>

                                        {item.note && <div className="music-note">{item.note}</div>}

                                        {embedUrl && (
                                            <iframe
                                                className="spotify-frame"
                                                src={embedUrl}
                                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                                loading="lazy"
                                            />
                                        )}

                                        <div className="music-actions">
                                            <a
                                                className="music-link-btn"
                                                href={item.url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Open Link ↗
                                            </a>

                                            <button
                                                className="music-delete-btn"
                                                type="button"
                                                onClick={() => deleteMusic(item.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}