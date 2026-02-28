import { Router, Request, Response } from 'express';
import { MatchingService } from '../services/matching.service';

const router = Router();

// GET /matching/course/:courseId/pairs
router.get('/course/:courseId/pairs', async (req: Request, res: Response) => {
    try {
        const { courseId } = req.params;
        const result = await MatchingService.buildPairs(courseId);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /matching/course/:courseId/hubs
router.get('/course/:courseId/hubs', async (req: Request, res: Response) => {
    try {
        const { courseId } = req.params;
        const result = await MatchingService.buildHubs(courseId);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
