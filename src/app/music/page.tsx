"use client";

import { MusicPage } from "@/components/pages/MusicPage";
import { Navbar } from "@/components/layout/Navbar";
import { useAurora } from "@/components/providers/AuroraProvider";

export default function Page() {
    const { user, partner, bond, goTo, hasUnreadChat } = useAurora();

    return (
        <>
            <Navbar
                page="music"
                setPage={goTo}
                user={user}
                partner={partner}
                hasUnreadChat={hasUnreadChat}
            />

            <MusicPage user={user} partner={partner} bond={bond} />
        </>
    );
}