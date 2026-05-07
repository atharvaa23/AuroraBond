"use client";

import { Navbar } from "@/components/layout/Navbar";
import { OurStoryPage } from "@/components/pages/OurStoryPage";
import { useAurora } from "@/components/providers/AuroraProvider";

export default function Page() {
    const { user, partner, goTo, hasUnreadChat } = useAurora();

    return (
        <>
            <Navbar
                page="story"
                setPage={goTo}
                user={user}
                partner={partner}
                hasUnreadChat={hasUnreadChat}
            />

            <OurStoryPage user={user} partner={partner} />
        </>
    );
}