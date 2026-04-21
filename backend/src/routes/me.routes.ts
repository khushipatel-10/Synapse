import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@clerk/express';

const router = Router();
const prisma = new PrismaClient();

// GET /me - Fetch current user profile and preferences
router.get('/', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        if (!clerkUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        let user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    clerkId: clerkUserId,
                    name: 'Synapse Scholar',
                    email: null,
                    username: null,
                    major: 'Computer Science',
                    year: '',
                    availability: '[]'
                }
            });
        }

        const preferences = await prisma.userPreferences.findUnique({ where: { clerkUserId } });

        res.json({
            success: true,
            data: {
                ...user,
                preferences: {
                    pace: preferences?.studyPace || '',
                    mode: preferences?.studyMode || '',
                    groupSize: preferences?.preferredGroupSize || '',
                    offlineOrOnline: preferences?.offlineOrOnline || '',
                    timezone: preferences?.timezone || '',
                    materialPreferred: preferences?.materialPreferred || ''
                }
            }
        });
    } catch (error: any) {
        console.error('Error fetching /me:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// POST /me - Update name, email, username, major, year
router.post('/', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        if (!clerkUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const { name, email, username, major, year } = req.body;

        // Username uniqueness check
        if (username) {
            const existing = await prisma.user.findUnique({ where: { username } });
            if (existing && existing.clerkId !== clerkUserId) {
                return res.status(409).json({ success: false, message: 'Username already taken' });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { clerkId: clerkUserId },
            data: {
                ...(name && { name }),
                ...(email !== undefined && { email }),
                ...(username !== undefined && { username: username || null }),
                ...(major && { major }),
                ...(year && { year })
            }
        });

        res.json({ success: true, data: updatedUser });
    } catch (error: any) {
        console.error('Error updating /me:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// GET /me/preferences
router.get('/preferences', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.query.clerkId || req.auth.userId;
        const prefs = await prisma.userPreferences.findUnique({ where: { clerkUserId } });
        return res.json({ success: true, data: prefs });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

// POST/PUT /me/preferences
const handlePreferences = async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        const body = req.body;
        if (!clerkUserId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        // Username uniqueness check
        if (body.username) {
            const existing = await prisma.user.findUnique({ where: { username: body.username } });
            if (existing && existing.clerkId !== clerkUserId) {
                return res.status(409).json({ success: false, error: 'Username already taken' });
            }
        }

        await prisma.user.upsert({
            where: { clerkId: clerkUserId },
            update: {
                ...(body.major && { major: body.major }),
                ...(body.clerkUserName && { name: body.clerkUserName }),
                ...(body.email !== undefined && { email: body.email }),
                ...(body.username !== undefined && { username: body.username || null })
            },
            create: {
                clerkId: clerkUserId,
                name: body.clerkUserName || 'Synapse Scholar',
                email: body.email || null,
                username: body.username || null,
                major: body.major || '',
                year: '',
                availability: '[]'
            }
        });

        const prefsToUpdate = {
            studyPace: body.preferences?.pace || 'medium',
            studyMode: body.preferences?.mode || 'mixed',
            learningStyle: 'mixed',
            goal: 'learn',
            subjectInterests: body.major ? [body.major] : [],
            preferredGroupSize: body.preferences?.groupSize || 'small',
            availability: null,
            offlineOrOnline: body.preferences?.offlineOrOnline || 'online',
            timezone: body.preferences?.timezone || 'UTC',
            materialPreferred: body.preferences?.materialPreferred || 'mixed'
        };

        const { PreferenceService } = await import('../services/preference.service');
        const userPrefs = await PreferenceService.upsertPreferences(clerkUserId, prefsToUpdate, body.clerkUserName);

        return res.json({ success: true, data: userPrefs });
    } catch (error: any) {
        console.error('Error saving preferences data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

router.post('/preferences', requireAuth(), handlePreferences);
router.put('/preferences', requireAuth(), handlePreferences);
router.post('/onboarding', requireAuth(), handlePreferences);

// GET /me/onboarding — check if user has completed onboarding
router.get('/onboarding', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        if (!clerkUserId) return res.status(401).json({ success: false });

        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        const prefs = user ? await prisma.userPreferences.findUnique({ where: { clerkUserId } }) : null;

        res.json({
            success: true,
            data: {
                userExists: !!user,
                preferencesHasBeenSet: !!(prefs?.studyMode && prefs?.studyPace)
            }
        });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /me/notifications — counts + thread data for client-side unread computation
router.get('/notifications', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        if (!clerkUserId) return res.status(401).json({ success: false });

        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) return res.json({ success: true, data: { pendingConnections: 0, myUserId: '', threads: [] } });

        const [pendingConnections, threads] = await Promise.all([
            prisma.peerConnection.count({ where: { receiverUserId: user.id, status: 'pending' } }),
            prisma.messageThread.findMany({
                where: { participants: { some: { userId: user.id } } },
                include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } }
            })
        ]);

        const threadData = threads
            .filter(t => t.messages.length > 0)
            .map(t => ({
                id: t.id,
                lastMessageAt: t.messages[0].createdAt,
                lastSenderId: t.messages[0].senderId
            }));

        res.json({ success: true, data: { pendingConnections, myUserId: user.id, threads: threadData } });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

export default router;
