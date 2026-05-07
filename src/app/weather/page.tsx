"use client";

import { WeatherPage } from "@/components/pages/WeatherPage";
import { Navbar } from "@/components/layout/Navbar";
import { useAurora } from "@/components/providers/AuroraProvider";

export default function Page() {
    const { user, partner, bond, goTo, hasUnreadChat } = useAurora();

    return (
        <>
            <Navbar
                page="weather"
                setPage={goTo}
                user={user}
                partner={partner}
                hasUnreadChat={hasUnreadChat}
            />

            <WeatherPage user={user} partner={partner} bond={bond} />
        </>
    );
}