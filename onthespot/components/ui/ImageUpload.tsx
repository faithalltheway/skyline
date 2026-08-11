"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

export function ImageUpload({
  name,
  label,
  folder,
  defaultValue,
  hint,
  aspect = "square",
}: {
  name: string;
  label: string;
  folder: string;
  defaultValue?: string | null;
  hint?: string;
  aspect?: "square" | "wide";
}) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue ?? "");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");

  async function handleFile(file: File) {
    setStatus("uploading");
    const body = new FormData();
    body.append("file", file);
    body.append("folder", folder);
    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      if (!res.ok) throw new Error("upload failed");
      const data = (await res.json()) as { url: string };
      setUrl(data.url);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {label}
      </label>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex items-center justify-center overflow-hidden border border-border bg-surface-muted",
            aspect === "square" ? "h-20 w-20 rounded-full" : "h-24 w-40 rounded-control",
          )}
        >
          {url ? (
            <Image src={url} alt="" width={160} height={160} className="h-full w-full object-cover" unoptimized />
          ) : (
            <span className="text-xs text-neutral-400">No image</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={status === "uploading"}
          >
            {status === "uploading" ? "Uploading…" : url ? "Replace image" : "Upload image"}
          </Button>
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          {status === "error" && (
            <p role="alert" className="text-xs font-medium text-unavailable">
              Upload failed. Try a smaller image.
            </p>
          )}
          {hint && <p className="text-xs text-neutral-500">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
