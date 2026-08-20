import { notFound } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { getConversationForParticipant } from "@/services/messagingService";
import { cn } from "@/lib/utils";
import { MessageComposer } from "./MessageComposer";

export const metadata = { title: "Conversation" };

export default async function ConversationThreadPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const user = await requireUser();

  const conversation = await getConversationForParticipant(conversationId, user.id);
  if (!conversation) notFound();

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-2xl flex-col px-4 sm:px-6">
      <div className="border-b border-border py-4">
        <h1 className="text-lg font-extrabold">{conversation.other.name}</h1>
      </div>

      <ol className="flex flex-1 flex-col gap-2 overflow-y-auto py-4">
        {conversation.messages.map((message) => {
          const mine = message.senderId === user.id;
          return (
            <li key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-card px-3.5 py-2 text-sm",
                  mine ? "bg-brand-600 text-white" : "border border-border bg-surface-muted",
                )}
              >
                {message.body}
              </div>
            </li>
          );
        })}
      </ol>

      <MessageComposer conversationId={conversation.id} />
    </div>
  );
}
