import { Router } from 'express';
import { ConnectionService } from '../services/connection.service';
import { requireAuth } from '@clerk/express';

const router = Router();

// GET /connections
router.get('/', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;

        if (!clerkUserId) {
            return res.status(400).json({ success: false, message: 'Unauthorized' });
        }

        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const course = await prisma.course.findUnique({ where: { code: 'CS101' } });
        if (!course) return res.status(500).json({ success: false, message: 'Course not found' });

        const connections = await ConnectionService.getUserConnections(clerkUserId, course.id);
        res.json({ success: true, data: connections });
    } catch (error: any) {
        console.error('Error fetching connections:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// POST /connections/request
router.post('/request', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        const { receiverId } = req.body;

        if (!clerkUserId || !receiverId) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const course = await prisma.course.findUnique({ where: { code: 'CS101' } });
        if (!course) return res.status(500).json({ success: false, message: 'Course not found' });

        const result = await ConnectionService.requestConnection(clerkUserId, receiverId, course.id);
        res.json(result);
    } catch (error: any) {
        console.error('Error requesting connection:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// POST /connections/request/withdraw
router.post('/request/withdraw', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        const { receiverId } = req.body;

        if (!clerkUserId || !receiverId) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const course = await prisma.course.findUnique({ where: { code: 'CS101' } });
        if (!course) return res.status(500).json({ success: false, message: 'Course not found' });

        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) return res.status(404).json({ success: false });

        await prisma.peerConnection.deleteMany({
            where: {
                requesterUserId: user.id,
                receiverUserId: receiverId,
                courseId: course.id,
                status: 'pending'
            }
        });

        res.json({ success: true, message: 'Connection request withdrawn' });
    } catch (error: any) {
        console.error('Error withdrawing connection:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// POST /connections/:connectionId/accept
router.post('/:connectionId/accept', requireAuth(), async (req: any, res: any) => {
    try {
        const { connectionId } = req.params;
        const clerkUserId = req.auth.userId;

        const result = await ConnectionService.acceptConnection(connectionId, clerkUserId);
        res.json(result);
    } catch (error: any) {
        console.error('Error accepting connection:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// POST /connections/:connectionId/reject
router.post('/:connectionId/reject', requireAuth(), async (req: any, res: any) => {
    try {
        const { connectionId } = req.params;
        const clerkUserId = req.auth.userId;

        const result = await ConnectionService.rejectConnection(connectionId, clerkUserId);
        res.json(result);
    } catch (error: any) {
        console.error('Error rejecting connection:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

export default router;
