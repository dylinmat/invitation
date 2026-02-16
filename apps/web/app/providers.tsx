"use client";

import { useState } from "react";

// Simple wrapper that doesn't use external libraries during SSR
export function Providers({ children }: { children: React.ReactNode }) {
  // Use a simple state to track client-side mount
  const [mounted] = useState(() => typeof window !== 'undefined');

  // On server, just render children
  if (!mounted) {
    return <>{children}</>;
  }

  // On client, wrap with QueryClientProvider
  return <ClientProviders>{children}</ClientProviders>;
}

// Separate component that only loads on client
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function ClientProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
