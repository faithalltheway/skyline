import "server-only";
import { db } from "@/lib/db";

export class MessagingAccessError extends Error {
  constructor(public readonly targetUserId: string) {
    super("This user charges to be messaged.");
    this.name = "MessagingAccessError";
  }
}

function orderedPair(userId: string, otherUserId: string): [string, string] {
  return userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];
}

async function hasActiveGrant(payerId: string, payeeId: string, type: "MESSAGE" | "FOLLOW") {
  const grant = await db.paidAccessGrant.findUnique({
    where: { payerId_payeeId_type: { payerId, payeeId, type } },
  });
  return grant?.status === "ACTIVE";
}

/**
 * Returns the existing conversation between the two users, or creates one —
 * gated by the target's messagePriceCents (see UserProfile). Throws
 * MessagingAccessError if the target charges for messages and the initiator
 * hasn't paid (checked with startUserAccessCheckout in billingService).
 */
export async function startOrGetConversation(userId: string, otherUserId: string) {
  if (userId === otherUserId) throw new Error("Cannot message yourself.");

  const [userAId, userBId] = orderedPair(userId, otherUserId);
  const existing = await db.conversation.findUnique({ where: { userAId_userBId: { userAId, userBId } } });
  if (existing) return existing;

  const targetProfile = await db.userProfile.findUnique({ where: { userId: otherUserId } });
  if (targetProfile?.messagePriceCents) {
    const unlocked = await hasActiveGrant(userId, otherUserId, "MESSAGE");
    if (!unlocked) throw new MessagingAccessError(otherUserId);
  }

  return db.conversation.create({ data: { userAId, userBId } });
}

export async function listConversations(userId: string) {
  const conversations = await db.conversation.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    orderBy: { lastMessageAt: "desc" },
    include: {
      userA: { select: { id: true, name: true, profile: { select: { username: true, avatarUrl: true } } } },
      userB: { select: { id: true, name: true, profile: { select: { username: true, avatarUrl: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return conversations.map((c) => {
    const other = c.userAId === userId ? c.userB : c.userA;
    const lastMessage = c.messages[0] ?? null;
    return {
      id: c.id,
      other,
      lastMessage,
      lastMessageAt: c.lastMessageAt,
      unread: Boolean(lastMessage && lastMessage.senderId !== userId && !lastMessage.readAt),
    };
  });
}

/** Loads a conversation's messages; throws if userId isn't a participant. */
export async function getConversationForParticipant(conversationId: string, userId: string) {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      userA: { select: { id: true, name: true, profile: { select: { username: true, avatarUrl: true } } } },
      userB: { select: { id: true, name: true, profile: { select: { username: true, avatarUrl: true } } } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation || (conversation.userAId !== userId && conversation.userBId !== userId)) return null;

  await db.message.updateMany({
    where: { conversationId, senderId: { not: userId }, readAt: null },
    data: { readAt: new Date() },
  });

  const other = conversation.userAId === userId ? conversation.userB : conversation.userA;
  return { ...conversation, other };
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message cannot be empty.");

  const conversation = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation || (conversation.userAId !== senderId && conversation.userBId !== senderId)) {
    throw new Error("Not a participant in this conversation.");
  }

  const [message] = await db.$transaction([
    db.message.create({ data: { conversationId, senderId, body: trimmed } }),
    db.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } }),
  ]);
  return message;
}

export async function unreadConversationCount(userId: string) {
  return db.conversation.count({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
      messages: { some: { senderId: { not: userId }, readAt: null } },
    },
  });
}
