import { PrismaClient } from '@prisma/client';
import { SimilarityService } from './similarity.service';

const prisma = new PrismaClient();

export class ComplementarityService {

    /**
     * Computes match score combining Cosine Similarity and Concept Complementarity.
     */
    static async computeMatchScore(userA: string, userB: string, courseId: string) {
        // 1. Get Similarity Score
        const similarityResult = await SimilarityService.getPairSimilarity(userA, userB, courseId);
        const similarityScore = similarityResult.similarityScore;

        // 2. Fetch Concept Performances
        const conceptsA = await prisma.conceptPerformance.findMany({
            where: { userId: userA, courseId }
        });
        const conceptsB = await prisma.conceptPerformance.findMany({
            where: { userId: userB, courseId }
        });

        if (conceptsA.length === 0 && conceptsB.length === 0) {
            throw new Error('No concept performance records found for these users in this course.');
        }

        // Helper: DB stores mastery 0-100. API uses 0-1 for stability.
        // Converts scale and clamps to [0,1]
        const toUnitInterval = (score: number): number => {
            const normalized = score > 1 ? score / 100 : score;
            return Math.max(0, Math.min(1, normalized));
        };

        // 3. Build Maps and Normalize to [0,1]
        const masteryA: Record<string, number> = {};
        conceptsA.forEach(c => {
            masteryA[c.conceptName] = toUnitInterval(c.masteryScore);
        });

        const masteryB: Record<string, number> = {};
        conceptsB.forEach(c => {
            masteryB[c.conceptName] = toUnitInterval(c.masteryScore);
        });

        const allConcepts = new Set([...Object.keys(masteryA), ...Object.keys(masteryB)]);
        const numConcepts = allConcepts.size;

        let helpAtoB = 0;
        let helpBtoA = 0;

        const topComplementaryConcepts: any[] = [];
        const sharedStrengths: string[] = [];
        const sharedWeaknesses: string[] = [];

        // 4. Calculate gaps and shared traits
        for (const concept of allConcepts) {
            const scoreA = masteryA[concept] ?? 0;
            const scoreB = masteryB[concept] ?? 0;

            // Shared
            if (scoreA >= 0.75 && scoreB >= 0.75) sharedStrengths.push(concept);
            if (scoreA <= 0.40 && scoreB <= 0.40) sharedWeaknesses.push(concept);

            // A helps B
            if (scoreA >= 0.75 && scoreB <= 0.40) {
                const gap = scoreA - scoreB;
                helpAtoB += gap;
                topComplementaryConcepts.push({
                    concept,
                    masteryStrong: scoreA,
                    masteryWeak: scoreB,
                    gap,
                    helper: userA
                });
            }

            // B helps A
            if (scoreB >= 0.75 && scoreA <= 0.40) {
                const gap = scoreB - scoreA;
                helpBtoA += gap;
                topComplementaryConcepts.push({
                    concept,
                    masteryStrong: scoreB,
                    masteryWeak: scoreA,
                    gap,
                    helper: userB
                });
            }
        }

        // Sort descending by gap size
        topComplementaryConcepts.sort((a, b) => b.gap - a.gap);

        // 5. Normalize Complementarity [0,1]
        // Max possible gap is 1.0 per concept for all concepts
        const maxPossible = numConcepts > 0 ? numConcepts : 1;

        const normalizedHelpAtoB = Math.max(0, Math.min(1, helpAtoB / maxPossible));
        const normalizedHelpBtoA = Math.max(0, Math.min(1, helpBtoA / maxPossible));

        const complementarityScore = Math.max(normalizedHelpAtoB, normalizedHelpBtoA);

        let direction = "None";
        if (complementarityScore > 0) {
            direction = normalizedHelpAtoB >= normalizedHelpBtoA ? "A_to_B" : "B_to_A";
        }

        // 6. Final Score (Weighted combination)
        const finalScore = (0.7 * similarityScore) + (0.3 * complementarityScore);

        return {
            similarityScore,
            complementarityScore,
            direction,
            finalScore,
            details: {
                // Return up to 5 concepts driving the complementarity
                topComplementaryConcepts: topComplementaryConcepts.slice(0, 5),
                sharedStrengths,
                sharedWeaknesses
            }
        };
    }
}
