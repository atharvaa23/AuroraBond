"use client";

import { DashboardPage } from "@/components/pages/DashboardPage";
import { Navbar } from "@/components/layout/Navbar";
import { useAurora } from "@/components/providers/AuroraProvider";

export default function Page() {
    const {
        user,
        partner,
        bond,
        reunionDate,
        goTo,
        hasUnreadChat,
    } = useAurora();

    return (
        <>
            <Navbar
                page="dashboard"
                setPage={goTo}
                user={user}
                partner={partner}
                hasUnreadChat={hasUnreadChat}
            />

            <DashboardPage
                setPage={goTo}
                user={user}
                partner={partner}
                reunionDate={reunionDate}
                bond={bond}
            />
        </>
    );
}