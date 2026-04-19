import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { EmbeddingService } from './embedding.service';

const prisma = new PrismaClient();
const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
    defaultHeaders: {
        'HTTP-Referer': 'https://synapse.app',
        'X-Title': 'Synapse Learning Platform'
    }
});

// Socratic system prompt injected server-side — cannot be bypassed by the client
function buildSocraticSystemPrompt(pdfText: string): string {
    return `You are Synapse Coach, an expert AI learning tutor. A student has shared the following course material with you:

"""
${pdfText.slice(0, 12000)}
"""

Your core coaching philosophy is SOCRATIC — you must NEVER give direct answers on the first ask. Follow these rules strictly:

1. HINTS FIRST: When a student asks a question or struggles with a concept, respond with a guiding question or hint that leads them toward the answer. Example: if asked "What is a binary search tree?", respond with "What properties do you think a tree structure would need for efficient searching?"

2. PROGRESSIVE REVELATION: If the student still struggles after 1-2 hints, give a partial answer and ask them to complete it. Only give the full answer after at least 2 genuine attempts.

3. PROBE UNDERSTANDING: After any explanation (yours or theirs), always ask a follow-up question to check understanding. Example: "Can you explain why that matters in this context?"

4. IDENTIFY GAPS: When you notice the student is confused about a concept, acknowledge it explicitly: "I notice you're uncertain about [X]. Let's focus there."

5. ENCOURAGE EFFORT: Praise attempts even if wrong. "Good thinking! That's close — what happens if we consider [Y]?"

6. NEVER just say "The answer is X" without first asking the student to attempt it.

Remember: Your goal is to develop the student's thinking ability, not just transfer information. Be warm, patient, and encouraging.`;
}

