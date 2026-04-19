import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@clerk/express';

const router = Router();
const prisma = new PrismaClient();

// GET /users/search?q=<username_or_name>
// Returns matching users with their connection status relative to the requesting user
router.get('/search', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        const q = (req.query.q as string || '').trim();
        if (!clerkUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        if (!q || q.length < 2) return res.json({ success: true, data: [] });

        const me = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!me) return res.status(404).json({ success: false, message: 'User not found' });

        const course = await prisma.course.findUnique({ where: { code: 'CS101' } });
        if (!course) return res.status(500).json({ success: false, message: 'Course not found' });

        // Search by username (exact prefix) or name (contains)
        const users = await prisma.user.findMany({
            where: {
                id: { not: me.id },
                clerkId: { not: { startsWith: 'demo_' } }, // only real users searchable by username
                OR: [
                    { username: { startsWith: q, mode: 'insensitive' } },
                    { name: { contains: q, mode: 'insensitive' } }
                ]
            },
            select: { id: true, name: true, username: true, major: true, year: true },
            take: 10
        });

        // Get existing connection status for each result
        const connections = await prisma.peerConnection.findMany({
            where: {
                courseId: course.id,
                OR: [
                    { requesterUserId: me.id, receiverUserId: { in: users.map(u => u.id) } },
                    { receiverUserId: me.id, requesterUserId: { in: users.map(u => u.id) } }
                ]
            }
        });

        const connMap = new Map(connections.map(c => {
            const peerId = c.requesterUserId === me.id ? c.receiverUserId : c.requesterUserId;
            return [peerId, { status: c.status, isRequester: c.requesterUserId === me.id, connectionId: c.id }];
        }));

        const results = users.map(u => ({
            ...u,
            connection: connMap.get(u.id) || null
        }));

        res.json({ success: true, data: results });
    } catch (error: any) {
        console.error('Error searching users:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
