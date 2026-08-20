"use client";

import { useActionState, useRef, useEffect } from "react";
import { sendMessageAction, type SendMessageState } from "@/actions/messaging";
import { Button } from "@/components/ui/Button";

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const action = sendMessageAction.bind(null, conversationId);
  const [state, formAction, pending] = useActionState<SendMessageState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 border-t border-border p-3">
      {state.error && (
        <p role="alert" className="text-xs font-medium text-[var(--color-unavailable)]">
          {state.error}
        </p>
      )}
      <div className="flex items-end gap-2">
        <label className="sr-only" htmlFor="message-body">
          Message
        </label>
        <textarea
          id="message-body"
          name="body"
          rows={1}
          required
          placeholder="Write a message…"
          className="flex-1 resize-none rounded-control border border-border bg-surface px-3 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send"}
        </Button>
      </div>
    </form>
  );
}
