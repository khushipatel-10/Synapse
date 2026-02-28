import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@clerk/express';
import { AssessmentService } from '../services/assessment.service';

const router = Router();
const prisma = new PrismaClient();

// GET /assessments - Returns active assessments
router.get('/', requireAuth(), async (req: any, res: any) => {
    try {
        const assessments = await prisma.assessment.findMany({
            select: {
                id: true,
                subject: true,
                title: true,
                description: true,
                createdAt: true,
            }
        });
        res.json({ success: true, data: assessments });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /assessments/:id - Returns specific assessment and its questions
router.get('/:id', requireAuth(), async (req: any, res: any) => {
    try {
        const assessment = await prisma.assessment.findUnique({
            where: { id: req.params.id },
            include: {
                questions: {
                    select: {
                        id: true,
                        questionText: true,
                        options: true,
                        conceptName: true,
                        difficulty: true
                        // Exclude correctAnswer deliberately
                    }
                }
            }
        });

        if (!assessment) {
            return res.status(404).json({ success: false, error: 'Assessment not found' });
        }

        res.json({ success: true, data: assessment });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /assessments/:id/submit - Submit answers and compute mastery
router.post('/:id/submit', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        const assessmentId = req.params.id;
        const { answers } = req.body; // Map of questionId -> selectedOption string

        if (!clerkUserId || !assessmentId || !answers) {
            return res.status(400).json({ success: false, error: 'Missing required parameters' });
        }

        // Map frontend { q1Id: 'A', q2Id: 'B' } format into the {questionId, selectedAnswer}[] array expected by the service
        const submissionArray = Object.keys(answers).map(qId => ({
            questionId: qId,
            selectedAnswer: answers[qId]
        }));

        const result = await AssessmentService.submitAssessment(clerkUserId, assessmentId, submissionArray);

        res.json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error("Error submitting assessment:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
