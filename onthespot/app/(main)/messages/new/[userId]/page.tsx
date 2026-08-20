import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import * as messagingService from "@/services/messagingService";

export const metadata = { title: "Start a conversation" };

// Resolves (or opens, if free) a conversation with :userId and redirects into
// it — or to the paid-unlock flow if the target charges for messages.
export default async function NewMessagePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = await requireUser();

  const target = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) notFound();

  try {
    const conversation = await messagingService.startOrGetConversation(user.id, userId);
    redirect(`/messages/${conversation.id}`);
  } catch (err) {
    if (err instanceof messagingService.MessagingAccessError) {
      redirect(`/unlock/message/${userId}`);
    }
    throw err;
  }
}
