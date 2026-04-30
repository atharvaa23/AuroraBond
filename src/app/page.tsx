/**
 * app/page.tsx
 * ─────────────
 * Entry point — intentionally minimal.
 * All logic and state lives in components/AuroraBond.tsx.
 *
 * "use client" is needed here because AuroraBond uses hooks.
 */
"use client";

import AuroraBond from "../components/AuroraBond";
import { auth } from "@/lib/firebase";

export default function Home() {
  console.log(auth);
  return <AuroraBond />;

}



