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
import type { PageKey, User, Partner, NavigateMode, Bond } from "../../lib/types";
import { AVATARS } from "../../lib/constants";
import { ThemeBackdrop } from "../ui/ThemeBackdrop";

interface LoginPageProps {
  setPage: (page: PageKey, mode?: NavigateMode) => void;
  setUser: (user: User | null) => void;
  setPartner: (partner: Partner | null) => void;
}

type Mode = "signin" | "login" | "create";

function generateCode() {
  return crypto.randomUUID().slice(0, 6).toUpperCase();
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
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
    background:
      radial-gradient(circle at 18% 12%, color-mix(in srgb, var(--aurora1) 10%, transparent), transparent 34%),
      radial-gradient(circle at 84% 78%, color-mix(in srgb, var(--aurora3) 9%, transparent), transparent 36%),
      rgba(255,255,255,0.04);
    backdrop-filter: blur(40px);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 48px 40px;
    max-width: 460px;
    width: 100%;
    animation: fadeInUp 0.8s ease both;
    box-shadow:
      0 24px 80px rgba(0,0,0,0.28),
      inset 0 1px 0 rgba(255,255,255,0.06);
  }

  .login-title {
    font-family: var(--font-serif);
    font-size: 38px;
    font-weight: 300;
    text-align: center;
    margin-bottom: 8px;
    background: linear-gradient(135deg, var(--aurora2), var(--aurora1), var(--aurora3));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .login-sub {
    text-align: center;
    color: var(--muted);
    font-size: 14px;
    margin-bottom: 32px;
  }

  .mode-toggle {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
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
    padding: 11px 10px;
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--muted);
    background: transparent;
    transition: all 0.3s ease;
    overflow: hidden;
    white-space: nowrap;
  }

  .mode-toggle-btn:hover {
    color: var(--text);
    background: rgba(255,255,255,0.05);
  }

  .mode-toggle-btn.active {
    color: white;
    background: linear-gradient(135deg, var(--aurora1), var(--aurora3));
    box-shadow:
      0 0 22px color-mix(in srgb, var(--aurora1) 28%, transparent),
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

  .signin-info {
    border: 1px solid var(--border);
    border-radius: 18px;
    background:
      radial-gradient(circle at 15% 20%, color-mix(in srgb, var(--aurora1) 10%, transparent), transparent 36%),
      rgba(255,255,255,0.035);
    padding: 18px;
    margin-bottom: 22px;
    text-align: center;
  }

  .signin-info-title {
    font-family: var(--font-serif);
    font-size: 24px;
    font-weight: 300;
    margin-bottom: 6px;
    color: var(--text);
  }

  .signin-info-sub {
    color: var(--muted);
    font-size: 13px;
    line-height: 1.6;
  }

  .bond-code {
    background: color-mix(in srgb, var(--aurora1) 10%, transparent);
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
    background: color-mix(in srgb, var(--aurora1) 15%, transparent);
    box-shadow: 0 0 14px color-mix(in srgb, var(--aurora1) 16%, transparent);
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
    line-height: 1.5;
  }

  .login-hint {
    margin-top: 12px;
    color: var(--muted);
    font-size: 12px;
    text-align: center;
    line-height: 1.5;
  }

  @media (max-width: 480px) {
    .login-card {
      padding: 32px 22px;
    }

    .login-title {
      font-size: 32px;
    }

    .mode-toggle {
      grid-template-columns: 1fr;
      border-radius: 22px;
    }

    .mode-toggle-btn {
      border-radius: 16px;
    }
  }
`;

export function LoginPage({ setPage, setUser, setPartner }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  const [avatar, setAvatar] = useState("💜");
  const [bondCode] = useState(() => generateCode());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPartnerForBond = async (
    bondId: string,
    currentUid: string
  ): Promise<Partner | null> => {
    const bondSnap = await getDoc(doc(db, "bonds", bondId));

    if (!bondSnap.exists()) return null;

    const bond = bondSnap.data() as Bond;

    const partnerUid =
      bond.user1Uid === currentUid ? bond.user2Uid : bond.user1Uid;

    if (!partnerUid) return null;

    const partnerSnap = await getDoc(doc(db, "users", partnerUid));

    if (!partnerSnap.exists()) return null;

    return {
      ...(partnerSnap.data() as Partner),
      uid: partnerUid,
    };
  };

  const enterExistingUser = async (
    firebaseUid: string,
    existingUser: Partial<User>
  ) => {
    if (!existingUser.bondId) {
      setError("No bond found for this account. Use Join Bond or Create Bond.");
      return false;
    }

    const finalUser: User = {
      uid: firebaseUid,
      name: existingUser.name || "Unknown",
      nickname: existingUser.nickname || existingUser.name || "You",
      avatar: existingUser.avatar || "💜",
      code: existingUser.code || "",
      email: existingUser.email || "",
      bondId: existingUser.bondId,
      createdAt: existingUser.createdAt ?? null,
      updatedAt: existingUser.updatedAt ?? null,
    };

    setUser(finalUser);

    const existingPartner = await loadPartnerForBond(
      existingUser.bondId,
      firebaseUid
    );

    setPartner(existingPartner);
    setPage("dashboard", "replace");

    return true;
  };

  const handleGoogleLogin = async () => {
    const cleanedPartnerCode = partnerCode.trim().toUpperCase();

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

      if (existingUser?.bondId) {
        const entered = await enterExistingUser(firebaseUser.uid, existingUser);
        if (entered) return;
      }

      if (mode === "signin") {
        setError("No existing AuroraBond account found. Use Join Bond or Create Bond.");
        return;
      }

      if (mode === "login" && !cleanedPartnerCode) {
        setError("Enter partner bond code first.");
        return;
      }

      const displayName = firebaseUser.displayName || "Unknown";

      const cleanedName =
        cleanText(name) || existingUser?.name || displayName;

      const cleanedNickname =
        cleanText(nickname) ||
        existingUser?.nickname ||
        cleanedName;

      const profile: User = {
        uid: firebaseUser.uid,
        name: cleanedName,
        nickname: cleanedNickname,
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
          theme: "aurora",
          nicknames: {
            [firebaseUser.uid]: profile.nickname,
          },
          weatherCities: {},
          currentMoods: {},
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
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
            updatedAt: serverTimestamp(),
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

      const newPartner = await loadPartnerForBond(bondId, firebaseUser.uid);
      setPartner(newPartner);

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
            <div className="login-title">
              {mode === "signin" ? "Welcome Back" : "AuroraBond"}
            </div>

            <div className="login-sub">
              {mode === "signin"
                ? "Sign in and continue your shared universe"
                : "Step into your shared universe"}
            </div>

            <div className="mode-toggle">
              {(["signin", "login", "create"] as Mode[]).map((nextMode) => (
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
                  {nextMode === "signin"
                    ? "Sign In"
                    : nextMode === "login"
                      ? "Join Bond"
                      : "Create Bond"}
                </button>
              ))}
            </div>

            {mode === "signin" ? (
              <div className="signin-info">
                <div className="signin-info-title">Already connected?</div>
                <div className="signin-info-sub">
                  Use Google sign in. If your account already has a bond, you’ll
                  directly enter AuroraBond.
                </div>
              </div>
            ) : (
              <>
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
              </>
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
                : mode === "signin"
                  ? "Sign in with Google →"
                  : mode === "login"
                    ? "Join Bond →"
                    : "Create Bond →"}
            </button>

            {mode !== "signin" && (
              <div className="login-hint">
                If this Google account already has a bond, you’ll enter directly
                without needing the code again.
              </div>
            )}

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