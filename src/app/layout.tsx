import type { Metadata } from "next";
import { AuroraProvider } from "@/components/providers/AuroraProvider";
import "../../styles/globals.css";

export const metadata: Metadata = {
  title: "AuroraBond",
  description: "A shared universe for two.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuroraProvider>{children}</AuroraProvider>
      </body>
    </html>
  );
}