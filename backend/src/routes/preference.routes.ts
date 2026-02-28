import { Router, Request, Response } from 'express';
import { PreferenceService } from '../services/preference.service';

const router = Router();

// GET /me/preferences?clerkId=...
router.get('/', async (req: Request, res: Response) => {
    try {
        const clerkId = req.query.clerkId as string;
        if (!clerkId) {
            return res.status(400).json({ success: false, error: 'clerkId is required' });
        }
        const prefs = await PreferenceService.getPreferences(clerkId);
        res.json({ success: true, data: prefs });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST & PUT /me/preferences
router.post('/', async (req: Request, res: Response) => {
    try {
        const clerkId = req.body.clerkId;
        if (!clerkId) {
            return res.status(400).json({ success: false, error: 'clerkId is required' });
        }
        const updated = await PreferenceService.upsertPreferences(clerkId, req.body);
        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/', async (req: Request, res: Response) => {
    try {
        const clerkId = req.body.clerkId;
        if (!clerkId) {
            return res.status(400).json({ success: false, error: 'clerkId is required' });
        }
        const updated = await PreferenceService.upsertPreferences(clerkId, req.body);
        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
