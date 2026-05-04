"use client";

import { useEffect, useState } from "react";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    increment,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { PetalCanvas } from "../ui/PetalCanvas";
import type { User, Partner, Bond } from "../../lib/types";

interface GameTallyPageProps {
    user: User | null;
    partner: Partner | null;
    bond: Bond | null;
}

interface GameCounter {
    id: string;
    title: string;
    scores: Record<string, number>;
}

const GAME_CSS = `
  .game-wrap {
    padding: 100px 40px 60px;
    max-width: 1100px;
    margin: 0 auto;
    position: relative;
    z-index: 2;
  }

  @media (max-width: 640px) {
    .game-wrap {
      padding: 100px 20px 60px;
    }
  }

  .game-create-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 24px;
    backdrop-filter: blur(20px);
    margin-bottom: 28px;
  }

  .game-create-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  @media (max-width: 640px) {
    .game-create-row {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .game-input {
    flex: 1;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    color: var(--text);
    padding: 13px 18px;
    font-family: var(--font-sans);
    outline: none;
  }

  .game-input:focus {
    border-color: var(--aurora1);
  }

  .game-add-btn {
    border: 1px solid rgba(192,132,252,0.45);
    background: linear-gradient(135deg, rgba(192,132,252,0.28), rgba(251,113,133,0.18));
    color: var(--text);
    padding: 12px 20px;
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: all 0.25s ease;
    white-space: nowrap;
  }

  .game-add-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 18px rgba(192,132,252,0.3);
  }

  .game-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 18px;
  }

  .game-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 26px;
    backdrop-filter: blur(20px);
    position: relative;
    overflow: hidden;
  }

  .game-card::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent, rgba(192,132,252,0.05));
    pointer-events: none;
  }

  .game-title {
    font-family: var(--font-serif);
    font-size: 26px;
    font-weight: 300;
    margin-bottom: 22px;
    position: relative;
    z-index: 1;
  }

  .score-row {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 12px;
    align-items: center;
    margin-bottom: 22px;
    position: relative;
    z-index: 1;
  }

  .player-score {
    text-align: center;
    padding: 16px;
    border-radius: 18px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
  }

  .player-avatar {
    font-size: 28px;
    margin-bottom: 6px;
  }

  .player-name {
    color: var(--muted);
    font-size: 12px;
    margin-bottom: 10px;
  }

  .score-number {
    font-family: var(--font-serif);
    font-size: 44px;
    color: var(--aurora1);
  }

  .versus {
    color: var(--muted2);
    font-size: 12px;
    letter-spacing: 2px;
  }

  .score-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    position: relative;
    z-index: 1;
  }

  .score-btn {
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.04);
    color: var(--text);
    padding: 10px;
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: all 0.25s ease;
    font-size: 13px;
  }

  .score-btn:hover {
    border-color: var(--aurora1);
    color: var(--aurora1);
    background: rgba(192,132,252,0.08);
  }

  .score-btn.danger {
    color: #fb7185;
    border-color: rgba(251,113,133,0.35);
  }

  .score-btn.danger:hover {
    background: rgba(251,113,133,0.12);
    color: #fb7185;
  }

  .game-empty {
    text-align: center;
    color: var(--muted);
    margin-top: 50px;
    line-height: 1.7;
  }
`;

