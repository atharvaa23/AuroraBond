"use client";

import { GameTallyPage } from "@/components/pages/GameTallyPage";
import { Navbar } from "@/components/layout/Navbar";
import { useAurora } from "@/components/providers/AuroraProvider";

export default function Page() {
    const { user, partner, bond, goTo, hasUnreadChat } = useAurora();

    return (
        <>
            <Navbar
                page="games"
                setPage={goTo}
                user={user}
                partner={partner}
                hasUnreadChat={hasUnreadChat}
            />

            <GameTallyPage user={user} partner={partner} bond={bond} />
        </>
    );
}