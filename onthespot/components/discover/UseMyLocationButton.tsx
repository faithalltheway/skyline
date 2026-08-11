"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAnnounce } from "@/components/ui/LiveRegion";

export function UseMyLocationButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const announce = useAnnounce();

  function handleClick() {
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const form = document.getElementById("discover-filters") as HTMLFormElement | null;
        if (form) {
          (form.elements.namedItem("lat") as HTMLInputElement).value = String(position.coords.latitude);
          (form.elements.namedItem("lng") as HTMLInputElement).value = String(position.coords.longitude);
          announce("Location found, updating events near you");
          form.requestSubmit();
        }
        setStatus("idle");
      },
      () => setStatus("error"),
      { timeout: 8000 },
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={status === "loading"}>
        <Icon name="pin" size={16} />
        {status === "loading" ? "Locating…" : "Use my location"}
      </Button>
      {status === "error" && (
        <p role="alert" className="text-xs text-[var(--color-unavailable)]">
          Couldn&apos;t get your location. Try entering a city instead.
        </p>
      )}
    </div>
  );
}
