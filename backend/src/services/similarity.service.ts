import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SimilarityService {
    /**
     * Finds the top K most similar users in a course based on Cosine Similarity.
     * 
     * In pgvector, `<=>` computes the Cosine Distance.
     * Cosine distance = 1 - Cosine Similarity.
     * Therefore, distance 0 means exactly the same (similarity 1).
     * Distance 2 means completely opposite (similarity -1).
     * 
     * We order by distance ASC (smallest distance = most similar).
     */
    static async getSimilarUsers(userId: string, courseId: string, k: number = 5) {
        if (k < 1 || k > 50) {
            throw new Error('K must be between 1 and 50');
        }

        // Use Prisma's raw SQL query to leverage pgvector operators and index
        const results = await prisma.$queryRaw`
      SELECT 
        ue2."userId", 
        u."name", 
        ue2."version" as "embeddingVersion", 
        (ue1.embedding <=> ue2.embedding) as distance
      FROM "UserEmbedding" ue1
      JOIN "UserEmbedding" ue2 ON ue1."courseId" = ue2."courseId"
      JOIN "User" u ON u."id" = ue2."userId"
      WHERE ue1."userId" = ${userId} 
        AND ue1."courseId" = ${courseId} 
        AND ue2."userId" <> ${userId}
      ORDER BY distance ASC
      LIMIT ${k};
    ` as any[];

        // Map distance to similarity score
        return results.map(row => {
            // distance [0, 2]. similarity = 1 - distance.
            // E.g., distance 0 -> similarity 1. distance 0.2 -> similarity 0.8
            const distance = Number(row.distance);
            const similarityScore = Math.max(-1, 1 - distance);

            return {
                userId: row.userId,
                name: row.name,
                distance: distance,
                similarityScore: similarityScore,
                embeddingVersion: row.embeddingVersion
            };
        });
    }

    /**
     * Computes the exact similarity between two specific users in a course.
     */
    static async getPairSimilarity(userA: string, userB: string, courseId: string) {
        const results = await prisma.$queryRaw`
      SELECT 
        (ueA.embedding <=> ueB.embedding) as distance
      FROM "UserEmbedding" ueA
      JOIN "UserEmbedding" ueB ON ueA."courseId" = ueB."courseId"
      WHERE ueA."userId" = ${userA} 
        AND ueA."courseId" = ${courseId} 
        AND ueB."userId" = ${userB}
    ` as any[];

        if (results.length === 0) {
            throw new Error('One or both users do not have embeddings for this course.');
        }

        const distance = Number(results[0].distance);
        const similarityScore = Math.max(-1, 1 - distance);

        return {
            userA,
            userB,
            courseId,
            distance,
            similarityScore
        };
    }
}
