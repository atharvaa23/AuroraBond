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
    updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PetalCanvas } from "../ui/PetalCanvas";
import type { Bond, BucketItem, Partner, User } from "../../lib/types";

interface BucketListPageProps {
    user: User | null;
    partner: Partner | null;
    bond: Bond | null;
}

type BucketFilter = "all" | "completed" | "pending";

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

const BUCKET_CSS = `
  .bucket-wrap {
    padding: 100px 40px 70px;
    max-width: 1000px;
    margin: 0 auto;
    position: relative;
    z-index: 2;
  }

  .bucket-hero {
    text-align: center;
    margin-bottom: 34px;
  }

  .bucket-title {
    font-family: var(--font-serif);
    font-size: clamp(42px, 6vw, 64px);
    font-weight: 300;
    margin-bottom: 10px;
    background: linear-gradient(135deg, var(--aurora1), var(--aurora2), var(--aurora3));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .bucket-sub {
    color: var(--muted);
    font-size: 14px;
    line-height: 1.8;
    max-width: 650px;
    margin: 0 auto;
  }

  .bucket-create-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 28px;
    backdrop-filter: blur(20px);
    margin-bottom: 28px;
    position: relative;
    overflow: hidden;
  }

  .bucket-create-card::before {
    content: "";
    position: absolute;
    width: 260px;
    height: 260px;
    top: -120px;
    right: -90px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(96,165,250,0.15), transparent 70%);
    pointer-events: none;
  }

  .bucket-create-card::after {
    content: "";
    position: absolute;
    width: 240px;
    height: 240px;
    left: -100px;
    bottom: -130px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(251,113,133,0.12), transparent 70%);
    pointer-events: none;
  }

  .bucket-create-inner {
    position: relative;
    z-index: 1;
  }

  .bucket-icon-scene {
    width: 126px;
    height: 126px;
    margin: 0 auto 24px;
    border-radius: 34px;
    border: 1px solid rgba(255,255,255,0.14);
    display: grid;
    place-items: center;
    background:
      radial-gradient(circle at 30% 25%, rgba(96,165,250,0.32), transparent 28%),
      radial-gradient(circle at 75% 70%, rgba(251,113,133,0.24), transparent 32%),
      linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,255,255,0.025));
    box-shadow:
      0 0 45px rgba(96,165,250,0.12),
      inset 0 0 30px rgba(255,255,255,0.05);
    position: relative;
    animation: bucketFloat 4.8s ease-in-out infinite;
  }

  .bucket-icon-scene::before {
    content: "🪣";
    font-size: 42px;
    filter: drop-shadow(0 0 14px rgba(255,255,255,0.18));
    animation: bucketPulse 3s ease-in-out infinite;
  }

  .bucket-spark {
    position: absolute;
    color: rgba(255,255,255,0.8);
    font-size: 12px;
    text-shadow: 0 0 12px rgba(192,132,252,0.7);
    animation: bucketSpark 3.4s ease-in-out infinite;
  }

  .bucket-spark-one {
    left: 24px;
    top: 28px;
  }

  .bucket-spark-two {
    right: 24px;
    top: 52px;
    animation-delay: 0.9s;
    color: rgba(125,211,252,0.85);
  }

  .bucket-spark-three {
    left: 54px;
    bottom: 24px;
    animation-delay: 1.5s;
    color: rgba(251,113,133,0.85);
  }

  @keyframes bucketFloat {
    0%, 100% {
      transform: translateY(0) rotate(-1deg);
    }

    50% {
      transform: translateY(-8px) rotate(1deg);
    }
  }

  @keyframes bucketPulse {
    0%, 100% {
      transform: scale(1);
    }

    50% {
      transform: scale(1.07);
    }
  }

  @keyframes bucketSpark {
    0%, 100% {
      transform: translateY(0) scale(1);
      opacity: 0.55;
    }

    50% {
      transform: translateY(-8px) scale(1.18);
      opacity: 1;
    }
  }

  .bucket-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
    align-items: center;
  }

  .bucket-input {
    width: 100%;
    background: rgba(255,255,255,0.045);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    color: var(--text);
    padding: 15px 18px;
    font-family: var(--font-sans);
    font-size: 14px;
    outline: none;
    transition: all 0.3s ease;
  }

  .bucket-input:focus {
    border-color: var(--aurora1);
    background: rgba(255,255,255,0.06);
  }

  .bucket-input::placeholder {
    color: var(--muted2);
  }

  .bucket-add-btn {
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

  .bucket-add-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 18px rgba(192,132,252,0.28);
  }

  .bucket-add-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .bucket-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    margin-bottom: 18px;
    flex-wrap: wrap;
  }

  .bucket-section-title {
    font-family: var(--font-serif);
    font-size: 30px;
    font-weight: 300;
  }

  .bucket-count {
    color: var(--muted);
    font-size: 12px;
    margin-top: 4px;
  }

  .bucket-filter-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .bucket-filter-btn {
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.04);
    color: var(--muted);
    border-radius: var(--radius-full);
    padding: 8px 14px;
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 12px;
    transition: all 0.25s ease;
  }

  .bucket-filter-btn:hover {
    border-color: var(--aurora1);
    color: var(--aurora1);
    background: rgba(192,132,252,0.08);
  }

  .bucket-filter-btn.active {
    border-color: var(--aurora1);
    color: var(--text);
    background: linear-gradient(
      135deg,
      rgba(192,132,252,0.24),
      rgba(251,113,133,0.14)
    );
  }

  .bucket-list {
    display: grid;
    gap: 14px;
  }

  .bucket-item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 14px;
    align-items: center;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 18px;
    backdrop-filter: blur(20px);
    transition: all 0.25s ease;
  }

  .bucket-item:hover {
    transform: translateY(-2px);
    border-color: rgba(192,132,252,0.35);
    background: var(--card-hover);
  }

  .bucket-check-btn {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    border: 1px solid rgba(192,132,252,0.55);
    background: rgba(255,255,255,0.04);
    color: var(--text);
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: all 0.25s ease;
  }

  .bucket-check-btn.done {
    background: linear-gradient(135deg, rgba(192,132,252,0.8), rgba(251,113,133,0.7));
    border-color: transparent;
    box-shadow: 0 0 18px rgba(192,132,252,0.25);
  }

  .bucket-text {
    color: var(--text);
    font-size: 14px;
    line-height: 1.6;
  }

  .bucket-text.done {
    color: var(--muted2);
    text-decoration: line-through;
  }

  .bucket-meta {
    color: var(--muted2);
    font-size: 11px;
    margin-top: 4px;
  }

  .bucket-delete-btn {
    background: transparent;
    border: 1px solid rgba(251,113,133,0.28);
    color: var(--muted2);
    cursor: pointer;
    font-size: 11px;
    padding: 7px 14px;
    border-radius: var(--radius-full);
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .bucket-delete-btn:hover {
    color: #fb7185;
    background: rgba(251,113,133,0.1);
    border-color: rgba(251,113,133,0.5);
  }

  .bucket-empty,
  .bucket-loading {
    text-align: center;
    color: var(--muted);
    border: 1px dashed var(--border);
    border-radius: 24px;
    padding: 36px 20px;
    background: rgba(255,255,255,0.025);
  }

  @media (prefers-reduced-motion: reduce) {
    .bucket-icon-scene,
    .bucket-icon-scene::before,
    .bucket-spark {
      animation: none;
    }
  }

  @media (max-width: 640px) {
    .bucket-wrap {
      padding: 100px 20px 130px;
    }

    .bucket-top-row {
      align-items: flex-start;
    }

    .bucket-filter-row {
      width: 100%;
    }

    .bucket-filter-btn {
      flex: 1;
    }

    .bucket-item {
      grid-template-columns: auto 1fr;
    }

    .bucket-delete-btn {
      grid-column: 1 / -1;
      width: fit-content;
      margin: 4px auto 0;
    }
  }
`;

