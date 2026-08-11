"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

interface LiveRegionContextValue {
  announce: (message: string) => void;
}

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null);

export function LiveRegionProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback((msg: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage("");
    timeoutRef.current = setTimeout(() => setMessage(msg), 50);
  }, []);

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
      <div aria-live="polite" role="status" className="sr-only">
        {message}
      </div>
    </LiveRegionContext.Provider>
  );
}

export function useAnnounce() {
  const ctx = useContext(LiveRegionContext);
  if (!ctx) throw new Error("useAnnounce must be used within LiveRegionProvider");
  return ctx.announce;
}
