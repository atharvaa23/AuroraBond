"use client";

import { Navbar } from "@/components/layout/Navbar";
import { MemoryJarPage } from "@/components/pages/MemoryJarPage";
import { useAurora } from "@/components/providers/AuroraProvider";

export default function MemoriesRoute() {
    const { user, partner, bond, hasUnreadChat } = useAurora();

    return (
        <>
            <Navbar user={user} partner={partner} hasUnreadChat={hasUnreadChat} />

            <MemoryJarPage user={user} partner={partner} bond={bond} />
        </>
    );
}