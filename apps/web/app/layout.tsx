import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Event Invitation OS - Create Beautiful Digital Invitations",
  description:
    "Create, manage, and track beautiful digital invitations for your events. Real-time collaboration, RSVP management, and stunning templates.",
  keywords: [
    "event invitations",
    "digital invitations",
    "RSVP management",
    "event planning",
    "wedding invitations",
    "party invitations",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
