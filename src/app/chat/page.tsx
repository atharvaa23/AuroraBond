"use client";

import { ChatPage } from "@/components/pages/ChatPage";
import { Navbar } from "@/components/layout/Navbar";
import { useAurora } from "@/components/providers/AuroraProvider";

export default function Page() {
    const { user, partner, bond, goTo, hasUnreadChat } = useAurora();

    return (
        <>
            <Navbar
                page="chat"
                setPage={goTo}
                user={user}
                partner={partner}
                hasUnreadChat={hasUnreadChat}
            />

            <ChatPage user={user} partner={partner} bond={bond} />
        </>
    );
}