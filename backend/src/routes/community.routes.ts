import { Router, Request, Response } from 'express';
import { CommunityService } from '../services/community.service';
import { MatchingService } from '../services/matching.service';
import { requireAuth } from '@clerk/express';

const router = Router();

// GET /community/hubs - List physical hubs and current user status
router.get('/hubs', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;

        if (!clerkUserId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const course = await prisma.course.findUnique({ where: { code: 'CS101' } });
        if (!course) return res.status(500).json({ success: false, message: 'Course not found' });

        const hubs = await CommunityService.getHubsForCourse(course.id, clerkUserId);
        res.json({ success: true, data: hubs });
    } catch (error: any) {
        console.error('Error fetching hubs:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// POST /community/hubs - Create a new hub
router.post('/hubs', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        const { name } = req.body;

        if (!clerkUserId || !name) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }

        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const course = await prisma.course.findUnique({ where: { code: 'CS101' } });
        if (!course) return res.status(500).json({ success: false, message: 'Course not found' });

        const result = await CommunityService.createHub(course.id, clerkUserId, name);
        res.json(result);
    } catch (error: any) {
        console.error('Error creating hub:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// POST /community/hubs/:hubId/join - Join a hub
router.post('/hubs/:hubId/join', requireAuth(), async (req: any, res: any) => {
    try {
        const { hubId } = req.params;
        const clerkUserId = req.auth.userId;

        if (!clerkUserId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const result = await CommunityService.joinHub(hubId, clerkUserId);
        res.json(result);
    } catch (error: any) {
        console.error('Error joining hub:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// POST /community/hubs/:hubId/leave - Leave a hub
router.post('/hubs/:hubId/leave', requireAuth(), async (req: any, res: any) => {
    try {
        const { hubId } = req.params;
        const clerkUserId = req.auth.userId;

        if (!clerkUserId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const result = await CommunityService.leaveHub(hubId, clerkUserId);
        res.json(result);
    } catch (error: any) {
        console.error('Error leaving hub:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// GET /community/hubs/:hubId - Get detailed hub views
router.get('/hubs/:hubId', requireAuth(), async (req: any, res: any) => {
    try {
        const { hubId } = req.params;
        const clerkUserId = req.auth.userId;

        if (!clerkUserId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const hubDetail = await CommunityService.getHubDetail(hubId, clerkUserId);
        res.json({ success: true, data: hubDetail });
    } catch (error: any) {
        console.error('Error fetching hub detail:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// GET /community/hubs/:hubId/messages
router.get('/hubs/:hubId/messages', requireAuth(), async (req: any, res: any) => {
    try {
        const { hubId } = req.params;
        const clerkUserId = req.auth.userId;
        const messages = await CommunityService.getHubMessages(hubId, clerkUserId);
        res.json({ success: true, data: messages });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /community/hubs/:hubId/message
router.post('/hubs/:hubId/message', requireAuth(), async (req: any, res: any) => {
    try {
        const { hubId } = req.params;
        const clerkUserId = req.auth.userId;
        const { content } = req.body;
        if (!content) return res.status(400).json({ success: false, message: "Missing content" });
        const message = await CommunityService.sendHubMessage(hubId, clerkUserId, content);
        res.json({ success: true, data: message });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /community/hubs/:hubId/sessions
router.get('/hubs/:hubId/sessions', requireAuth(), async (req: any, res: any) => {
    try {
        const { hubId } = req.params;
        const sessions = await CommunityService.getHubSessions(hubId);
        res.json({ success: true, data: sessions });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /community/hubs/:hubId/sessions
router.post('/hubs/:hubId/sessions', requireAuth(), async (req: any, res: any) => {
    try {
        const { hubId } = req.params;
        const clerkUserId = req.auth.userId;
        const { title, scheduledAt } = req.body;
        if (!title || !scheduledAt) return res.status(400).json({ success: false, message: "Missing fields" });
        const session = await CommunityService.createHubSession(hubId, clerkUserId, title, new Date(scheduledAt));
        res.json({ success: true, data: session });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});



export default router;
