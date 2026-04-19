import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MessageService {

    /**
     * Start a new thread between the requester and receiver
     */
    static async startThread(requesterClerkId: string, receiverId: string, courseId: string) {
        const requester = await prisma.user.findUnique({ where: { clerkId: requesterClerkId } });
        if (!requester) throw new Error("Requester not found");

        // Check if thread already exists
        const existingThreads = await prisma.messageThread.findMany({
            where: { courseId },
            include: { participants: true }
        });

        const thread = existingThreads.find(t =>
            t.participants.some(p => p.userId === requester.id) &&
            t.participants.some(p => p.userId === receiverId)
        );

        if (thread) return { success: true, thread };

        // Create new thread
        const newThread = await prisma.messageThread.create({
            data: {
                courseId,
                participants: {
                    create: [
                        { userId: requester.id },
                        { userId: receiverId }
                    ]
                }
            },
            include: { participants: true }
        });

        return { success: true, thread: newThread };
    }

    /**
     * Get all threads for the current user
     */
    static async getUserThreads(clerkUserId: string, courseId: string) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) throw new Error("User not found");

        const threads = await prisma.messageThread.findMany({
            where: {
                courseId,
                participants: { some: { userId: user.id } }
            },
            include: {
                participants: {
                    include: { user: true }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return threads.map(t => {
            const peer = t.participants.find(p => p.userId !== user.id)?.user;
            return {
                id: t.id,
                peer: peer ? { id: peer.id, name: peer.name } : null,
                lastMessage: t.messages[0] || null,
                createdAt: t.createdAt
            };
        });
    }

    /**
     * Get all messages for a specific thread
     */
    static async getThreadMessages(threadId: string, clerkUserId: string) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) throw new Error("User not found");

        // Validate participation
        const thread = await prisma.messageThread.findFirst({
            where: {
                id: threadId,
                participants: { some: { userId: user.id } }
            }
        });

        if (!thread) throw new Error("Thread not found or unauthorized");

        const messages = await prisma.message.findMany({
            where: { threadId },
            include: { sender: true },
            orderBy: { createdAt: 'asc' }
        });

        return messages.map(m => ({
            id: m.id,
            content: m.content,
            isMine: m.senderId === user.id,
            senderName: m.sender.name,
            createdAt: m.createdAt
        }));
    }

    /**
     * Schedule a study session tied to a thread
     */
    static async scheduleSession(threadId: string, clerkUserId: string, title: string, scheduledAt: Date) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) throw new Error('User not found');

        const thread = await prisma.messageThread.findFirst({
            where: { id: threadId, participants: { some: { userId: user.id } } }
        });
        if (!thread) throw new Error('Thread not found or unauthorized');

        const session = await (prisma as any).peerStudySession.create({
            data: { threadId, createdById: user.id, title, scheduledAt }
        });
        return session;
    }

    /**
     * Get all scheduled sessions for a thread
     */
    static async getThreadSessions(threadId: string, clerkUserId: string) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) throw new Error('User not found');

        const thread = await prisma.messageThread.findFirst({
            where: { id: threadId, participants: { some: { userId: user.id } } }
        });
        if (!thread) throw new Error('Thread not found or unauthorized');

        return (prisma as any).peerStudySession.findMany({
            where: { threadId },
            include: { createdBy: { select: { id: true, name: true } } },
            orderBy: { scheduledAt: 'asc' }
        });
    }

    /**
     * Get full thread info (participants) for displaying peer name in thread header
     */
    static async getThreadInfo(threadId: string, clerkUserId: string) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) throw new Error('User not found');

        const thread = await prisma.messageThread.findFirst({
            where: { id: threadId, participants: { some: { userId: user.id } } },
            include: { participants: { include: { user: { select: { id: true, name: true, username: true } } } } }
        });
        if (!thread) throw new Error('Thread not found or unauthorized');

        const peer = thread.participants.find(p => p.userId !== user.id)?.user || null;
        return { id: thread.id, peer };
    }

    /**
     * Send a message in a thread
     */
    static async sendMessage(threadId: string, clerkUserId: string, content: string) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) throw new Error("User not found");

        // Validate participation
        const thread = await prisma.messageThread.findFirst({
            where: {
                id: threadId,
                participants: { some: { userId: user.id } }
            }
        });

        if (!thread) throw new Error("Thread not found or unauthorized");

        const message = await prisma.message.create({
            data: {
                threadId,
                senderId: user.id,
                content
            },
            include: { sender: true }
        });

        return {
            id: message.id,
            content: message.content,
            isMine: true,
            senderName: message.sender.name,
            createdAt: message.createdAt
        };
    }
}
