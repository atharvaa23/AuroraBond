"use client";

/**
 * AuroraBond — Root App Component
 * ────────────────────────────────
 * This component's ONLY job is state orchestration and routing.
 * It owns no UI markup beyond the page switcher.
 *
 * State owned here (global, shared across pages):
 *   • page       — current route
 *   • user       — authenticated user profile
 *   • partner    — partner profile
 *   • reunionDate — countdown target
 *
 * Everything else is owned by the individual page/component.
 *
 * Firebase migration path:
 *   1. Replace useStorage("ab_user", …) with Firebase Auth listener (onAuthStateChanged).
 *   2. Replace useStorage("ab_partner", …) with Firestore bond document listener.
 *   3. Replace useStorage("ab_reunion", …) with Firestore bond field.
 *   4. Each page component already receives data via props — no page-level changes needed.
 */

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import type { PageKey, User, Partner } from "../lib/types";


// Layout
import { Navbar } from "./layout/Navbar";

// Pages
import { LandingPage   } from "./pages/LandingPage";
import { LoginPage     } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { WeatherPage   } from "./pages/WeatherPage";
import { MovieVaultPage} from "./pages/MovieVaultPage";
import { ChatPage      } from "./pages/ChatPage";
import { OurStoryPage  } from "./pages/OurStoryPage";
import { SettingsPage  } from "./pages/SettingsPage";

const PAGES_WITHOUT_NAV: PageKey[] = ["landing", "login"];

export default function AuroraBond() {
  
  const [page, setPage] = useState<PageKey>("landing");
  const [user, setUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [reunionDate, setReunionDate] = useState("");

  // Auto-forward to dashboard if already logged in
  let unsubPartner: (() => void) | undefined;
  let unsubBond: (() => void) | undefined;
useEffect(() => {
  let unsubUser: (() => void) | undefined;

  const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {

    if (!firebaseUser) {
      setUser(null);
      setPage("landing");
      return;
    }

    unsubUser = onSnapshot(
      doc(db, "users", firebaseUser.uid),
      (snap) => {
        if (snap.exists()) {
  const userData = snap.data() as User & { bondId?: string };

  setUser(userData);
  setPage("dashboard");

  if (userData.bondId) {
    unsubBond = onSnapshot(
      doc(db, "bonds", userData.bondId),
      (bondSnap) => {
        if (bondSnap.exists()) {
  const bond = bondSnap.data();

  setReunionDate(bond.reunionDate || "");

  const partnerUid =
    bond.user1Uid === firebaseUser.uid
      ? bond.user2Uid
      : bond.user1Uid;

  if (partnerUid) {
   unsubPartner = onSnapshot(
  doc(db, "users", partnerUid),
  (partnerSnap) => {
    if (partnerSnap.exists()) {
      setPartner(partnerSnap.data() as Partner);
    }
  }
);
  }
}
      }
    );
  }
}
      }
    );
  });

  return () => {
    unsubAuth();
    if (unsubPartner) unsubPartner();
    if (unsubUser) unsubUser();
    if (unsubBond) unsubBond();
  };
}, []);

  const showNav = !!user && !PAGES_WITHOUT_NAV.includes(page);

  return (
    <>
      {showNav && (
        <Navbar page={page} setPage={setPage} user={user} partner={partner} />
      )}

      {page === "landing"   && <LandingPage    setPage={setPage} />}
      {page === "login"     && <LoginPage      setPage={setPage} setUser={setUser} setPartner={setPartner} />}
      {page === "dashboard" && <DashboardPage  setPage={setPage} user={user} partner={partner} reunionDate={reunionDate} />}
      {page === "weather"   && <WeatherPage    user={user} partner={partner} />}
      {page === "movies"    && <MovieVaultPage />}
      {page === "chat"      && <ChatPage       user={user} partner={partner} />}
      {page === "story"     && <OurStoryPage   user={user} partner={partner} />}
      {page === "settings"  && (
        <SettingsPage
          user={user}           setUser={setUser}
          partner={partner}     setPartner={setPartner}
          reunionDate={reunionDate} setReunionDate={setReunionDate}
        />
      )}
    </>
  );
}