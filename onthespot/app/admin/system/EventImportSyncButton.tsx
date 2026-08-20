"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface ImportSummary {
  source: string;
  city: string;
  fetched: number;
  imported: number;
  skippedDuplicate: number;
  skippedInvalid: number;
  errors: string[];
}

export function EventImportSyncButton({ endpoint, configured, disabledHint }: { endpoint: string; configured: boolean; disabledHint: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [summaries, setSummaries] = useState<ImportSummary[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSync() {
    setStatus("loading");
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Sync failed");
        setStatus("error");
        return;
      }
      setSummaries(data.summaries ?? []);
      setStatus("done");
    } catch {
      setErrorMsg("Network error while syncing");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={handleSync} disabled={!configured || status === "loading"}>
          {status === "loading" ? "Syncing…" : "Sync now"}
        </Button>
        {!configured && <p className="text-xs text-neutral-500">{disabledHint}</p>}
      </div>

      {status === "error" && (
        <p role="alert" className="text-sm font-medium text-[var(--color-unavailable)]">
          {errorMsg}
        </p>
      )}

      {status === "done" && (
        <div role="status" className="rounded-control border border-border p-3 text-sm">
          <p className="font-semibold">Sync complete</p>
          <ul className="mt-2 flex flex-col gap-1 text-xs text-neutral-500">
            {summaries.map((s) => (
              <li key={`${s.source}-${s.city}`}>
                <span className="font-semibold">{s.source}</span> · {s.city}: {s.fetched} found, {s.imported} imported,{" "}
                {s.skippedDuplicate} already had, {s.skippedInvalid} skipped
                {s.errors.length > 0 && <span className="text-[var(--color-unavailable)]"> — {s.errors[0]}</span>}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-neutral-500">
            Imported events are in the moderation queue as PENDING_REVIEW.
          </p>
        </div>
      )}
    </div>
  );
}