export function BucketListPage({ user, partner, bond }: BucketListPageProps) {
    const [items, setItems] = useState<BucketItem[]>([]);
    const [draft, setDraft] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState<BucketFilter>("all");

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

    const completedCount = items.filter((item) => item.done).length;
    const pendingCount = items.length - completedCount;

    const filteredItems = items.filter((item) => {
        if (filter === "completed") return item.done;
        if (filter === "pending") return !item.done;
        return true;
    });

    useEffect(() => {
        if (!bondId) {
            setLoading(false);
            return;
        }

        const bucketQuery = query(
            collection(db, "bonds", bondId, "bucketList"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(
            bucketQuery,
            (snapshot) => {
                const nextItems = snapshot.docs.map((itemDoc) => {
                    const data = itemDoc.data();

                    return {
                        id: itemDoc.id,
                        text: data.text ?? "",
                        done: data.done ?? false,
                        createdBy: data.createdBy ?? "",
                        createdAt: data.createdAt ?? null,
                        updatedAt: data.updatedAt ?? null,
                    } as BucketItem;
                });

                setItems(nextItems);
                setLoading(false);
            },
            (error) => {
                console.error("Bucket list load error:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [bondId]);

    const addItem = async () => {
        const text = cleanText(draft);

        if (!text) {
            alert("Write one bucket list idea first.");
            return;
        }

        if (!bondId || !currentUid) {
            alert("No bond connected yet.");
            return;
        }

        try {
            setSaving(true);

            await addDoc(collection(db, "bonds", bondId, "bucketList"), {
                text,
                done: false,
                createdBy: currentUid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            setDraft("");
            setFilter("all");
        } catch (error) {
            console.error("Bucket item save error:", error);
            alert("Could not save bucket item.");
        } finally {
            setSaving(false);
        }
    };

    const toggleItem = async (item: BucketItem) => {
        if (!bondId) return;

        try {
            await updateDoc(doc(db, "bonds", bondId, "bucketList", item.id), {
                done: !item.done,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("Bucket item update error:", error);
            alert("Could not update bucket item.");
        }
    };

    const deleteItem = async (item: BucketItem) => {
        if (!bondId) return;

        const confirmDelete = window.confirm("Erase this bucket list item?");
        if (!confirmDelete) return;

        try {
            await deleteDoc(doc(db, "bonds", bondId, "bucketList", item.id));
        } catch (error) {
            console.error("Bucket item delete error:", error);
            alert("Could not erase bucket item.");
        }
    };

    return (
        <>
            <style>{BUCKET_CSS}</style>

            <div className="page">
                <div className="aurora-bg" />
                <PetalCanvas />

                <div className="bucket-wrap">
                    <div className="bucket-hero">
                        <div className="bucket-title">Bucket List</div>

                        <div className="bucket-sub">
                            A shared little list for {myDisplayName} and {partnerDisplayName} —
                            places to go, food to try, dates to plan, and memories waiting to
                            happen.
                        </div>
                    </div>

                    <div className="bucket-create-card">
                        <div className="bucket-create-inner">
                            <div className="bucket-icon-scene">
                                <span className="bucket-spark bucket-spark-one">✦</span>
                                <span className="bucket-spark bucket-spark-two">✦</span>
                                <span className="bucket-spark bucket-spark-three">✦</span>
                            </div>

                            <div className="bucket-form">
                                <input
                                    className="bucket-input"
                                    value={draft}
                                    onChange={(event) => setDraft(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") addItem();
                                    }}
                                    placeholder="Add a dream… like cafe date, movie night, road trip..."
                                />

                                <button
                                    className="bucket-add-btn"
                                    type="button"
                                    onClick={addItem}
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Add Dream ✨"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bucket-top-row">
                        <div>
                            <div className="bucket-section-title">Dreams Together</div>

                            <div className="bucket-count">
                                {completedCount}/{items.length} completed · {pendingCount} pending
                            </div>
                        </div>

                        <div className="bucket-filter-row">
                            <button
                                className={`bucket-filter-btn ${filter === "all" ? "active" : ""}`}
                                type="button"
                                onClick={() => setFilter("all")}
                            >
                                All
                            </button>

                            <button
                                className={`bucket-filter-btn ${filter === "completed" ? "active" : ""
                                    }`}
                                type="button"
                                onClick={() => setFilter("completed")}
                            >
                                Completed
                            </button>

                            <button
                                className={`bucket-filter-btn ${filter === "pending" ? "active" : ""
                                    }`}
                                type="button"
                                onClick={() => setFilter("pending")}
                            >
                                Pending
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="bucket-loading">Opening your shared list...</div>
                    ) : items.length > 0 ? (
                        filteredItems.length > 0 ? (
                            <div className="bucket-list">
                                {filteredItems.map((item) => (
                                    <div className="bucket-item" key={item.id}>
                                        <button
                                            className={`bucket-check-btn ${item.done ? "done" : ""}`}
                                            type="button"
                                            onClick={() => toggleItem(item)}
                                            title={item.done ? "Mark incomplete" : "Mark done"}
                                        >
                                            {item.done ? "✓" : ""}
                                        </button>

                                        <div>
                                            <div className={`bucket-text ${item.done ? "done" : ""}`}>
                                                {item.text}
                                            </div>

                                            <div className="bucket-meta">
                                                {item.done ? "Completed dream" : "Waiting to happen"}
                                            </div>
                                        </div>

                                        <button
                                            className="bucket-delete-btn"
                                            type="button"
                                            onClick={() => deleteItem(item)}
                                        >
                                            Erase
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bucket-empty">
                                No {filter === "completed" ? "completed" : "pending"} dreams here yet.
                            </div>
                        )
                    ) : (
                        <div className="bucket-empty">
                            No dreams added yet. Add the first tiny plan ✨
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}