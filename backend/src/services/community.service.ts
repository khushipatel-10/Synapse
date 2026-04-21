import { PrismaClient } from '@prisma/client';
import { getOrCreateUser } from '../utils/getOrCreateUser';

const prisma = new PrismaClient();

export class CommunityService {

    /**
     * Lists all hubs for a given course.
     * Injects the current user's membership flag if clerkUserId is provided.
     */
    static async getHubsForCourse(courseId: string, clerkUserId: string) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });

        const hubs = await prisma.hub.findMany({
            where: { courseId },
            include: {
                members: {
                    include: { user: true }
                },
                requests: true
            }
        });

        return hubs.map(hub => {
            const activeMembers = hub.members.filter(m => m.status === 'active');

            // Determine user's relation to this hub
            let userStatus = 'none';
            if (user) {
                const isMember = activeMembers.some(m => m.userId === user.id);
                if (isMember) {
                    userStatus = 'member';
                } else {
                    const isPending = hub.requests.some(r => r.userId === user.id && r.status === 'pending');
                    if (isPending) {
                        userStatus = 'pending';
                    }
                }
            }

            return {
                id: hub.id,
                name: hub.name,
                memberCount: activeMembers.length,
                members: activeMembers.map(m => ({
                    id: m.user.id,
                    name: m.user.name,
                    role: m.role
                })),
                userStatus
            };
        });
    }

    /**
     * Creates a join request. Approves automatically if hub has capacity (< 4).
     */
    static async joinHub(hubId: string, clerkUserId: string) {
        const user = await getOrCreateUser(clerkUserId);

        const hub = await prisma.hub.findUnique({
            where: { id: hubId },
            include: { members: true }
        });
        if (!hub) throw new Error("Hub not found");

        const activeMembersCount = hub.members.filter(m => m.status === 'active').length;

        // Auto-approve logic
        if (activeMembersCount < 4) {
            await prisma.joinRequest.upsert({
                where: { hubId_userId: { hubId, userId: user.id } },
                update: { status: 'approved', reviewedAt: new Date() },
                create: { hubId, userId: user.id, status: 'approved', reviewedAt: new Date() }
            });

            await prisma.hubMember.upsert({
                where: { hubId_userId: { hubId, userId: user.id } },
                update: { status: 'active', role: 'member' },
                create: { hubId, userId: user.id, status: 'active', role: 'member' }
            });

            return { success: true, message: "Joined hub successfully", status: 'member' };
        } else {
            // Waitlist / pending logic if full
            await prisma.joinRequest.upsert({
                where: { hubId_userId: { hubId, userId: user.id } },
                update: { status: 'pending', reviewedAt: null },
                create: { hubId, userId: user.id, status: 'pending' }
            });

            return { success: true, message: "Join request submitted", status: 'pending' };
        }
    }

    /**
     * Leaves a hub or cancels a request.
     */
    static async leaveHub(hubId: string, clerkUserId: string) {
        const user = await getOrCreateUser(clerkUserId);

        // Remove active member
        await prisma.hubMember.deleteMany({
            where: { hubId, userId: user.id }
        });

        // Cancel pending requests
        await prisma.joinRequest.deleteMany({
            where: { hubId, userId: user.id, status: 'pending' }
        });

        return { success: true, message: "Left hub successfully", status: 'none' };
    }

    /**
     * Creates a new physical hub and makes the creator an active member immediately.
     */
    static async createHub(courseId: string, clerkUserId: string, name: string) {
        const user = await getOrCreateUser(clerkUserId);

        const hub = await prisma.hub.create({
            data: {
                courseId,
                name
            }
        });

        await prisma.hubMember.create({
            data: {
                hubId: hub.id,
                userId: user.id
            }
        });

        return { success: true, message: "Hub created successfully", data: hub };
    }

    /**
     * Gets detailed information for a specific hub
     */
    static async getHubDetail(hubId: string, clerkUserId: string) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });

        const hub = await prisma.hub.findUnique({
            where: { id: hubId },
            include: {
                members: {
                    include: { user: true }
                },
                requests: true
            }
        });

        if (!hub) throw new Error("Hub not found");

        const activeMembers = hub.members.filter(m => m.status === 'active');

        let userStatus = 'none';
        if (user) {
            const isMember = activeMembers.some(m => m.userId === user.id);
            if (isMember) {
                userStatus = 'member';
            } else {
                const isPending = hub.requests.some(r => r.userId === user.id && r.status === 'pending');
                if (isPending) {
                    userStatus = 'pending';
                }
            }
        }

        return {
            id: hub.id,
            name: hub.name,
            courseId: hub.courseId,
            memberCount: activeMembers.length,
            members: activeMembers.map(m => ({
                id: m.user.id,
                name: m.user.name,
                role: m.role,
                major: m.user.major,
                year: m.user.year
            })),
            userStatus,
            createdAt: hub.createdAt
        };
    }

    static async getHubMessages(hubId: string, clerkUserId: string) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) throw new Error("User not found");

        const member = await prisma.hubMember.findFirst({
            where: { hubId, userId: user.id, status: 'active' }
        });
        if (!member) throw new Error("Unauthorized to view messages");

        const messages = await prisma.hubMessage.findMany({
            where: { hubId },
            include: { sender: true },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return messages.map(m => ({
            id: m.id,
            content: m.content,
            isMine: m.senderId === user.id,
            senderName: m.sender.name,
            createdAt: m.createdAt
        })).reverse();
    }

    static async sendHubMessage(hubId: string, clerkUserId: string, content: string) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) throw new Error("User not found");

        const member = await prisma.hubMember.findFirst({
            where: { hubId, userId: user.id, status: 'active' }
        });
        if (!member) throw new Error("Unauthorized to send messages");

        const message = await prisma.hubMessage.create({
            data: { hubId, senderId: user.id, content },
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

    static async getHubSessions(hubId: string) {
        const sessions = await prisma.hubSession.findMany({
            where: { hubId },
            include: { createdBy: true },
            orderBy: { scheduledAt: 'asc' }
        });

        return sessions.map(s => ({
            id: s.id,
            title: s.title,
            scheduledAt: s.scheduledAt,
            creatorName: s.createdBy.name
        }));
    }

    static async createHubSession(hubId: string, clerkUserId: string, title: string, scheduledAt: Date) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) throw new Error("User not found");

        const member = await prisma.hubMember.findFirst({
            where: { hubId, userId: user.id, status: 'active' }
        });
        if (!member) throw new Error("Unauthorized to create session");

        const session = await prisma.hubSession.create({
            data: {
                hubId,
                title,
                scheduledAt,
                createdById: user.id
            },
            include: { createdBy: true }
        });

        return {
            id: session.id,
            title: session.title,
            scheduledAt: session.scheduledAt,
            creatorName: session.createdBy.name
        };
    }
}

