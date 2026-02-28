import { Router, Request, Response } from 'express';
import { EmbeddingService } from '../services/embedding.service';

const router = Router();

// POST /embeddings/regenerate/user/:userId/course/:courseId
router.post('/regenerate/user/:userId/course/:courseId', async (req: Request, res: Response) => {
    try {
        const { userId, courseId } = req.params;
        const normalizedVector = await EmbeddingService.regenerateEmbeddingForUserCourse(userId, courseId);

        res.json({
            success: true,
            message: 'Embedding regenerated successfully',
            vector: normalizedVector
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /embeddings/regenerate/course/:courseId
router.post('/regenerate/course/:courseId', async (req: Request, res: Response) => {
    try {
        const { courseId } = req.params;
        const count = await EmbeddingService.regenerateEmbeddingsForCourse(courseId);

        res.json({
            success: true,
            message: `Successfully regenerated ${count} embeddings for course ${courseId}`
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /embeddings/:userId/course/:courseId
router.get('/:userId/course/:courseId', async (req: Request, res: Response) => {
    try {
        const { userId, courseId } = req.params;
        const embeddingData = await EmbeddingService.getEmbedding(userId, courseId);

        if (!embeddingData) {
            res.status(404).json({ success: false, message: 'Embedding not found' });
            return;
        }

        res.json({
            success: true,
            data: embeddingData
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
