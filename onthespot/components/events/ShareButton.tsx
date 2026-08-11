"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAnnounce } from "@/components/ui/LiveRegion";

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const announce = useAnnounce();

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled — no-op
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    announce("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="outline" onClick={handleShare}>
      {copied ? "Link copied!" : "Share"}
    </Button>
  );
}
