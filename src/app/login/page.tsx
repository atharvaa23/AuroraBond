"use client";

import { LoginPage } from "@/components/pages/LoginPage";
import { useAurora } from "@/components/providers/AuroraProvider";

export default function Page() {
    const { goTo, setUser, setPartner } = useAurora();

    return (
        <LoginPage
            setPage={goTo}
            setUser={setUser}
            setPartner={setPartner}
        />
    );
}