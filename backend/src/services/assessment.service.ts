import { PrismaClient } from '@prisma/client';
import { EmbeddingService } from './embedding.service';

const prisma = new PrismaClient();

export class AssessmentService {
    /**
     * Fetch all available assessments
     */
    static async getAssessments() {
        return prisma.assessment.findMany({
            select: {
                id: true,
                subject: true,
                title: true,
                description: true,
                createdAt: true,
                _count: {
                    select: { questions: true }
                }
            }
        });
    }

    /**
     * Fetch a specific assessment with its questions (excluding correct answers for security)
     */
    static async getAssessmentById(assessmentId: string) {
        return prisma.assessment.findUnique({
            where: { id: assessmentId },
            include: {
                questions: {
                    select: {
                        id: true,
                        questionText: true,
                        options: true,
                        conceptName: true,
                        difficulty: true
                    }
                }
            }
        });
    }

    /**
     * Submit an assessment attempt, compute score, and update real skills
     */
    static async submitAssessment(clerkUserId: string, assessmentId: string, submission: { questionId: string, selectedAnswer: string }[]) {
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) throw new Error("User not found");

        const assessment = await prisma.assessment.findUnique({
            where: { id: assessmentId },
            include: { questions: true }
        });
        if (!assessment) throw new Error("Assessment not found");

        // Prepare grading objects
        let correctCount = 0;
        const conceptStats: Record<string, { total: number, correct: number }> = {};
        const responseData = [];

        // Grade the submission
        for (const [index, q] of assessment.questions.entries()) {
            if (!conceptStats[q.conceptName]) {
                conceptStats[q.conceptName] = { total: 0, correct: 0 };
            }
            conceptStats[q.conceptName].total += 1;

            const submittedAnswer = submission.find(s => s.questionId === q.id)?.selectedAnswer || "";
            const isCorrect = submittedAnswer === q.correctAnswer;

            if (isCorrect) {
                correctCount += 1;
                conceptStats[q.conceptName].correct += 1;
            }

            responseData.push({
                questionId: q.id,
                selectedAnswer: submittedAnswer,
                isCorrect
            });
        }

        const overallScore = Math.round((correctCount / assessment.questions.length) * 100);

        // Save Attempt
        const attempt = await prisma.assessmentAttempt.create({
            data: {
                clerkUserId,
                assessmentId,
                score: overallScore,
                responses: {
                    create: responseData
                }
            }
        });

        // Resolve Hardcoded CS101 Course map (since MVP just has DSA assessment)
        const course = await prisma.course.findUnique({ where: { code: 'CS101' } });
        if (!course) throw new Error("CS101 Course not found to map skills to.");

        // Update real ConceptPerformance rows
        for (const [conceptName, stats] of Object.entries(conceptStats)) {
            const masteryScore = Math.round((stats.correct / stats.total) * 100);

            // Upsert doesn't work well without a unique constraint, so we manually check
            const existingCP = await prisma.conceptPerformance.findFirst({
                where: { userId: user.id, courseId: course.id, conceptName }
            });

            if (existingCP) {
                await prisma.conceptPerformance.update({
                    where: { id: existingCP.id },
                    data: {
                        masteryScore,
                        attempts: existingCP.attempts + 1,
                        lastPracticed: new Date()
                    }
                });
            } else {
                await prisma.conceptPerformance.create({
                    data: {
                        userId: user.id,
                        courseId: course.id,
                        conceptName,
                        masteryScore,
                        attempts: 1,
                        lastPracticed: new Date()
                    }
                });
            }
        }

        // Generate/Update the overarching LearningState
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
                    frustrationIndex: 0.1,
                    improvementRate: 1.0,
                    videoSuccessScore: 50,
                    textSuccessScore: 50,
                    practiceSuccessScore: overallScore,
                    conceptEntropy: 0.5
                }
            });
        }

        // CRITICAL PHASE 9 INTEGRATION: Automatically regenerate the user's vector embedding using the real skills
        await EmbeddingService.regenerateEmbeddingsForCourse(course.id);

        // Generate dynamic feedback
        const weakConcepts = Object.entries(conceptStats)
            .filter(([_, stats]) => (stats.correct / stats.total) <= 0.5)
            .map(([name]) => name);

        const strongConcepts = Object.entries(conceptStats)
            .filter(([_, stats]) => (stats.correct / stats.total) === 1.0)
            .map(([name]) => name);

        return {
            success: true,
            score: overallScore,
            attemptId: attempt.id,
            totalQuestions: assessment.questions.length,
            correctCount,
            feedback: {
                weakConcepts,
                strongConcepts,
                recommendation: weakConcepts.length > 0
                    ? `You should study ${weakConcepts.join(' and ')}.`
                    : "Excellent work! You have strong foundational mastery."
            }
        };
    }
}
