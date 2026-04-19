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
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
    defaultHeaders: {
        'HTTP-Referer': 'https://synapse.app',
        'X-Title': 'Synapse Learning Platform'
    }
});

const chatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { success: false, message: 'Too many requests, please try again later.' }
});

// POST /learn/upload — Parse PDF, store text in session, initialize coaching session
router.post('/upload', requireAuth(), upload.single('file'), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        const file = req.file;

        if (!clerkUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        const parseFn = typeof pdfParse === 'function' ? pdfParse : (pdfParse.default || pdfParse);
        const pdfData = await parseFn(file.buffer);
        const pdfText = pdfData.text as string;

        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const course = await prisma.course.findUnique({ where: { code: 'CS101' } });
        if (!course) return res.status(500).json({ success: false, message: 'Course not found' });

        const session = await AIService.createSession(clerkUserId, course.id, file.originalname, pdfText);

        res.json({
            success: true,
            data: {
                sessionId: session.id,
                pdfName: session.pdfName
            }
        });
    } catch (e: any) {
        console.error("PDF Parsing Error:", e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// POST /learn/chat — Socratic chat with server-controlled system prompt
// Accepts { sessionId, message } — the backend owns the prompt and history
router.post('/chat', requireAuth(), chatLimiter, async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        const { sessionId, message } = req.body;

        if (!clerkUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        if (!sessionId || !message?.trim()) {
            return res.status(400).json({ success: false, message: 'sessionId and message are required' });
        }

        // Build the full messages array with Socratic system prompt server-side
        const { apiMessages } = await AIService.buildChatMessages(sessionId, message.trim());

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = await openai.chat.completions.create({
            model: "openai/gpt-4o",
            messages: apiMessages,
            stream: true,
            temperature: 0.7
        });

        let assistantContent = '';
        for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
                assistantContent += text;
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
        }

        // Persist the assistant's full response to the session after streaming
        await AIService.saveAssistantMessage(sessionId, assistantContent);

        res.write(`data: [DONE]\n\n`);
        res.end();
    } catch (e: any) {
        console.error("Chat Stream Error:", e);
        res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
        res.end();
    }
});

// GET /learn/sessions — List past sessions
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

// GET /learn/:sessionId — Get a specific session with its message history (for resuming)
router.get('/:sessionId', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        const { sessionId } = req.params;
        if (!clerkUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const session = await AIService.getSession(sessionId, clerkUserId);
        res.json({ success: true, data: session });
    } catch (e: any) {
        console.error("Get Session Error:", e);
        res.status(e.message === 'Unauthorized' ? 403 : 500).json({ success: false, message: e.message });
    }
});

// POST /learn/:sessionId/evaluate — Score session + update learning embeddings
router.post('/:sessionId/evaluate', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        const { sessionId } = req.params;
        if (!clerkUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const score = await AIService.evaluateSession(sessionId);
        res.json({ success: true, data: score });
    } catch (e: any) {
        console.error("Evaluation Error:", e);
        res.status(500).json({ success: false, message: e.message });
    }
});

export default router;
