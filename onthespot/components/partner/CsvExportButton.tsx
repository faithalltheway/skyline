"use client";

import { Button } from "@/components/ui/Button";
import type { AnalyticsPoint } from "./AnalyticsChart";

export function CsvExportButton({ data, filename }: { data: AnalyticsPoint[]; filename: string }) {
  function handleExport() {
    const header = "date,views,rsvps,saves\n";
    const rows = data.map((d) => `${d.date},${d.views},${d.rsvps},${d.saves}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleExport} disabled={data.length === 0}>
      Export CSV
    </Button>
  );
}
