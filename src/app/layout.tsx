import type { Metadata } from "next";
import "../../styles/globals.css";

export const metadata: Metadata = {
  title:       "AuroraBond — Your Shared Universe",
  description: "The space where two hearts share one living, breathing digital world.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}