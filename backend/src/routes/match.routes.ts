import { Router, Request, Response } from 'express';
import { ComplementarityService } from '../services/complementarity.service';

const router = Router();

// GET /match-score/:userA/course/:courseId/user/:userB
router.get('/:userA/course/:courseId/user/:userB', async (req: Request, res: Response) => {
    try {
        const { userA, courseId, userB } = req.params;

        if (userA === userB) {
            res.status(400).json({ success: false, message: 'Users must be different' });
            return;
        }

        const matchData = await ComplementarityService.computeMatchScore(userA, userB, courseId);

        res.json({
            success: true,
            userA,
            userB,
            courseId,
            ...matchData
        });

    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
