"use client";

import { suspendUserAction, banUserAction, restoreUserAction } from "./actions";
import { ReasonActionForm } from "@/components/admin/ReasonActionForm";
import type { AccountStatus } from "@prisma/client";

export function UserRowActions({ userId, status }: { userId: string; status: AccountStatus }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {status !== "SUSPENDED" && status !== "BANNED" && (
        <ReasonActionForm
          action={suspendUserAction}
          hiddenFields={{ userId }}
          label="Suspend"
          variant="outline"
          confirmLabel="Suspend user"
        />
      )}
      {status !== "BANNED" && (
        <ReasonActionForm action={banUserAction} hiddenFields={{ userId }} label="Ban" variant="danger" confirmLabel="Ban user" />
      )}
      {status !== "ACTIVE" && (
        <ReasonActionForm
          action={restoreUserAction}
          hiddenFields={{ userId }}
          label="Restore"
          variant="primary"
          confirmLabel="Restore access"
        />
      )}
    </div>
  );
}
