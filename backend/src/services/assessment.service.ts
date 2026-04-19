import { PrismaClient } from '@prisma/client';
import { EmbeddingService } from './embedding.service';

const prisma = new PrismaClient();

export class AssessmentService {
    static async getAssessments() {
        return prisma.assessment.findMany({
            select: {
                id: true,
                subject: true,
                title: true,
                description: true,
                createdAt: true,
                _count: { select: { questions: true } }
            }
        });
    }

    static async getAssessmentById(assessmentId: string) {
        return prisma.assessment.findUnique({
            where: { id: assessmentId },
            include: {
                questions: {
                    select: { id: true, questionText: true, options: true, conceptName: true, difficulty: true }
                }
            }
        });
    }

    static async submitAssessment(
        clerkUserId: string,
        assessmentId: string,
        submission: { questionId: string; selectedAnswer: string }[]
    ) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) throw new Error("User not found");

        const assessment = await prisma.assessment.findUnique({
            where: { id: assessmentId },
            include: { questions: true }
        });
        if (!assessment) throw new Error("Assessment not found");

        // Grade each response
        let correctCount = 0;
        const conceptStats: Record<string, { total: number; correct: number; difficulty: string }> = {};
        const responseData: { questionId: string; selectedAnswer: string; isCorrect: boolean }[] = [];

        for (const q of assessment.questions) {
            if (!conceptStats[q.conceptName]) {
                conceptStats[q.conceptName] = { total: 0, correct: 0, difficulty: q.difficulty };
            }
            conceptStats[q.conceptName].total += 1;

            const submittedAnswer = submission.find(s => s.questionId === q.id)?.selectedAnswer || '';
            const isCorrect = submittedAnswer === q.correctAnswer;
            if (isCorrect) {
                correctCount += 1;
                conceptStats[q.conceptName].correct += 1;
            }

            responseData.push({ questionId: q.id, selectedAnswer: submittedAnswer, isCorrect });
        }

        const overallScore = Math.round((correctCount / assessment.questions.length) * 100);

        // Look up previous attempt to compute improvementRate
        const previousAttempt = await prisma.assessmentAttempt.findFirst({
            where: { clerkUserId, assessmentId },
            orderBy: { createdAt: 'desc' }
        });

        const attempt = await prisma.assessmentAttempt.create({
            data: {
                clerkUserId,
                assessmentId,
                score: overallScore,
                responses: { create: responseData }
            }
        });

        const course = await prisma.course.findUnique({ where: { code: 'CS101' } });
        if (!course) throw new Error("CS101 Course not found");

        // Update ConceptPerformance per concept
        const conceptPerformances: Record<string, number> = {};
        for (const [conceptName, stats] of Object.entries(conceptStats)) {
            const masteryScore = Math.round((stats.correct / stats.total) * 100);
            conceptPerformances[conceptName] = masteryScore;

            const existing = await prisma.conceptPerformance.findFirst({
                where: { userId: user.id, courseId: course.id, conceptName }
            });

            if (existing) {
                // Weighted blend: 60% new score, 40% old — prevents wild swings
                const blended = Math.round(existing.masteryScore * 0.4 + masteryScore * 0.6);
                await prisma.conceptPerformance.update({
                    where: { id: existing.id },
                    data: { masteryScore: blended, attempts: existing.attempts + 1, lastPracticed: new Date() }
                });
                conceptPerformances[conceptName] = blended;
            } else {
                await prisma.conceptPerformance.create({
                    data: { userId: user.id, courseId: course.id, conceptName, masteryScore, attempts: 1, lastPracticed: new Date() }
                });
            }
        }

        // --- Compute meaningful LearningState values ---

        // conceptEntropy: how uneven is mastery across concepts? (std dev / 50)
        const scores = Object.values(conceptPerformances);
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
        const conceptEntropy = Math.min(1, Math.sqrt(variance) / 50);

        // frustrationIndex: proportion of easy questions answered wrong (capped at 0.9)
        const easyQs = assessment.questions.filter(q => q.difficulty === 'easy');
        const easyWrong = responseData.filter(r => {
            const q = assessment.questions.find(q => q.id === r.questionId);
            return q?.difficulty === 'easy' && !r.isCorrect;
        }).length;
        const frustrationIndex = easyQs.length > 0
            ? Math.min(0.9, (easyWrong / easyQs.length) * 0.9)
            : 0.1;

        // improvementRate: delta from last attempt / 10 to keep in reasonable range
        const improvementRate = previousAttempt
            ? Math.max(-5, Math.min(10, (overallScore - previousAttempt.score) / 10))
            : 1.0;

        // practiceSuccessScore tracks how well they do on application questions
        const hardQs = assessment.questions.filter(q => q.difficulty === 'hard');
        const hardCorrect = responseData.filter(r => {
            const q = assessment.questions.find(q => q.id === r.questionId);
            return q?.difficulty === 'hard' && r.isCorrect;
        }).length;
        const practiceSuccessScore = hardQs.length > 0
            ? Math.round((hardCorrect / hardQs.length) * 100)
            : overallScore;

        const existingState = await prisma.learningState.findFirst({
            where: { userId: user.id, courseId: course.id }
        });

        if (existingState) {
            await prisma.learningState.update({
                where: { id: existingState.id },
                data: {
                    averageScore: overallScore,
                    confidenceSelf: overallScore,
                    confidenceAi: overallScore,
                    frustrationIndex,
                    improvementRate,
                    practiceSuccessScore,
                    textSuccessScore: overallScore,
                    conceptEntropy,
                    lastUpdated: new Date()
                }
            });
        } else {
            await prisma.learningState.create({
                data: {
                    userId: user.id,
                    courseId: course.id,
                    confidenceSelf: overallScore,
                    confidenceAi: overallScore,
                    averageScore: overallScore,
                    frustrationIndex,
                    improvementRate,
                    videoSuccessScore: 50,
                    textSuccessScore: overallScore,
                    practiceSuccessScore,
                    conceptEntropy
                }
            });
        }

        // Regenerate only this user's embedding (not the whole course)
        await EmbeddingService.regenerateEmbeddingForUserCourse(user.id, course.id);

        const weaknesses = Object.entries(conceptStats)
            .filter(([_, s]) => s.correct / s.total <= 0.5)
            .map(([name]) => name);

        const strengths = Object.entries(conceptStats)
            .filter(([_, s]) => s.correct / s.total >= 0.8)
            .map(([name]) => name);

        return {
            score: overallScore,
            attemptId: attempt.id,
            totalQuestions: assessment.questions.length,
            correctCount,
            strengths,
            weaknesses,
            conceptEntropy: Math.round(conceptEntropy * 100) / 100,
            frustrationIndex: Math.round(frustrationIndex * 100) / 100,
            improvementRate: Math.round(improvementRate * 100) / 100,
            recommendation: weaknesses.length > 0
                ? `Prioritise studying ${weaknesses.slice(0, 2).join(' and ')}. Your vector has been updated and peers who excel in these areas are now being surfaced.`
                : 'Excellent — strong foundational mastery across all concepts assessed.'
        };
    }
}
