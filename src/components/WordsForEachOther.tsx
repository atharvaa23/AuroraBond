"use client";

import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User, Partner, Bond } from "../lib/types";

interface WordsForEachOtherProps {
    user: User | null;
    partner: Partner | null;
    bond: Bond | null;
}

type BondWithWords = Bond & {
    user1Uid?: string;
    user2Uid?: string;
    quote1?: string;
    quote2?: string;
    nicknames?: Record<string, string>;
};

const WORDS_CSS = `
  .words-section {
    margin-top: 40px;
  }

  .words-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  @media (max-width: 640px) {
    .words-grid {
      grid-template-columns: 1fr;
    }
  }

  .word-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 28px;
    backdrop-filter: blur(20px);
  }

  .word-author {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--aurora1);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .word-text {
    font-family: var(--font-serif);
    font-size: 20px;
    font-weight: 300;
    font-style: italic;
    color: var(--text);
    line-height: 1.6;
    min-height: 60px;
    white-space: pre-wrap;
  }

  .word-placeholder {
    color: var(--muted2);
    font-style: italic;
  }

  .word-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
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

  .word-input:focus {
    border-color: var(--aurora1);
  }

  .word-input::placeholder {
    color: var(--muted2);
  }

  .word-actions {
    display: flex;
    gap: 10px;
    margin-top: 12px;
  }

  .word-btn {
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

  .word-btn:hover {
    background: rgba(192,132,252,0.1);
  }

  .word-btn.danger {
    border-color: rgba(251,113,133,0.55);
    color: #fb7185;
  }

  .word-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

interface WordCardProps {
    quote: string;
    field: "quote1" | "quote2";
    bondId?: string;
    avatar: string;
    nickname: string;
    placeholder: string;
    editable: boolean;
}

function WordCard({
    quote,
    field,
    bondId,
    avatar,
    nickname,
    placeholder,
    editable,
}: WordCardProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(quote);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setDraft(quote);
    }, [quote]);

    const save = async () => {
        if (!bondId) return;

        try {
            setSaving(true);

            await updateDoc(doc(db, "bonds", bondId), {
                [field]: draft.trim(),
            });

            setEditing(false);
        } catch (error) {
            console.error("Words save error:", error);
            alert("Could not save words. Check Firestore rules or console.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="word-card">
            <div className="word-author">
                <span>{avatar}</span>
                <span>{nickname} says</span>
            </div>

            {!editing ? (
                <>
                    <div className="word-text">
                        {quote ? (
                            quote
                        ) : (
                            <span className="word-placeholder">{placeholder}</span>
                        )}
                    </div>

                    {editable && (
                        <button
                            className="word-btn"
                            type="button"
                            onClick={() => {
                                setDraft(quote);
                                setEditing(true);
                            }}
                        >
                            {quote ? "Edit" : "Write"}
                        </button>
                    )}
                </>
            ) : (
                <>
                    <textarea
                        className="word-input"
                        rows={3}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Write something beautiful…"
                    />

                    <div className="word-actions">
                        <button
                            className="word-btn"
                            type="button"
                            onClick={save}
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>

                        <button
                            className="word-btn danger"
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

export function WordsForEachOther({
    user,
    partner,
    bond,
}: WordsForEachOtherProps) {
    const bondData = bond as BondWithWords | null;

    const currentUid = user?.uid;
    const bondId = user?.bondId;

    const currentUserIsUser1 = currentUid && bondData?.user1Uid === currentUid;

    const myQuoteField: "quote1" | "quote2" = currentUserIsUser1
        ? "quote1"
        : "quote2";

    const partnerQuoteField: "quote1" | "quote2" = currentUserIsUser1
        ? "quote2"
        : "quote1";

    const myQuote = bondData?.[myQuoteField] ?? "";
    const partnerQuote = bondData?.[partnerQuoteField] ?? "";

    const myDisplayNickname =
        bondData?.nicknames?.[user?.uid || ""] || user?.nickname || "You";

    const partnerDisplayNickname =
        bondData?.nicknames?.[partner?.uid || ""] ||
        partner?.nickname ||
        "Partner";

    return (
        <>
            <style>{WORDS_CSS}</style>

            <div className="words-section">
                <div className="section-header" style={{ marginTop: 40 }}>
                    <div className="section-title">Words for Each Other</div>
                </div>

                <div className="words-grid">
                    <WordCard
                        quote={myQuote}
                        field={myQuoteField}
                        bondId={bondId}
                        avatar={user?.avatar ?? "💜"}
                        nickname={myDisplayNickname}
                        placeholder="Leave a quote for your love…"
                        editable={true}
                    />

                    <WordCard
                        quote={partnerQuote}
                        field={partnerQuoteField}
                        bondId={bondId}
                        avatar={partner?.avatar ?? "🌸"}
                        nickname={partnerDisplayNickname}
                        placeholder="Waiting for their words…"
                        editable={false}
                    />
                </div>
            </div>
        </>
    );
}