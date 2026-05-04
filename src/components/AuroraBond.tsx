"use client";

/**
 * AuroraBond — Root App Component
 * ────────────────────────────────
 * This component's ONLY job is state orchestration and routing.
 */

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import type { PageKey, User, Partner, Bond } from "../lib/types";
import { auth, db } from "@/lib/firebase";

// Layout
import { Navbar } from "./layout/Navbar";

// Pages
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { WeatherPage } from "./pages/WeatherPage";
import { MovieVaultPage } from "./pages/MovieVaultPage";
import { ChatPage } from "./pages/ChatPage";
import { OurStoryPage } from "./pages/OurStoryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { GameTallyPage } from "./pages/GameTallyPage";

const PAGES_WITHOUT_NAV: PageKey[] = ["landing", "login"];

export default function AuroraBond() {
  const [page, setPage] = useState<PageKey>("landing");
  const [user, setUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [reunionDate, setReunionDate] = useState("");
  const [bond, setBond] = useState<Bond | null>(null);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);

  const routedAfterLoginRef = useRef(false);
  const pageRef = useRef<PageKey>("landing");
  const lastSeenMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    let unsubUser: (() => void) | undefined;
    let unsubBond: (() => void) | undefined;
    let unsubPartner: (() => void) | undefined;

    const cleanupBondListeners = () => {
      if (unsubPartner) {
        unsubPartner();
        unsubPartner = undefined;
      }

      if (unsubBond) {
        unsubBond();
        unsubBond = undefined;
      }
    };

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        routedAfterLoginRef.current = false;

        setUser(null);
        setPartner(null);
        setBond(null);
        setReunionDate("");
        setHasUnreadChat(false);
        setPage("landing");

        cleanupBondListeners();

        if (unsubUser) {
          unsubUser();
          unsubUser = undefined;
        }

        return;
      }

      if (unsubUser) {
        unsubUser();
        unsubUser = undefined;
      }

      unsubUser = onSnapshot(doc(db, "users", firebaseUser.uid), (userSnap) => {
        if (!userSnap.exists()) return;

        const userData = userSnap.data() as User & {
          bondId?: string;
        };

        const currentUser = {
          ...userData,
          uid: firebaseUser.uid,
        } as User;

        setUser(currentUser);

        if (!routedAfterLoginRef.current) {
          setPage("dashboard");
          routedAfterLoginRef.current = true;
        }

        cleanupBondListeners();

        if (!userData.bondId) {
          setBond(null);
          setPartner(null);
          setReunionDate("");
          return;
        }

        unsubBond = onSnapshot(doc(db, "bonds", userData.bondId), (bondSnap) => {
          if (!bondSnap.exists()) {
            setBond(null);
            setPartner(null);
            setReunionDate("");
            return;
          }

          const bondData = bondSnap.data() as Bond;

          setBond(bondData);
          setReunionDate(bondData.reunionDate || "");

          const partnerUid =
            bondData.user1Uid === firebaseUser.uid
              ? bondData.user2Uid
              : bondData.user1Uid;

          if (!partnerUid) {
            setPartner(null);
            return;
          }

          if (unsubPartner) {
            unsubPartner();
            unsubPartner = undefined;
          }

          unsubPartner = onSnapshot(doc(db, "users", partnerUid), (partnerSnap) => {
            if (!partnerSnap.exists()) {
              setPartner(null);
              return;
            }

            setPartner({
              ...(partnerSnap.data() as Partner),
              uid: partnerUid,
            });
          });
        });
      });
    });

    return () => {
      unsubAuth();

      if (unsubUser) unsubUser();
      if (unsubBond) unsubBond();
      if (unsubPartner) unsubPartner();
    };
  }, []);

  useEffect(() => {
    pageRef.current = page;

    if (page === "chat") {
      setHasUnreadChat(false);
    }
  }, [page]);

  useEffect(() => {
    const bondId = user?.bondId;
    const currentUid = user?.uid || auth.currentUser?.uid;

    if (!bondId || !currentUid) return;

    lastSeenMessageIdRef.current = null;
    setHasUnreadChat(false);

    const latestMessageQuery = query(
      collection(db, "bonds", bondId, "messages"),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsub = onSnapshot(
      latestMessageQuery,
      (snap) => {
        const latestDoc = snap.docs[0];

        if (!latestDoc) return;

        const latestId = latestDoc.id;
        const latestData = latestDoc.data();

        if (lastSeenMessageIdRef.current === null) {
          lastSeenMessageIdRef.current = latestId;
          return;
        }

        if (latestId === lastSeenMessageIdRef.current) return;

        lastSeenMessageIdRef.current = latestId;

        const messageFromPartner = latestData.sender !== currentUid;

        if (messageFromPartner && pageRef.current !== "chat") {
          setHasUnreadChat(true);
        }
      },
      (error) => {
        console.error("Latest message listener error:", error);
      }
    );

    return unsub;
  }, [user?.bondId, user?.uid]);

  const showNav = !!user && !PAGES_WITHOUT_NAV.includes(page);

  return (
    <>
      {showNav && (
        <Navbar
          page={page}
          setPage={setPage}
          user={user}
          partner={partner}
          hasUnreadChat={hasUnreadChat}
        />
      )}

      {page === "landing" && <LandingPage setPage={setPage} />}

      {page === "login" && (
        <LoginPage
          setPage={setPage}
          setUser={setUser}
          setPartner={setPartner}
        />
      )}

      {page === "dashboard" && (
        <DashboardPage
          setPage={setPage}
          user={user}
          partner={partner}
          reunionDate={reunionDate}
          bond={bond}
        />
      )}

      {page === "weather" && (
        <WeatherPage user={user} partner={partner} bond={bond} />
      )}

      {page === "movies" && <MovieVaultPage user={user} />}

      {page === "chat" && (
        <ChatPage user={user} partner={partner} bond={bond} />
      )}

      {page === "story" && (
        <OurStoryPage user={user} partner={partner} />
      )}

      {page === "games" && (
        <GameTallyPage user={user} partner={partner} bond={bond} />
      )}

      {page === "settings" && (
        <SettingsPage
          user={user}
          setUser={setUser}
          partner={partner}
          setPartner={setPartner}
          reunionDate={reunionDate}
          setReunionDate={setReunionDate}
          bond={bond}
        />
      )}
    </>
  );
}