"use client";

import { MovieVaultPage } from "@/components/pages/MovieVaultPage";
import { Navbar } from "@/components/layout/Navbar";
import { useAurora } from "@/components/providers/AuroraProvider";

export default function Page() {
    const { user, partner, goTo, hasUnreadChat } = useAurora();

    return (
        <>
            <Navbar
                page="movies"
                setPage={goTo}
                user={user}
                partner={partner}
                hasUnreadChat={hasUnreadChat}
            />

            <MovieVaultPage user={user} />
        </>
    );
}