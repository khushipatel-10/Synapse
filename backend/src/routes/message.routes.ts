import { Router } from 'express';
import { MessageService } from '../services/message.service';
import { requireAuth } from '@clerk/express';

const router = Router();

// POST /messages/thread - create or get thread
router.post('/thread', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        const { receiverId } = req.body;
        if (!clerkUserId || !receiverId) return res.status(400).json({ success: false, message: 'Missing fields' });

        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const course = await prisma.course.findUnique({ where: { code: 'CS101' } });
        if (!course) return res.status(500).json({ success: false, message: 'Course not found' });

        const result = await MessageService.startThread(clerkUserId, receiverId, course.id);
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// GET /messages/threads
router.get('/threads', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        if (!clerkUserId) return res.status(400).json({ success: false, message: 'Missing fields' });

        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const course = await prisma.course.findUnique({ where: { code: 'CS101' } });
        if (!course) return res.status(500).json({ success: false, message: 'Course not found' });

        const data = await MessageService.getUserThreads(clerkUserId, course.id);
        res.json({ success: true, data });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// GET /messages/thread/:threadId
router.get('/thread/:threadId', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        const { threadId } = req.params;

        const data = await MessageService.getThreadMessages(threadId, clerkUserId);
        res.json({ success: true, data });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// POST /messages/thread/:threadId/send
router.post('/thread/:threadId/send', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        const { threadId } = req.params;
        const { content } = req.body;

        if (!content) return res.status(400).json({ success: false, message: 'Missing content' });

        const data = await MessageService.sendMessage(threadId, clerkUserId, content);
        res.json({ success: true, data });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
});

export default router;
