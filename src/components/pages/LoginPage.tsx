"use client";

import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import {
  doc,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import type { PageKey, User, Partner } from "../../lib/types";
import { AVATARS } from "../../lib/constants";
import { PetalCanvas } from "../ui/PetalCanvas";

interface LoginPageProps {
  setPage: (page: PageKey) => void;
  setUser: (user: User) => void;
  setPartner: (partner: Partner) => void;
}

type Mode = "login" | "create";

function generateCode() {
  return crypto.randomUUID().slice(0, 6).toUpperCase();
}

const LOGIN_CSS = `
  .login-wrap {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    position: relative; z-index: 2; padding: 40px 20px;
  }
  .login-card {
    background: rgba(255,255,255,0.04); backdrop-filter: blur(40px);
    border: 1px solid var(--border); border-radius: var(--radius-xl);
    padding: 48px 40px; max-width: 440px; width: 100%;
    animation: fadeInUp 0.8s ease both;
  }
  .login-title {
    font-family: var(--font-serif);
    font-size: 38px; font-weight: 300; text-align: center;
    margin-bottom: 8px;
    background: linear-gradient(135deg, var(--aurora2), var(--aurora1));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .login-sub { text-align: center; color: var(--muted); font-size: 14px; margin-bottom: 36px; }
  .mode-toggle { display: flex; gap: 8px; margin-bottom: 28px; justify-content: center; }
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
  }
  .avatar-picker { display: flex; gap: 8px; flex-wrap: wrap; }
  .avatar-chip {
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 20px; transition: all 0.2s;
    border: 1.5px solid var(--border);
    background: rgba(255,255,255,0.03);
  }
  .avatar-chip.selected {
    border-color: var(--aurora1);
    background: rgba(192,132,252,0.15);
  }
  @media (max-width: 480px) {
    .login-card { padding: 32px 24px; }
  }
`;

/**
 * LoginPage
 * ─────────
 * Owns: form state, mode toggle (login / create), avatar selection.
 * Does NOT own: routing or persistence (delegated to setUser/setPartner/setPage).
 *
 * Firebase-ready: replace handleSubmit body with Firebase Auth + Firestore write.
 * The partner seeding here is local-only; real partner linking uses bond codes in Firestore.
 */
export function LoginPage({ setPage, setUser, setPartner }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  const [avatar, setAvatar] = useState("💜");
  const [code] = useState(generateCode);

  const handleGoogleLogin = async () => {
  try {
    const provider = new GoogleAuthProvider();

    const result = await signInWithPopup(auth, provider);

    const firebaseUser = result.user;

    const user: User = {
      name: name || firebaseUser.displayName || "Unknown",
      nickname: nickname || firebaseUser.displayName || "Unknown",
      avatar,
      code,
    };

  const userRef = doc(db, "users", firebaseUser.uid);

await setDoc(
  userRef,
  user,
  { merge: true }
);

let bondId = "";

if (mode === "create") {

  // CREATE NEW BOND

  const bondRef = await addDoc(collection(db, "bonds"), {
    user1Uid: firebaseUser.uid,
    user2Uid: null,
    reunionDate: "",
    createdAt: Date.now(),
    code,
  });

  bondId = bondRef.id;

} else {

  // JOIN EXISTING BOND

  const q = query(
    collection(db, "bonds"),
    where("code", "==", partnerCode)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    alert("Invalid bond code");
    return;
  }

  const bondDoc = snapshot.docs[0];

  bondId = bondDoc.id;
  const bondData = bondDoc.data();

if (bondData.user2Uid) {
  alert("This bond is already connected.");
  return;
}

  await updateDoc(
    doc(db, "bonds", bondId),
    {
      user2Uid: firebaseUser.uid,
    }
  );
}

await setDoc(
  userRef,
  {
    bondId,
  },
  { merge: true }
);
    setUser(user);

    setPage("dashboard");
  } catch (err) {
    console.error(err);
  }
};

  return (
    <>
      <style>{LOGIN_CSS}</style>
      <div className="page">
        <div className="aurora-bg" />
        <PetalCanvas />

        <div className="login-wrap">
          <div className="login-card">
            <div className="login-title">Welcome Back</div>
            <div className="login-sub">Step into your shared universe</div>

            {/* Mode Toggle */}
            <div className="mode-toggle">
              {(["login", "create"] as Mode[]).map((m) => (
                <button
                  key={m}
                  className={`nav-btn ${mode === m ? "active" : ""}`}
                  onClick={() => setMode(m)}
                >
                  {m === "login" ? "Sign In" : "Create Bond"}
                </button>
              ))}
            </div>

            {/* Name */}
            <div className="input-wrap">
              <label className="input-label">Your Name</label>
              <input
                className="input-field"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGoogleLogin()}
              />
            </div>

            {/* Nickname */}
            <div className="input-wrap">
              <label className="input-label">Nickname (optional)</label>
              <input
                className="input-field"
                placeholder="What your partner calls you"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            {/* Avatar */}
            <div className="input-wrap">
              <label className="input-label">Choose Your Avatar</label>
              <div className="avatar-picker">
                {AVATARS.map((a) => (
                  <div
                    key={a}
                    className={`avatar-chip ${avatar === a ? "selected" : ""}`}
                    onClick={() => setAvatar(a)}
                  >
                    {a}
                  </div>
                ))}
              </div>
            </div>

            {/* Bond code (create mode) */}
            {mode === "create" && (
              <div className="input-wrap">
                <label className="input-label">Your Bond Code — share with partner</label>
                <div className="bond-code">{code}</div>
              </div>
            )}

            {/* Partner code (login mode) */}
            {mode === "login" && (
              <div className="input-wrap">
                <label className="input-label">Partner Bond Code (optional)</label>
                <input
                  className="input-field"
                  placeholder="Enter partner's code"
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value)}
                />
              </div>
            )}

            <button
              className="btn-primary"
              style={{ width: "100%", marginTop: 8 }}
              onClick={handleGoogleLogin}
            >
              {mode === "login" ? "Enter Our Universe →" : "Create Our Bond →"}
            </button>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">OR</span>
              <div className="divider-line" />
            </div>

            
          </div>
        </div>
      </div>
    </>
  );
}