"use client";

import { LandingPage } from "@/components/pages/LandingPage";
import { useAurora } from "@/components/providers/AuroraProvider";

export default function Page() {
  const { goTo } = useAurora();

  return <LandingPage setPage={goTo} />;
}