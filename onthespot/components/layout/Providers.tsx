"use client";

import { SessionProvider } from "next-auth/react";
import { LiveRegionProvider } from "@/components/ui/LiveRegion";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LiveRegionProvider>{children}</LiveRegionProvider>
    </SessionProvider>
  );
}
