"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import type {
    Bond,
    NavigateMode,
    PageKey,
    Partner,
    ThemeKey,
    User,
} from "@/lib/types";

interface AuroraContextValue {
    user: User | null;
    setUser: (user: User | null) => void;
    partner: Partner | null;
    setPartner: (partner: Partner | null) => void;
    bond: Bond | null;
    reunionDate: string;
    setReunionDate: (date: string) => void;
    hasUnreadChat: boolean;
    goTo: (page: PageKey, mode?: NavigateMode) => void;
}

const AuroraContext = createContext<AuroraContextValue | null>(null);

const PAGE_TO_PATH: Record<PageKey, string> = {
    landing: "/",
    login: "/login",
    dashboard: "/dashboard",
    weather: "/weather",
    movies: "/movies",
    chat: "/chat",
    games: "/games",
    music: "/music",
    story: "/story",
    settings: "/settings",
    memories: "/memories",
    bucket: "/bucket",
};

const PUBLIC_AUTH_PAGES = ["/", "/login"];
const HEARTBEAT_INTERVAL = 20_000;
const DEFAULT_THEME: ThemeKey = "aurora";

function isThemeKey(value: string | null | undefined): value is ThemeKey {
    return (
        value === "aurora" ||
        value === "moonlight" ||
        value === "breeze" ||
        value === "ocean" ||
        value === "rose" ||
        value === "cosmic" ||
        value === "forest" ||
        value === "sunset"
    );
}

export function AuroraProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    const [user, setUser] = useState<User | null>(null);
    const [partner, setPartner] = useState<Partner | null>(null);
    const [bond, setBond] = useState<Bond | null>(null);
    const [reunionDate, setReunionDate] = useState("");
    const [hasUnreadChat, setHasUnreadChat] = useState(false);

    const lastSeenMessageIdRef = useRef<string | null>(null);
    const pathnameRef = useRef(pathname);

    const goTo = useCallback(
        (page: PageKey, mode: NavigateMode = "push") => {
            const path = PAGE_TO_PATH[page];

            if (pathnameRef.current === path) return;

            if (mode === "replace") {
                router.replace(path);
                return;
            }

            router.push(path);
        },
        [router]
    );

    useEffect(() => {
        pathnameRef.current = pathname;

        if (pathname === "/chat") {
            setHasUnreadChat(false);
        }
    }, [pathname]);

    useEffect(() => {
        const savedTheme =
            bond?.theme ||
            (typeof window !== "undefined"
                ? window.localStorage.getItem("aurora-theme")
                : null);

        const theme = isThemeKey(savedTheme) ? savedTheme : DEFAULT_THEME;

        document.documentElement.dataset.theme = theme;
        window.localStorage.setItem("aurora-theme", theme);
    }, [bond?.theme]);

    useEffect(() => {
        if (!user) return;

        if (PUBLIC_AUTH_PAGES.includes(pathname)) {
            router.replace("/dashboard");
        }
    }, [user, pathname, router]);

    useEffect(() => {
        let unsubUser: (() => void) | undefined;
        let unsubBond: (() => void) | undefined;
        let unsubPartner: (() => void) | undefined;

        const cleanupBondListeners = () => {
            unsubBond?.();
            unsubPartner?.();

            unsubBond = undefined;
            unsubPartner = undefined;
        };

        const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (!firebaseUser) {
                unsubUser?.();
                cleanupBondListeners();

                unsubUser = undefined;

                setUser(null);
                setPartner(null);
                setBond(null);
                setReunionDate("");
                setHasUnreadChat(false);

                if (!PUBLIC_AUTH_PAGES.includes(pathnameRef.current)) {
                    router.replace("/");
                }

                return;
            }

            unsubUser?.();
            cleanupBondListeners();

            unsubUser = onSnapshot(
                doc(db, "users", firebaseUser.uid),
                (userSnap) => {
                    if (!userSnap.exists()) {
                        if (pathnameRef.current !== "/login") {
                            router.replace("/login");
                        }

                        return;
                    }

                    const userData = userSnap.data() as User & { bondId?: string };

                    const currentUser: User = {
                        ...userData,
                        uid: firebaseUser.uid,
                    };

                    setUser(currentUser);

                    if (PUBLIC_AUTH_PAGES.includes(pathnameRef.current)) {
                        router.replace("/dashboard");
                    }

                    if (!userData.bondId) {
                        cleanupBondListeners();
                        setBond(null);
                        setPartner(null);
                        setReunionDate("");
                        return;
                    }

                    unsubBond?.();

                    unsubBond = onSnapshot(
                        doc(db, "bonds", userData.bondId),
                        (bondSnap) => {
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
                                unsubPartner?.();
                                unsubPartner = undefined;
                                setPartner(null);
                                return;
                            }

                            unsubPartner?.();

                            unsubPartner = onSnapshot(
                                doc(db, "users", partnerUid),
                                (partnerSnap) => {
                                    if (!partnerSnap.exists()) {
                                        setPartner(null);
                                        return;
                                    }

                                    setPartner({
                                        ...(partnerSnap.data() as Partner),
                                        uid: partnerUid,
                                    });
                                },
                                (error) => {
                                    console.error("Partner listener error:", error);
                                }
                            );
                        },
                        (error) => {
                            console.error("Bond listener error:", error);
                        }
                    );
                },
                (error) => {
                    console.error("User listener error:", error);
                }
            );
        });

        return () => {
            unsubAuth();
            unsubUser?.();
            cleanupBondListeners();
        };
    }, [router]);

    // Global online presence.
    // Path: bonds/{bondId}/presence/{uid}
    useEffect(() => {
        const bondId = user?.bondId;
        const currentUid = user?.uid || auth.currentUser?.uid;

        if (!bondId || !currentUid) return;

        const presenceRef = doc(db, "bonds", bondId, "presence", currentUid);

        const setOnline = () => {
            setDoc(
                presenceRef,
                {
                    isOnline: true,
                    lastSeen: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            ).catch(() => { });
        };

        const setOffline = () => {
            setDoc(
                presenceRef,
                {
                    isOnline: false,
                    typing: false,
                    lastSeen: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            ).catch(() => { });
        };

        setOnline();

        const heartbeat = window.setInterval(setOnline, HEARTBEAT_INTERVAL);

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                setOnline();
                return;
            }

            setDoc(
                presenceRef,
                {
                    typing: false,
                    lastSeen: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            ).catch(() => { });
        };

        window.addEventListener("beforeunload", setOffline);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.clearInterval(heartbeat);
            window.removeEventListener("beforeunload", setOffline);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            setOffline();
        };
    }, [user?.bondId, user?.uid]);

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

                if (messageFromPartner && pathnameRef.current !== "/chat") {
                    setHasUnreadChat(true);
                }
            },
            (error) => {
                console.error("Unread chat listener error:", error);
            }
        );

        return unsub;
    }, [user?.bondId, user?.uid]);

    const value = useMemo(
        () => ({
            user,
            setUser,
            partner,
            setPartner,
            bond,
            reunionDate,
            setReunionDate,
            hasUnreadChat,
            goTo,
        }),
        [user, partner, bond, reunionDate, hasUnreadChat, goTo]
    );

    return (
        <AuroraContext.Provider value={value}>
            {children}
        </AuroraContext.Provider>
    );
}

export function useAurora() {
    const context = useContext(AuroraContext);

    if (!context) {
        throw new Error("useAurora must be used inside AuroraProvider");
    }

    return context;
}