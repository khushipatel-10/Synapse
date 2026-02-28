import { PrismaClient } from '@prisma/client';
import { MatchingService } from './matching.service';
import { SimilarityService } from './similarity.service';
import { ComplementarityService } from './complementarity.service';

const prisma = new PrismaClient();

export class NetworkService {
    /**
     * 1. Creates a new weekly snapshot of the course network
     */
    static async createSnapshot(courseId: string, weekIndex: number, topK: number = 5, minFinalScore: number = 0.55) {
        // Ensure no duplicate weekIndex for course
        const existing = await prisma.courseSnapshot.findUnique({
            where: { courseId_weekIndex: { courseId, weekIndex } }
        });

        if (existing) {
            throw new Error(`Snapshot for course ${courseId} week ${weekIndex} already exists.`);
        }

        const snapshot = await prisma.courseSnapshot.create({
            data: { courseId, weekIndex }
        });

        const edgesInserted = await this.buildEdgesForSnapshot(snapshot.id, courseId, topK, minFinalScore);
        return { snapshot, edgesInserted };
    }

    /**
     * 2. Builds and stores edges for the given snapshot
     */
    static async buildEdgesForSnapshot(snapshotId: string, courseId: string, topK: number, minFinalScore: number) {
        await MatchingService.ensureEmbeddings(courseId);

        const users = await MatchingService.listEnrolledUsers(courseId);

        // Use a Map to deduplicate edges by canonical ordering \`min_max\`
        const edgeMap = new Map<string, any>();

        for (const user of users) {
            const similarCandidates = await SimilarityService.getSimilarUsers(user.id, courseId, topK);

            for (const candidate of similarCandidates) {
                try {
                    // Compute full match score (Similarity + Complementarity)
                    const matchData = await ComplementarityService.computeMatchScore(user.id, candidate.userId, courseId);

                    if (matchData.finalScore >= minFinalScore) {
                        // Canonical ordering to ensure undirected graph representation
                        const [uA, uB] = user.id < candidate.userId ? [user.id, candidate.userId] : [candidate.userId, user.id];
                        const edgeKey = `${uA}_${uB}`;

                        if (!edgeMap.has(edgeKey)) {
                            edgeMap.set(edgeKey, {
                                snapshotId,
                                courseId,
                                userAId: uA,
                                userBId: uB,
                                similarityScore: matchData.similarityScore,
                                complementarityScore: matchData.complementarityScore,
                                finalScore: matchData.finalScore,
                                direction: matchData.direction
                            });
                        }
                    }
                } catch (e) {
                    // Skip if missing concept rows or other data sync errors
                }
            }
        }

        const edgesToInsert = Array.from(edgeMap.values());
        if (edgesToInsert.length > 0) {
            await prisma.networkEdge.createMany({
                data: edgesToInsert
            });
        }

        return edgesToInsert.length;
    }

    /**
     * 3. List snapshot edges
     */
    static async listSnapshotEdges(courseId: string, weekIndex: number) {
        const snapshot = await prisma.courseSnapshot.findUnique({
            where: { courseId_weekIndex: { courseId, weekIndex } },
            include: { edges: true }
        });

        if (!snapshot) throw new Error(`Snapshot not found.`);
        return snapshot.edges;
    }

    /**
     * 4. List snapshot nodes with metrics
     */
    static async listSnapshotNodes(courseId: string, weekIndex: number) {
        const snapshot = await prisma.courseSnapshot.findUnique({
            where: { courseId_weekIndex: { courseId, weekIndex } },
            include: {
                edges: {
                    include: {
                        userA: true,
                        userB: true
                    }
                }
            }
        });

        if (!snapshot) throw new Error(`Snapshot not found.`);

        const nodeMetrics = new Map<string, any>();

        const ensureNode = (user: any) => {
            if (!nodeMetrics.has(user.id)) {
                nodeMetrics.set(user.id, {
                    userId: user.id,
                    name: user.name,
                    degree: 0,
                    totalScore: 0,
                    rawEdges: []
                });
            }
            return nodeMetrics.get(user.id);
        };

        for (const edge of snapshot.edges) {
            const nodeA = ensureNode(edge.userA);
            const nodeB = ensureNode(edge.userB);

            nodeA.degree++;
            nodeA.totalScore += edge.finalScore;
            nodeA.rawEdges.push({ userId: edge.userBId, name: edge.userB.name, finalScore: edge.finalScore });

            nodeB.degree++;
            nodeB.totalScore += edge.finalScore;
            nodeB.rawEdges.push({ userId: edge.userAId, name: edge.userA.name, finalScore: edge.finalScore });
        }

        const resultNodes = Array.from(nodeMetrics.values()).map(node => {
            // Sort to get top partners
            node.rawEdges.sort((a: any, b: any) => b.finalScore - a.finalScore);

            return {
                userId: node.userId,
                name: node.name,
                degree: node.degree,
                avgFinalScore: node.degree > 0 ? (node.totalScore / node.degree) : 0,
                topPartners: node.rawEdges.slice(0, 3)
            };
        });

        // Bring in fully disconnected users (Degree 0)
        const allUsers = await MatchingService.listEnrolledUsers(courseId);
        for (const u of allUsers) {
            if (!nodeMetrics.has(u.id)) {
                resultNodes.push({
                    userId: u.id,
                    name: u.name,
                    degree: 0,
                    avgFinalScore: 0,
                    topPartners: []
                });
            }
        }

        return resultNodes;
    }

    /**
     * 5. List available snapshots
     */
    static async listSnapshots(courseId: string) {
        const snaps = await prisma.courseSnapshot.findMany({
            where: { courseId },
            orderBy: { weekIndex: 'asc' },
            select: { weekIndex: true, createdAt: true, id: true }
        });
        return snaps;
    }
}
