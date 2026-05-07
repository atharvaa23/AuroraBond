"use client";

import { Navbar } from "@/components/layout/Navbar";
import { BucketListPage } from "@/components/pages/BucketListPage";
import { useAurora } from "@/components/providers/AuroraProvider";

export default function BucketRoute() {
    const { user, partner, bond, hasUnreadChat } = useAurora();

    return (
        <>
            <Navbar user={user} partner={partner} hasUnreadChat={hasUnreadChat} />

            <BucketListPage user={user} partner={partner} bond={bond} />
        </>
    );
}