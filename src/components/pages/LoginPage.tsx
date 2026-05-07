"use client";

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { PageKey, User, Partner, NavigateMode } from "../../lib/types";
import { AVATARS } from "../../lib/constants";
import { ThemeBackdrop } from "../ui/ThemeBackdrop";

interface LoginPageProps {
  setPage: (page: PageKey, mode?: NavigateMode) => void;
  setUser: (user: User | null) => void;
  setPartner: (partner: Partner | null) => void;
}

type Mode = "login" | "create";

function generateCode() {
  return crypto.randomUUID().slice(0, 6).toUpperCase();
}

const LOGIN_CSS = `
  .login-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 2;
    padding: 40px 20px;
  }

  .login-card {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(40px);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 48px 40px;
    max-width: 440px;
    width: 100%;
    animation: fadeInUp 0.8s ease both;
  }

  .login-title {
    font-family: var(--font-serif);
    font-size: 38px;
    font-weight: 300;
    text-align: center;
    margin-bottom: 8px;
    background: linear-gradient(135deg, var(--aurora2), var(--aurora1));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .login-sub {
    text-align: center;
    color: var(--muted);
    font-size: 14px;
    margin-bottom: 36px;
  }

  .mode-toggle {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 28px;
    padding: 5px;
    border-radius: 999px;
    background: rgba(255,255,255,0.045);
    border: 1px solid var(--border);
    backdrop-filter: blur(20px);
  }

  .mode-toggle-btn {
    position: relative;
    border: none;
    border-radius: 999px;
    padding: 11px 16px;
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: var(--muted);
    background: transparent;
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .mode-toggle-btn:hover {
    color: var(--text);
    background: rgba(255,255,255,0.05);
  }

  .mode-toggle-btn.active {
    color: white;
    background: linear-gradient(135deg, var(--aurora1), var(--aurora3));
    box-shadow:
      0 0 22px rgba(192,132,252,0.28),
      inset 0 1px 0 rgba(255,255,255,0.2);
  }

  .mode-toggle-btn.active::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255,0.22),
      transparent
    );
    transform: translateX(-100%);
    animation: modeShine 1.8s ease infinite;
  }

  @keyframes modeShine {
    0% {
      transform: translateX(-100%);
    }

    70%,
    100% {
      transform: translateX(100%);
    }
  }

  .bond-code {
    background: rgba(192,132,252,0.1);
    border: 1px solid var(--aurora1);
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    text-align: center;
    letter-spacing: 4px;
    font-size: 18px;
    color: var(--aurora1);
    font-weight: 500;
    user-select: all;
  }

  .avatar-picker {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .avatar-chip {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 20px;
    transition: all 0.2s;
    border: 1.5px solid var(--border);
    background: rgba(255,255,255,0.03);
  }

  .avatar-chip.selected {
    border-color: var(--aurora1);
    background: rgba(192,132,252,0.15);
  }

  .avatar-chip:hover {
    transform: translateY(-1px);
    border-color: var(--aurora1);
  }

  .login-error {
    margin-top: 12px;
    color: #fb7185;
    font-size: 12px;
    text-align: center;
  }

  @media (max-width: 480px) {
    .login-card {
      padding: 32px 24px;
    }

    .login-title {
      font-size: 32px;
    }
  }
`;