export class AIService {
    /**
     * Creates a new AI study session for a user with the uploaded PDF details.
     */
    static async createSession(clerkUserId: string, courseId: string, pdfName?: string, pdfText?: string) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) throw new Error("User not found");

        const session = await prisma.aIStudySession.create({
            data: {
                userId: user.id,
                courseId,
                pdfName,
                ...(pdfText !== undefined && { pdfText } as any),
                messages: [] as any
            } as any
        });

        return session;
    }

    /**
     * Returns a session with its messages, verifying it belongs to the requesting user.
     */
    static async getSession(sessionId: string, clerkUserId: string) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) throw new Error("User not found");

        const session = await prisma.aIStudySession.findUnique({
            where: { id: sessionId },
            include: { scores: true }
        });

        if (!session) throw new Error("Session not found");
        if (session.userId !== user.id) throw new Error("Unauthorized");

        return session;
    }

    /**
     * Appends a message to the session's stored message array.
     */
    static async appendMessage(sessionId: string, message: { role: string; content: string }) {
        const session = await prisma.aIStudySession.findUnique({ where: { id: sessionId } });
        if (!session) throw new Error("Session not found");

        const sessionAny = session as any;
        const existing = Array.isArray(sessionAny.messages) ? (sessionAny.messages as any[]) : [];
        const updated = [...existing, message];

        await prisma.aIStudySession.update({
            where: { id: sessionId },
            data: { messages: updated } as any
        });

        return updated;
    }

    /**
     * Builds the full OpenAI messages array for a session (system prompt + history + new user message).
     * Returns the messages ready for the OpenAI API and the updated stored messages.
     */
    static async buildChatMessages(
        sessionId: string,
        userMessage: string
    ): Promise<{ apiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>; storedMessages: any[] }> {
        const session = await prisma.aIStudySession.findUnique({ where: { id: sessionId } });
        if (!session) throw new Error("Session not found");
        if (session.status === 'completed') throw new Error("Session is already completed. Start a new session.");

        const sessionAny = session as any;
        const pdfText = sessionAny.pdfText || "No document content available.";
        const systemPrompt = buildSocraticSystemPrompt(pdfText);

        const history = Array.isArray(sessionAny.messages) ? (sessionAny.messages as any[]) : [];
        const newUserMessage = { role: 'user', content: userMessage };

        const apiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
            { role: 'system', content: systemPrompt },
            ...history.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
            { role: 'user', content: userMessage }
        ];

        // Save user message to DB now (assistant message saved after streaming completes)
        const updated = [...history, newUserMessage];
        await prisma.aIStudySession.update({
            where: { id: sessionId },
            data: { messages: updated } as any
        });

        return { apiMessages, storedMessages: updated };
    }

    /**
     * Saves the assistant's response to the session after streaming completes.
     */
    static async saveAssistantMessage(sessionId: string, content: string) {
        const session = await prisma.aIStudySession.findUnique({ where: { id: sessionId } });
        if (!session) return;

        const sessionAny = session as any;
        const history = Array.isArray(sessionAny.messages) ? (sessionAny.messages as any[]) : [];
        const updated = [...history, { role: 'assistant', content }];

        await prisma.aIStudySession.update({
            where: { id: sessionId },
            data: { messages: updated } as any
        });
    }

    /**
     * Evaluates the active learning session into an AIScore, updates LearningState,
     * and triggers embedding regeneration.
     */
    static async evaluateSession(sessionId: string, transcript?: string) {
        const session = await prisma.aIStudySession.findUnique({ where: { id: sessionId } });
        if (!session) throw new Error("Session not found");

        // Build transcript from stored messages if not explicitly provided
        const storedMessages = Array.isArray((session as any).messages) ? ((session as any).messages as any[]) : [];
        const finalTranscript = transcript
            || storedMessages.map((m: any) => `${m.role}: ${m.content}`).join('\n\n');

        if (!finalTranscript.trim()) {
            throw new Error("No conversation to evaluate. Have a chat session first.");
        }

        const evaluationPrompt = `You are an expert AI Learning Coach evaluating a Socratic tutoring session transcript.

Analyze how the student performed. Pay special attention to:
- Did the student answer questions independently or always need the answer given?
- Did the student build on hints effectively?
- Which concepts showed strong understanding vs confusion?

Produce a JSON response with exactly these keys:
- "comprehensionScore": Integer 0-100. How well does the student understand the theoretical concepts?
- "implementationScore": Integer 0-100. Can the student apply concepts practically?
- "integrationScore": Integer 0-100. Can the student connect concepts to broader context?
- "hintDependencyScore": Integer 0-100. How dependent on hints was the student? (0 = fully independent, 100 = needed every answer given). This should REDUCE the other scores if high.
- "conceptGaps": Array of 1-5 short strings identifying specific weak concepts (e.g. ["Recursive backtracking", "Time complexity analysis"]).
- "strongConcepts": Array of 1-3 short strings identifying concepts the student demonstrated strong understanding of.
- "coachFeedback": One sentence of encouraging, actionable feedback for the student.

Transcript:
${finalTranscript}`;

        const completion = await openai.chat.completions.create({
            model: "openai/gpt-4o",
            messages: [{ role: "system", content: evaluationPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.2
        });

        const jsonStr = completion.choices[0].message.content;
        if (!jsonStr) throw new Error("Failed to generate AI evaluation");
        const parsed = JSON.parse(jsonStr);

        // Apply hint dependency penalty
        const hintPenalty = (parsed.hintDependencyScore || 0) * 0.15;
        const adjustedComprehension = Math.max(0, Math.round((parsed.comprehensionScore || 0) - hintPenalty));
        const adjustedImplementation = Math.max(0, Math.round((parsed.implementationScore || 0) - hintPenalty));
        const adjustedIntegration = Math.max(0, Math.round((parsed.integrationScore || 0) - hintPenalty));

        // Mark session completed and store transcript
        await prisma.aIStudySession.update({
            where: { id: sessionId },
            data: { status: 'completed', transcript: finalTranscript }
        });

        // Save the score
        const score = await prisma.aIScore.create({
            data: {
                sessionId,
                comprehensionScore: adjustedComprehension,
                implementationScore: adjustedImplementation,
                integrationScore: adjustedIntegration,
                conceptGaps: parsed.conceptGaps || []
            }
        });

        // Update LearningState and ConceptPerformance to reflect what was learned
        await AIService.updateLearningStateFromScore(session.userId, session.courseId, {
            comprehensionScore: adjustedComprehension,
            implementationScore: adjustedImplementation,
            integrationScore: adjustedIntegration,
            hintDependencyScore: parsed.hintDependencyScore || 0,
            conceptGaps: parsed.conceptGaps || [],
            strongConcepts: parsed.strongConcepts || []
        });

        // Trigger embedding regeneration with updated LearningState
        try {
            await EmbeddingService.regenerateEmbeddingForUserCourse(session.userId, session.courseId);
        } catch (e) {
            console.error("AI Coach Vector Regeneration Error:", e);
        }

        return {
            ...score,
            coachFeedback: parsed.coachFeedback || "Keep practicing!",
            hintDependencyScore: parsed.hintDependencyScore || 0
        };
    }

    /**
     * Updates the user's LearningState and ConceptPerformance based on an AI evaluation result.
     * This is what makes embedding updates "knowledge-based" — the AI session directly
     * modifies the student's academic profile.
     */
    private static async updateLearningStateFromScore(
        userId: string,
        courseId: string,
        scores: {
            comprehensionScore: number;
            implementationScore: number;
            integrationScore: number;
            hintDependencyScore: number;
            conceptGaps: string[];
            strongConcepts: string[];
        }
    ) {
        const learningState = await prisma.learningState.findFirst({ where: { userId, courseId } });
        if (!learningState) return;

        const normalizedHintDependency = scores.hintDependencyScore / 100;

        // confidenceAi reflects how the AI assessed the student (weighted blend)
        const newConfidenceAi = learningState.confidenceAi * 0.6 + scores.comprehensionScore * 0.4;

        // frustrationIndex increases if hint dependency is high (student struggled)
        const newFrustrationIndex = Math.min(1, learningState.frustrationIndex * 0.7 + normalizedHintDependency * 0.3);

        // improvementRate: positive if this session score > previous averageScore
        const sessionAvgScore = (scores.comprehensionScore + scores.implementationScore + scores.integrationScore) / 3;
        const improvement = sessionAvgScore - learningState.averageScore;
        const newImprovementRate = learningState.improvementRate * 0.6 + improvement * 0.4;

        // Update ConceptPerformance for identified gaps (lower mastery slightly)
        for (const gap of scores.conceptGaps) {
            await prisma.conceptPerformance.updateMany({
                where: {
                    userId,
                    courseId,
                    conceptName: { contains: gap.split(' ')[0], mode: 'insensitive' }
                },
                data: {
                    masteryScore: { decrement: 8 },
                    attempts: { increment: 1 },
                    lastPracticed: new Date()
                }
            });
        }

        // Update ConceptPerformance for strong concepts (raise mastery slightly)
        for (const strong of scores.strongConcepts) {
            await prisma.conceptPerformance.updateMany({
                where: {
                    userId,
                    courseId,
                    conceptName: { contains: strong.split(' ')[0], mode: 'insensitive' }
                },
                data: {
                    masteryScore: { increment: 5 },
                    attempts: { increment: 1 },
                    lastPracticed: new Date()
                }
            });
        }

        // Clamp mastery scores to [0, 100]
        await prisma.$executeRaw`
            UPDATE "ConceptPerformance"
            SET "masteryScore" = GREATEST(0, LEAST(100, "masteryScore"))
            WHERE "userId" = ${userId} AND "courseId" = ${courseId}
        `;

        // Recalculate averageScore from updated ConceptPerformance
        const performances = await prisma.conceptPerformance.findMany({
            where: { userId, courseId }
        });
        const newAvgScore = performances.length > 0
            ? performances.reduce((sum, p) => sum + p.masteryScore, 0) / performances.length
            : learningState.averageScore;

        // conceptEntropy: higher when concept performance is more uneven
        const mean = newAvgScore;
        const variance = performances.length > 1
            ? performances.reduce((sum, p) => sum + Math.pow(p.masteryScore - mean, 2), 0) / performances.length
            : 0;
        const newConceptEntropy = Math.min(1, Math.sqrt(variance) / 50);

        // textSuccessScore improves with comprehension (text-based material was the PDF)
        const newTextSuccessScore = Math.min(100, learningState.textSuccessScore * 0.7 + scores.comprehensionScore * 0.3);

        await prisma.learningState.update({
            where: { id: learningState.id },
            data: {
                confidenceAi: Math.round(newConfidenceAi * 10) / 10,
                frustrationIndex: Math.round(newFrustrationIndex * 1000) / 1000,
                improvementRate: Math.round(newImprovementRate * 100) / 100,
                averageScore: Math.round(newAvgScore * 10) / 10,
                conceptEntropy: Math.round(newConceptEntropy * 1000) / 1000,
                textSuccessScore: Math.round(newTextSuccessScore * 10) / 10,
                lastUpdated: new Date()
            }
        });
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
