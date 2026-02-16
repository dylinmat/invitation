"use client";

import { Providers } from "./providers";
import { ClientOnly } from "@/components/client-only";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnly>
      <Providers>{children}</Providers>
    </ClientOnly>
  );
}
