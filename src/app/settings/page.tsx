"use client";

import { SettingsPage } from "@/components/pages/SettingsPage";
import { Navbar } from "@/components/layout/Navbar";
import { useAurora } from "@/components/providers/AuroraProvider";

export default function Page() {
    const {
        user,
        setUser,
        partner,
        setPartner,
        bond,
        reunionDate,
        setReunionDate,
        goTo,
        hasUnreadChat,
    } = useAurora();

    return (
        <>
            <Navbar
                page="settings"
                setPage={goTo}
                user={user}
                partner={partner}
                hasUnreadChat={hasUnreadChat}
            />

            <SettingsPage
                user={user}
                setUser={setUser}
                partner={partner}
                setPartner={setPartner}
                reunionDate={reunionDate}
                setReunionDate={setReunionDate}
                bond={bond}
            />
        </>
    );
}