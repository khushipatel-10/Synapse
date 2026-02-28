import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ConnectionService {

    static async requestConnection(requesterClerkId: string, receiverId: string, courseId: string) {
        const requester = await prisma.user.findUnique({ where: { clerkId: requesterClerkId } });
        if (!requester) throw new Error("Requester not found");

        // Check if connection already exists
        const existing = await prisma.peerConnection.findFirst({
            where: {
                courseId,
                OR: [
                    { requesterUserId: requester.id, receiverUserId: receiverId },
                    { requesterUserId: receiverId, receiverUserId: requester.id }
                ]
            }
        });

        if (existing) {
            return { success: true, connection: existing, message: "Connection already exists" };
        }

        const connection = await prisma.peerConnection.create({
            data: {
                requesterUserId: requester.id,
                receiverUserId: receiverId,
                courseId,
                status: 'pending'
            }
        });

        return { success: true, connection };
    }

    static async getUserConnections(clerkUserId: string, courseId: string) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) throw new Error("User not found");

        const connections = await prisma.peerConnection.findMany({
            where: {
                courseId,
                OR: [
                    { requesterUserId: user.id },
                    { receiverUserId: user.id }
                ]
            },
            include: {
                requester: true,
                receiver: true
            }
        });

        return connections.map(conn => {
            const isRequester = conn.requesterUserId === user.id;
            const peer = isRequester ? conn.receiver : conn.requester;
            return {
                id: conn.id,
                status: conn.status,
                isRequester,
                createdAt: conn.createdAt,
                peer: {
                    id: peer.id,
                    name: peer.name,
                    major: peer.major
                }
            };
        });
    }

    static async acceptConnection(connectionId: string, clerkUserId: string) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) throw new Error("User not found");

        const connection = await prisma.peerConnection.findUnique({ where: { id: connectionId } });
        if (!connection) throw new Error("Connection not found");

        if (connection.receiverUserId !== user.id) {
            throw new Error("Only the receiver can accept the connection");
        }

        const updated = await prisma.peerConnection.update({
            where: { id: connectionId },
            data: { status: 'accepted' }
        });

        return { success: true, connection: updated };
    }

    static async rejectConnection(connectionId: string, clerkUserId: string) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) throw new Error("User not found");

        const connection = await prisma.peerConnection.findUnique({ where: { id: connectionId } });
        if (!connection) throw new Error("Connection not found");

        if (connection.receiverUserId !== user.id && connection.requesterUserId !== user.id) {
            throw new Error("Not authorized to reject this connection");
        }

        const updated = await prisma.peerConnection.update({
            where: { id: connectionId },
            data: { status: 'rejected' }
        });

        return { success: true, connection: updated };
    }
}
