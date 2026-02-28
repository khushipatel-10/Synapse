import { Router, Request, Response } from 'express';
import { NetworkService } from '../services/network.service';

const router = Router();

// POST /network/course/:courseId/snapshot/:weekIndex
router.post('/course/:courseId/snapshot/:weekIndex', async (req: Request, res: Response) => {
    try {
        const { courseId, weekIndex } = req.params;
        const topK = parseInt((req.query.topK as string) || '5', 10);
        const minScore = parseFloat((req.query.minScore as string) || '0.55');

        const result = await NetworkService.createSnapshot(courseId, parseInt(weekIndex, 10), topK, minScore);

        res.json({
            success: true,
            ...result
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /network/course/:courseId/snapshot/:weekIndex
router.get('/course/:courseId/snapshot/:weekIndex', async (req: Request, res: Response) => {
    try {
        const { courseId, weekIndex } = req.params;
        const wIdx = parseInt(weekIndex, 10);

        const nodes = await NetworkService.listSnapshotNodes(courseId, wIdx);
        const edges = await NetworkService.listSnapshotEdges(courseId, wIdx);

        res.json({
            success: true,
            courseId,
            weekIndex: wIdx,
            nodes,
            edges
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /network/course/:courseId/snapshots
router.get('/course/:courseId/snapshots', async (req: Request, res: Response) => {
    try {
        const { courseId } = req.params;
        const snapshots = await NetworkService.listSnapshots(courseId);
        res.json({ success: true, courseId, snapshots });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
