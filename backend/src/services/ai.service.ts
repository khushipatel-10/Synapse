import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { EmbeddingService } from './embedding.service';

const prisma = new PrismaClient();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder'
});

export class AIService {
    /**
     * Creates a new AI study session for a user with the uploaded PDF details.
     */
    static async createSession(clerkUserId: string, courseId: string, pdfName?: string) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) throw new Error("User not found");

        const session = await prisma.aIStudySession.create({
            data: {
                userId: user.id,
                courseId,
                pdfName
            }
        });

        return session;
    }

    /**
     * Evaluates the active learning session into an AIScore and generates knowledge gaps.
     * This calls OpenAI with a structured prompt.
     */
    static async evaluateSession(sessionId: string, transcript: string) {
        const session = await prisma.aIStudySession.findUnique({ where: { id: sessionId } });
        if (!session) throw new Error("Session not found");

        const prompt = `
        You are an expert AI Learning Coach. Evaluate the following learning session transcript between a student and a tutor.
        Produce a JSON response containing precisely these keys:
        - "comprehensionScore": Integer from 0-100 representing the student's theoretical understanding.
        - "implementationScore": Integer from 0-100 representing the student's practical/coding ability.
        - "integrationScore": Integer from 0-100 representing the student's ability to connect concepts to broader architecture.
        - "conceptGaps": Array of 1-3 short string phrases explicitly identifying weaknesses (e.g. ["Recursive backtracking", "Graph traversal"]).

        Transcript:
        ${transcript}
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.2
        });

        const jsonStr = completion.choices[0].message.content;
        if (!jsonStr) throw new Error("Failed to generate AI evaluation");
        const parsed = JSON.parse(jsonStr);

        // Update the session to completed
        await prisma.aIStudySession.update({
            where: { id: sessionId },
            data: { status: 'completed', transcript }
        });

        // Save the score
        const score = await prisma.aIScore.create({
            data: {
                sessionId,
                comprehensionScore: parsed.comprehensionScore || 0,
                implementationScore: parsed.implementationScore || 0,
                integrationScore: parsed.integrationScore || 0,
                conceptGaps: parsed.conceptGaps || []
            }
        });

        // Trigger Vector Regeneration (Time decays and integrates the newly generated gaps)
        try {
            await EmbeddingService.regenerateEmbeddingForUserCourse(session.userId, session.courseId);
        } catch (e) {
            console.error("AI Coach Vector Regeneration Error:", e);
        }

        return score;
    }

    /**
     * Gets previous study sessions for a user
     */
    static async getUserSessions(clerkUserId: string, courseId: string) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) throw new Error("User not found");

        const sessions = await prisma.aIStudySession.findMany({
            where: { userId: user.id, courseId },
            include: { scores: true },
            orderBy: { createdAt: 'desc' }
        });

        return sessions;
    }
}
