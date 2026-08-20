"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/authz";
import * as messagingService from "@/services/messagingService";

export async function startConversationAction(otherUserId: string) {
  const user = await requireUser();

  try {
    const conversation = await messagingService.startOrGetConversation(user.id, otherUserId);
    redirect(`/messages/${conversation.id}`);
  } catch (err) {
    if (err instanceof messagingService.MessagingAccessError) {
      redirect(`/unlock/message/${otherUserId}`);
    }
    throw err;
  }
}

export interface SendMessageState {
  error?: string;
}

export async function sendMessageAction(
  conversationId: string,
  _prevState: SendMessageState,
  formData: FormData,
): Promise<SendMessageState> {
  const user = await requireUser();
  const body = String(formData.get("body") ?? "");

  try {
    await messagingService.sendMessage(conversationId, user.id, body);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't send that message." };
  }

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  return {};
}
