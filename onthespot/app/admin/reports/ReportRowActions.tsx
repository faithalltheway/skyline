"use client";

import { resolveReportAction, dismissReportAction } from "./actions";
import { ReasonActionForm } from "@/components/admin/ReasonActionForm";

export function ReportRowActions({ reportId }: { reportId: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <ReasonActionForm action={resolveReportAction} hiddenFields={{ reportId }} label="Resolve" variant="primary" confirmLabel="Mark resolved" />
      <ReasonActionForm action={dismissReportAction} hiddenFields={{ reportId }} label="Dismiss" variant="outline" confirmLabel="Dismiss report" />
    </div>
  );
}
