import { PrismaClient, LearningState } from '@prisma/client';

const prisma = new PrismaClient();

// Fixed reasonable bounds for normalization (Option A)
// This is stable, prevents cold-start divide-by-zero errors when a course has few users, 
// and ensures a user's embedding doesn't shift wildly just because someone else joins the class.
const BOUNDS = {
    confidence_gap: [0, 100],
    average_score: [0, 100],
    frustration_index: [0, 1], // Assuming 0-1 scale natively
    improvement_rate: [0, 10], // Assuming max typical improvement is 10 units
    video_success_score: [0, 100],
    text_success_score: [0, 100],
    practice_success_score: [0, 100],
    concept_entropy: [0, 1], // Normalized Shannon entropy or similar (0-1)
    confidence_self: [0, 100],
    confidence_ai: [0, 100],
    score_variance: [0, 2500], // (Max theoretical variance for 0-100 is 2500)
    recent_activity_score: [0, 1] // Output of decay function is strictly 0-1
};

export class EmbeddingService {

    /**
     * Computes the raw 12-dimensional feature vector mathematically from LearningState
     */
    static computeRawFeatures(state: LearningState): number[] {
        const confidence_gap = Math.abs(state.confidenceSelf - state.confidenceAi);

        // Proxy for score variance: 
        // If average is high but improvement is very high/erratic, variance is higher.
        // We use a simple heuristic proxy here since we don't store historical arrays in LearningState.
        const score_variance = Math.pow(state.improvementRate, 2) * 2;

        // Recent activity score: simple exponential decay
        // 1.0 if updated exactly right now, approaches 0 as days pass.
        const daysSinceUpdate = (Date.now() - state.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
        const recent_activity_score = Math.exp(-0.1 * daysSinceUpdate);

        return [
            confidence_gap,
            state.averageScore,
            state.frustrationIndex,
            state.improvementRate,
            state.videoSuccessScore,
            state.textSuccessScore,
            state.practiceSuccessScore,
            state.conceptEntropy,
            state.confidenceSelf,
            state.confidenceAi,
            score_variance,
            recent_activity_score
        ];
    }

    /**
     * Normalizes the 12D vector using Min-Max scaling against fixed reasonable bounds
     */
    static normalizeFeatures(rawVector: number[]): number[] {
        const keys = Object.keys(BOUNDS) as Array<keyof typeof BOUNDS>;

        return rawVector.map((val, index) => {
            const key = keys[index];
            const [min, max] = BOUNDS[key];

            // Min-max formula: (x - min) / (max - min)
            // Clamp to [0,1] in case of extreme outliers
            const normalized = (val - min) / (max - min);
            return Math.max(0, Math.min(1, normalized)); // Clamp
        });
    }

    /**
     * Upserts the generated 12D vector into the UserEmbedding table using Raw SQL
     */
    static async upsertUserEmbedding(userId: string, courseId: string, vector12: number[]) {
        if (vector12.length !== 12) {
            throw new Error(`Invalid embedding vector length: expected 12, got ${vector12.length}`);
        }

        const vectorLiteral = `[${vector12.join(',')}]`;

        // Try to find if it exists
        const existing = await prisma.$queryRaw`
      SELECT id FROM "UserEmbedding" WHERE "userId" = ${userId} AND "courseId" = ${courseId} LIMIT 1
    `;

        if ((existing as any[]).length > 0) {
            await prisma.$executeRaw`
        UPDATE "UserEmbedding"
        SET "embedding" = ${vectorLiteral}::vector(12),
            "version" = "version" + 1,
            "createdAt" = NOW()
        WHERE "userId" = ${userId} AND "courseId" = ${courseId}
      `;
        } else {
            await prisma.$executeRaw`
        INSERT INTO "UserEmbedding" ("id", "userId", "courseId", "embedding", "version", "createdAt")
        VALUES (gen_random_uuid(), ${userId}, ${courseId}, ${vectorLiteral}::vector(12), 1, NOW())
      `;
        }
    }

    /**
     * Full pipeline: Fetch state -> Compute -> Normalize -> Upsert
     */
    static async regenerateEmbeddingForUserCourse(userId: string, courseId: string): Promise<number[]> {
        const state = await prisma.learningState.findFirst({
            where: { userId, courseId }
        });

        if (!state) {
            throw new Error(`No LearningState found for User ${userId} in Course ${courseId}`);
        }

        const raw = this.computeRawFeatures(state);
        const normalized = this.normalizeFeatures(raw);

        await this.upsertUserEmbedding(userId, courseId, normalized);

        return normalized;
    }

    /**
     * Batch process an entire course
     */
    static async regenerateEmbeddingsForCourse(courseId: string): Promise<number> {
        const states = await prisma.learningState.findMany({
            where: { courseId }
        });

        let count = 0;
        for (const state of states) {
            const raw = this.computeRawFeatures(state);
            const normalized = this.normalizeFeatures(raw);
            await this.upsertUserEmbedding(state.userId, state.courseId, normalized);
            count++;
        }

        return count;
    }

    /**
     * Fetch embedding
     */
    static async getEmbedding(userId: string, courseId: string) {
        const result = await prisma.$queryRaw`
      SELECT id, "userId", "courseId", "embedding"::text, version 
      FROM "UserEmbedding" 
      WHERE "userId" = ${userId} AND "courseId" = ${courseId}
      LIMIT 1
    ` as any[];

        if (result.length === 0) return null;

        // pgvector returns as string "[0.1, 0.2, ...]", so we parse it back to number[]
        const embeddingStr = result[0].embedding;
        const vectorArray = JSON.parse(embeddingStr);

        return {
            id: result[0].id,
            userId: result[0].userId,
            courseId: result[0].courseId,
            version: result[0].version,
            embedding: vectorArray
        };
    }
}
