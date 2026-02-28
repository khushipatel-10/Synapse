import { Router, Request, Response } from 'express';
import { SimilarityService } from '../services/similarity.service';

const router = Router();

// GET /similar-users/:userId/course/:courseId?k=5
router.get('/similar-users/:userId/course/:courseId', async (req: Request, res: Response) => {
    try {
        const { userId, courseId } = req.params;
        const k = parseInt((req.query.k as string) || '5', 10);

        const results = await SimilarityService.getSimilarUsers(userId, courseId, k);

        res.json({
            success: true,
            query: { userId, courseId, k },
            results
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /similarity/:userA/course/:courseId/user/:userB
router.get('/:userA/course/:courseId/user/:userB', async (req: Request, res: Response) => {
    try {
        const { userA, courseId, userB } = req.params;

        const result = await SimilarityService.getPairSimilarity(userA, userB, courseId);

        res.json({
            success: true,
            ...result
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