export function GameTallyPage({ user, partner, bond }: GameTallyPageProps) {
    const [gameName, setGameName] = useState("");
    const [games, setGames] = useState<GameCounter[]>([]);

    const bondId = user?.bondId;
    const currentUid = auth.currentUser?.uid || user?.uid;

    const partnerUid =
        bond?.user1Uid === currentUid ? bond?.user2Uid : bond?.user1Uid;

    const myDisplayNickname =
        bond?.nicknames?.[currentUid || ""] || user?.nickname || "You";

    const partnerDisplayNickname =
        bond?.nicknames?.[partnerUid || ""] || partner?.nickname || "Partner";

    useEffect(() => {
        if (!bondId) return;

        const q = query(
            collection(db, "bonds", bondId, "gameTallies"),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map((gameDoc) => {
                const data = gameDoc.data();

                return {
                    id: gameDoc.id,
                    title: data.title || "Untitled Game",
                    scores: data.scores || {},
                };
            }) as GameCounter[];

            setGames(list);
        });

        return unsub;
    }, [bondId]);

    const addGame = async () => {
        const title = gameName.trim();

        if (!title || !bondId || !currentUid) return;

        await addDoc(collection(db, "bonds", bondId, "gameTallies"), {
            title,
            scores: {
                [currentUid]: 0,
                ...(partnerUid ? { [partnerUid]: 0 } : {}),
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        setGameName("");
    };

    const changeScore = async (gameId: string, uid: string, amount: number) => {
        if (!bondId || !uid) return;

        await updateDoc(doc(db, "bonds", bondId, "gameTallies", gameId), {
            [`scores.${uid}`]: increment(amount),
            updatedAt: serverTimestamp(),
        });
    };

    const resetGame = async (gameId: string) => {
        if (!bondId || !currentUid) return;

        await updateDoc(doc(db, "bonds", bondId, "gameTallies", gameId), {
            [`scores.${currentUid}`]: 0,
            ...(partnerUid ? { [`scores.${partnerUid}`]: 0 } : {}),
            updatedAt: serverTimestamp(),
        });
    };

    const deleteGame = async (gameId: string) => {
        if (!bondId) return;

        const confirmDelete = window.confirm("Delete this game counter?");
        if (!confirmDelete) return;

        await deleteDoc(doc(db, "bonds", bondId, "gameTallies", gameId));
    };

    if (!bondId || !currentUid) {
        return (
            <div className="page">
                <div className="inner-wrap">
                    <div className="page-title">Game Scores</div>
                    <div style={{ color: "var(--muted)", marginTop: 40, textAlign: "center" }}>
                        No bond connected yet 🎮
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{GAME_CSS}</style>

            <div className="page">
                <div className="aurora-bg" />
                <PetalCanvas />

                <div className="game-wrap">
                    <div className="page-title">
                        Game <span>Tally</span>
                    </div>

                    <div className="page-sub">
                        For every match, every rematch, and every “one last game”.
                    </div>

                    <div className="game-create-card">
                        <div className="game-create-row">
                            <input
                                className="game-input"
                                value={gameName}
                                onChange={(e) => setGameName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") addGame();
                                }}
                                placeholder="Add a game, e.g. Badminton, Chess, Ludo..."
                            />

                            <button className="game-add-btn" onClick={addGame}>
                                Add Counter
                            </button>
                        </div>
                    </div>

                    {games.length === 0 ? (
                        <div className="game-empty">
                            No game counters yet.
                            <br />
                            Add your first game and start keeping score ✨
                        </div>
                    ) : (
                        <div className="game-grid">
                            {games.map((game) => {
                                const myScore = game.scores?.[currentUid] ?? 0;
                                const partnerScore = partnerUid
                                    ? game.scores?.[partnerUid] ?? 0
                                    : 0;

                                return (
                                    <div className="game-card" key={game.id}>
                                        <div className="game-title">{game.title}</div>

                                        <div className="score-row">
                                            <div className="player-score">
                                                <div className="player-avatar">{user?.avatar ?? "💜"}</div>
                                                <div className="player-name">{myDisplayNickname}</div>
                                                <div className="score-number">{myScore}</div>
                                            </div>

                                            <div className="versus">VS</div>

                                            <div className="player-score">
                                                <div className="player-avatar">{partner?.avatar ?? "🌸"}</div>
                                                <div className="player-name">{partnerDisplayNickname}</div>
                                                <div className="score-number">{partnerScore}</div>
                                            </div>
                                        </div>

                                        <div className="score-actions">
                                            <button
                                                className="score-btn"
                                                onClick={() => changeScore(game.id, currentUid, 1)}
                                            >
                                                +1 {myDisplayNickname}
                                            </button>

                                            <button
                                                className="score-btn"
                                                disabled={!partnerUid}
                                                onClick={() => partnerUid && changeScore(game.id, partnerUid, 1)}
                                            >
                                                +1 {partnerDisplayNickname}
                                            </button>

                                            <button
                                                className="score-btn"
                                                onClick={() => changeScore(game.id, currentUid, -1)}
                                            >
                                                -1 {myDisplayNickname}
                                            </button>

                                            <button
                                                className="score-btn"
                                                disabled={!partnerUid}
                                                onClick={() => partnerUid && changeScore(game.id, partnerUid, -1)}
                                            >
                                                -1 {partnerDisplayNickname}
                                            </button>

                                            <button className="score-btn" onClick={() => resetGame(game.id)}>
                                                Reset
                                            </button>

                                            <button
                                                className="score-btn danger"
                                                onClick={() => deleteGame(game.id)}
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