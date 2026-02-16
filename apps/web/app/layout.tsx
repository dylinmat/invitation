import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event Invitation OS - Create Beautiful Digital Invitations",
  description:
    "Create, manage, and track beautiful digital invitations for your events.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