export function LoginPage({ setPage, setUser, setPartner }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  const [avatar, setAvatar] = useState("💜");
  const [bondCode] = useState(() => generateCode());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    const cleanedPartnerCode = partnerCode.trim().toUpperCase();

    if (mode === "login" && !cleanedPartnerCode) {
      setError("Enter partner bond code first.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const userRef = doc(db, "users", firebaseUser.uid);
      const existingUserSnap = await getDoc(userRef);
      const existingUser = existingUserSnap.exists()
        ? (existingUserSnap.data() as Partial<User>)
        : null;

      const displayName = firebaseUser.displayName || "Unknown";

      const profile: User = {
        uid: firebaseUser.uid,
        name: name.trim() || existingUser?.name || displayName,
        nickname: nickname.trim() || existingUser?.nickname || displayName,
        avatar: avatar || existingUser?.avatar || "💜",
        code: existingUser?.code || bondCode,
        email: firebaseUser.email || existingUser?.email || "",
        bondId: "",
        createdAt: existingUser?.createdAt ?? null,
      };

      let bondId = "";

      if (mode === "create") {
        const bondRef = await addDoc(collection(db, "bonds"), {
          user1Uid: firebaseUser.uid,
          user2Uid: null,
          code: bondCode,
          reunionDate: "",
          quote1: "",
          quote2: "",
          nicknames: {
            [firebaseUser.uid]: profile.nickname,
          },
          weatherCities: {},
          currentMoods: {},
          createdAt: serverTimestamp(),
        });

        bondId = bondRef.id;
      } else {
        const bondQuery = query(
          collection(db, "bonds"),
          where("code", "==", cleanedPartnerCode)
        );

        const bondSnapshot = await getDocs(bondQuery);

        if (bondSnapshot.empty) {
          setError("Invalid bond code.");
          return;
        }

        const bondDoc = bondSnapshot.docs[0];
        const bondData = bondDoc.data();

        bondId = bondDoc.id;

        const alreadyMember =
          bondData.user1Uid === firebaseUser.uid ||
          bondData.user2Uid === firebaseUser.uid;

        if (!alreadyMember && bondData.user2Uid) {
          setError("This bond is already connected.");
          return;
        }

        if (!alreadyMember) {
          await updateDoc(doc(db, "bonds", bondId), {
            user2Uid: firebaseUser.uid,
            [`nicknames.${firebaseUser.uid}`]: profile.nickname,
          });
        }
      }

      const finalUser: User = {
        ...profile,
        bondId,
      };

      await setDoc(
        userRef,
        {
          name: finalUser.name,
          nickname: finalUser.nickname,
          avatar: finalUser.avatar,
          code: finalUser.code,
          email: finalUser.email,
          bondId,
          ...(existingUserSnap.exists() ? {} : { createdAt: serverTimestamp() }),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setUser(finalUser);

      const bondSnap = await getDoc(doc(db, "bonds", bondId));
      const bond = bondSnap.data();

      const partnerUid =
        bond?.user1Uid === firebaseUser.uid ? bond?.user2Uid : bond?.user1Uid;

      if (partnerUid) {
        const partnerSnap = await getDoc(doc(db, "users", partnerUid));

        if (partnerSnap.exists()) {
          setPartner({
            ...(partnerSnap.data() as Partner),
            uid: partnerUid,
          });
        }
      } else {
        setPartner(null);
      }

      setPage("dashboard", "replace");
    } catch (err: any) {
      console.error("Google login failed:", {
        code: err?.code,
        message: err?.message,
        full: err,
      });

      setError(err?.code || "Google login failed. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{LOGIN_CSS}</style>

      <div className="page">
        <div className="aurora-bg" />
        <ThemeBackdrop />

        <div className="login-wrap">
          <div className="login-card">
            <div className="login-title">Welcome Back</div>
            <div className="login-sub">Step into your shared universe</div>

            <div className="mode-toggle">
              {(["login", "create"] as Mode[]).map((nextMode) => (
                <button
                  key={nextMode}
                  className={`mode-toggle-btn ${mode === nextMode ? "active" : ""
                    }`}
                  onClick={() => {
                    setMode(nextMode);
                    setError("");
                  }}
                  type="button"
                >
                  {nextMode === "login" ? "Join Bond" : "Create Bond"}
                </button>
              ))}
            </div>

            <div className="input-wrap">
              <label className="input-label">Your Name</label>
              <input
                className="input-field"
                placeholder="Enter your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleGoogleLogin();
                }}
              />
            </div>

            <div className="input-wrap">
              <label className="input-label">Nickname</label>
              <input
                className="input-field"
                placeholder="What your partner calls you"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleGoogleLogin();
                }}
              />
            </div>

            <div className="input-wrap">
              <label className="input-label">Choose Your Avatar</label>

              <div className="avatar-picker">
                {AVATARS.map((nextAvatar) => (
                  <button
                    key={nextAvatar}
                    type="button"
                    className={`avatar-chip ${avatar === nextAvatar ? "selected" : ""
                      }`}
                    onClick={() => setAvatar(nextAvatar)}
                  >
                    {nextAvatar}
                  </button>
                ))}
              </div>
            </div>

            {mode === "create" && (
              <div className="input-wrap">
                <label className="input-label">
                  Your Bond Code — share with partner
                </label>
                <div className="bond-code">{bondCode}</div>
              </div>
            )}

            {mode === "login" && (
              <div className="input-wrap">
                <label className="input-label">Partner Bond Code</label>
                <input
                  className="input-field"
                  placeholder="Enter partner's code"
                  value={partnerCode}
                  onChange={(event) => setPartnerCode(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleGoogleLogin();
                  }}
                />
              </div>
            )}

            <button
              className="btn-primary"
              style={{ width: "100%", marginTop: 8 }}
              onClick={handleGoogleLogin}
              disabled={loading}
              type="button"
            >
              {loading
                ? "Opening Google..."
                : mode === "login"
                  ? "Join Bond →"
                  : "Create Bond →"}
            </button>

            {error && <div className="login-error">{error}</div>}

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">💜</span>
              <div className="divider-line" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}