import { Router, Request, Response } from 'express';
import { MatchingService } from '../services/matching.service';
import { PreferenceService } from '../services/preference.service';
import { requireAuth } from '@clerk/express';

const router = Router();

// GET /recommendations/me
router.get('/me', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkId = req.auth.userId;

        if (!clerkId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        // Dynamically find the CS101 course to avoid hardcoded UUIDs
        const course = await prisma.course.findUnique({ where: { code: 'CS101' } });
        if (!course) {
            return res.status(500).json({ success: false, error: 'Default Course CS101 not found' });
        }
        const courseId = course.id;

        let prefs = await PreferenceService.getPreferences(clerkId);
        if (!prefs) {
            // Use neutral defaults so matching still works without onboarding
            prefs = {
                clerkUserId: clerkId, studyPace: 'moderate', studyMode: 'hybrid',
                learningStyle: 'mixed', goal: 'mastery', subjectInterests: [],
                preferredGroupSize: 'small', offlineOrOnline: 'online',
                timezone: 'UTC', materialPreferred: 'mixed'
            } as any;
        }

        // Leveraging existing backend architecture
        const topPairs = await MatchingService.buildPersonalizedRecommendations(clerkId, courseId, prefs);

        // Fetch joinable hubs (with user status natively injected)
        const { CommunityService } = await import('../services/community.service');
        const hubs = await CommunityService.getHubsForCourse(courseId, clerkId);

        const firstAttempt = await prisma.assessmentAttempt.findFirst({
            where: { clerkUserId: clerkId }
        });

        res.json({
            success: true,
            courseId,
            data: {
                topPairs,
                hubs,
                hasAssessment: !!firstAttempt
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
