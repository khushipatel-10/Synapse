import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import multer from 'multer';
import { AIService } from '../services/ai.service';
import OpenAI from 'openai';
import rateLimit from 'express-rate-limit';

const pdfParse = require('pdf-parse');

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder'
});

const chatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per windowMs
    message: { success: false, message: 'Too many requests, please try again later.' }
});

// POST /learn/upload - Upload a PDF, parse text, and initialize a session
router.post('/upload', requireAuth(), upload.single('file'), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        const file = req.file;

        if (!clerkUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        // Parse PDF
        const parseFn = typeof pdfParse === 'function' ? pdfParse : (pdfParse.default || pdfParse);
        const pdfData = await parseFn(file.buffer);
        const textContent = pdfData.text;

        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const course = await prisma.course.findUnique({ where: { code: 'CS101' } });
        if (!course) return res.status(500).json({ success: false, message: 'Course not found' });

        // Create Session
        const session = await AIService.createSession(clerkUserId, course.id, file.originalname);

        res.json({
            success: true,
            data: {
                sessionId: session.id,
                pdfText: textContent
            }
        });
    } catch (e: any) {
        console.error("PDF Parsing Error:", e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// POST /learn/chat - Stream chat completions
router.post('/chat', requireAuth(), chatLimiter, async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        const { messages } = req.body;

        if (!clerkUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        if (!messages || !Array.isArray(messages)) return res.status(400).json({ success: false, message: 'Invalid messages array' });

        // We use SSE for streaming.
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
            stream: true,
            temperature: 0.7
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
            }
        }

        res.write(`data: [DONE]\n\n`);
        res.end();
    } catch (e: any) {
        console.error("Chat Stream Error:", e);
        res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
        res.end();
    }
});

// POST /learn/:sessionId/evaluate - Close out session and generate score
router.post('/:sessionId/evaluate', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        const { sessionId } = req.params;
        const { transcript } = req.body; // Pass the entire chat history

        if (!clerkUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const score = await AIService.evaluateSession(sessionId, transcript);
        res.json({ success: true, data: score });
    } catch (e: any) {
        console.error("Evaluation Error:", e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// GET /learn/sessions - List past sessions
router.get('/sessions', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        if (!clerkUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const course = await prisma.course.findUnique({ where: { code: 'CS101' } });
        if (!course) return res.status(500).json({ success: false, message: 'Course not found' });

        const sessions = await AIService.getUserSessions(clerkUserId, course.id);
        res.json({ success: true, data: sessions });
    } catch (e: any) {
        console.error("Fetch Sessions Error:", e);
        res.status(500).json({ success: false, message: e.message });
    }
});

export default router;
