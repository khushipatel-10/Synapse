import { PrismaClient } from '@prisma/client';
import { EmbeddingService } from './embedding.service';
import { SimilarityService } from './similarity.service';
import { ComplementarityService } from './complementarity.service';
import { PreferenceService } from './preference.service';

const prisma = new PrismaClient();

export class MatchingService {

    /**
     * 1. Returns all users enrolled in a given course (those having a LearningState)
     */
    static async listEnrolledUsers(courseId: string) {
        // Find users who have a learning state for the given course
        return prisma.user.findMany({
            where: {
                learningStates: {
                    some: { courseId }
                }
            }
        });
    }

    /**
     * 2. Utility to guarantee embeddings exist. 
     * In a real system, you might only generate missing ones. 
     * For Phase 5 we can regenerate for the course just to be absolutely certain.
     */
    static async ensureEmbeddings(courseId: string) {
        await EmbeddingService.regenerateEmbeddingsForCourse(courseId);
    }

    /**
     * 3. Build Pairs using Greedy Maximum Matching
     * Performance Strategy: Instead of N^2 application-level comparisons for a huge class,
     * we leverage the HNSW pgvector index. For each user, we ask pgvector for their top 5-10
     * most similar peers. We only compute the heavier Concept Complementarity on those top candidates.
     * This reduces DB load from O(N^2) complementarity checks to O(N * K).
     */
    static async buildPairs(courseId: string) {
        await this.ensureEmbeddings(courseId);

        const users = await this.listEnrolledUsers(courseId);
        if (users.length < 2) {
            throw new Error("Not enough users to form pairs.");
        }

        const unassigned = new Set(users.map(u => u.id));
        const userMap = new Map(users.map(u => [u.id, u]));

        // Generate Candidate Edges
        const candidateEdges: any[] = [];
        const MAX_CANDIDATES = 10;

        for (const user of users) {
            if (!unassigned.has(user.id)) continue;

            // Fast Index lookup: top K Cosine similarities
            const similarUsers = await SimilarityService.getSimilarUsers(user.id, courseId, MAX_CANDIDATES);

            for (const simUser of similarUsers) {
                // Prevent duplicate undirected edges by enforcing ID order
                if (user.id < simUser.userId) {
                    // Now compute the heavier Complementarity & Final Score
                    const matchData = await ComplementarityService.computeMatchScore(user.id, simUser.userId, courseId);
                    candidateEdges.push({
                        userA: userMap.get(user.id),
                        userB: userMap.get(simUser.userId),
                        ...matchData
                    });
                }
            }
        }

        // Sort edges by descending Final Score
        candidateEdges.sort((a, b) => b.finalScore - a.finalScore);

        const pairs: any[] = [];
        const triples: any[] = [];
        const leftovers: any[] = [];

        // Greedy Matching Iteration
        for (const edge of candidateEdges) {
            if (unassigned.has(edge.userA.id) && unassigned.has(edge.userB.id)) {
                pairs.push(edge);
                unassigned.delete(edge.userA.id);
                unassigned.delete(edge.userB.id);
            }
        }

        // Handle Odds / Leftovers
        const remainingIds = Array.from(unassigned);
        if (remainingIds.length === 1) {
            // Create ONE triple by appending the last user to the mathematically strongest pair
            const leftoverUser = userMap.get(remainingIds[0]);
            if (pairs.length > 0) {
                const targetPair = pairs[0]; // The best pair
                triples.push({
                    basePair: targetPair,
                    thirdUser: leftoverUser
                });
                pairs.shift(); // Remove from pairs, move to triples
            } else {
                leftovers.push(leftoverUser);
            }
        } else if (remainingIds.length > 1) {
            // If graph was completely disconnected (rare with large K), push to leftovers
            remainingIds.forEach(id => leftovers.push(userMap.get(id)));
        }

        return {
            success: true,
            courseId,
            totalStudents: users.length,
            pairs,
            triples,
            leftovers
        };
    }

    /**
     * 4. Build Hubs (Balanced groups of 4 via serpentine sort)
     */
    static async buildHubs(courseId: string) {
        const states = await prisma.learningState.findMany({
            where: { courseId },
            include: { user: true }
        });

        if (states.length === 0) {
            throw new Error("No users found in course.");
        }

        // Calculate abilityScore = (0.5 * normalized_avgScore) + (0.5 * normalized_confAI)
        // We already clamp scores 0-100 to 0-1 conceptually, so assuming 0-100 here:
        const toUnit = (val: number) => (val > 1 ? val / 100 : val);

        const scoredUsers = states.map(state => {
            const avg = toUnit(state.averageScore);
            const conf = toUnit(state.confidenceAi);
            const abilityScore = (0.5 * avg) + (0.5 * conf);
            return {
                id: state.userId,
                name: state.user.name,
                abilityScore
            };
        });

        // 1. Sort descending by ability
        scoredUsers.sort((a: any, b: any) => b.abilityScore - a.abilityScore);

        // 2. Serpentine Distribution
        const HUB_SIZE = 4;
        const numHubs = Math.ceil(scoredUsers.length / HUB_SIZE);

        // Determine exact capacity for each hub to ensure e.g. 4,4,2 distribution
        const capacities = Array.from({ length: numHubs }, (_, i) =>
            Math.min(HUB_SIZE, scoredUsers.length - i * HUB_SIZE)
        );

        // Initialize empty hubs
        const hubs: any[][] = Array.from({ length: numHubs }, () => []);

        let forward = true;
        for (let i = 0; i < scoredUsers.length;) {
            if (forward) {
                for (let h = 0; h < numHubs && i < scoredUsers.length; h++) {
                    if (hubs[h].length < capacities[h]) {
                        hubs[h].push(scoredUsers[i++]);
                    }
                }
            } else {
                for (let h = numHubs - 1; h >= 0 && i < scoredUsers.length; h--) {
                    if (hubs[h].length < capacities[h]) {
                        hubs[h].push(scoredUsers[i++]);
                    }
                }
            }
            forward = !forward;
        }

        // Compute Metrics per Hub async using Promise.all
        const formattedHubs = await Promise.all(Object.entries(hubs).map(async ([index, members]) => {
            let sumAbility = 0;
            members.forEach(m => sumAbility += m.abilityScore);
            const avgAbility = sumAbility / members.length;

            let varianceSum = 0;
            members.forEach(m => {
                varianceSum += Math.pow(m.abilityScore - avgAbility, 2);
            });
            const abilityVariance = Math.max(0, varianceSum / members.length);

            // Construct hubComplementarityPotential using true Concept Performance calls
            let sumBestComplementarity = 0;
            for (const user of members) {
                let bestComp = 0;
                for (const peer of members) {
                    if (user.id !== peer.id) {
                        try {
                            const matchData = await ComplementarityService.computeMatchScore(user.id, peer.id, courseId);
                            if (matchData.complementarityScore > bestComp) {
                                bestComp = matchData.complementarityScore;
                            }
                        } catch (e) {
                            // ignore if no concepts mapped
                        }
                    }
                }
                sumBestComplementarity += bestComp;
            }
            const rawHubComp = members.length > 1 ? sumBestComplementarity / members.length : 0;
            const hubComplementarityPotential = Math.max(0, Math.min(1, rawHubComp));

            return {
                hubId: `Hub-${parseInt(index) + 1}`,
                members,
                metrics: {
                    avgAbility,
                    abilityVariance,
                    hubComplementarityPotential
                }
            };
        }));

        return {
            success: true,
            courseId,
            hubs: formattedHubs,
            note: formattedHubs[formattedHubs.length - 1].members.length < HUB_SIZE
                ? "The final hub has fewer members due to remainder math (total students not divisible by 4)."
                : undefined
        };
    }

    /**
     * Calculates a preference compatibility score [0.0 - 1.0] between two UserPreference objects
     */
    static computePreferenceCompatibility(prefsA: any, prefsB: any): number {
        if (!prefsA || !prefsB) return 0.5; // neutral fallback

        let score = 0;
        const weights = {
            studyMode: 0.3,
            studyPace: 0.2,
            learningStyle: 0.2,
            goal: 0.1,
            subjectInterests: 0.2
        };

        if (prefsA.studyMode === prefsB.studyMode || prefsA.studyMode === 'hybrid' || prefsB.studyMode === 'hybrid') {
            score += weights.studyMode;
        }

        if (prefsA.studyPace === prefsB.studyPace) {
            score += weights.studyPace;
        }

        if (prefsA.learningStyle === prefsB.learningStyle) {
            score += weights.learningStyle;
        }

        if (prefsA.goal === prefsB.goal) {
            score += weights.goal;
        }

        // Jaccard similarity for subject interests
        try {
            const subjectsA = new Set(Array.isArray(prefsA.subjectInterests) ? prefsA.subjectInterests : []);
            const subjectsB = new Set(Array.isArray(prefsB.subjectInterests) ? prefsB.subjectInterests : []);

            if (subjectsA.size > 0 && subjectsB.size > 0) {
                const intersection = new Set([...subjectsA].filter(x => subjectsB.has(x)));
                const union = new Set([...subjectsA, ...subjectsB]);
                const jaccard = intersection.size / union.size;
                score += (jaccard * weights.subjectInterests);
            }
        } catch (e) { }

        return Math.min(Math.max(score, 0), 1);
    }

    /**
     * Phase 8: Builds personalized recommendations for a specific user incorporating vector math + user preferences
     */
    static async buildPersonalizedRecommendations(clerkUserId: string, courseId: string, userPrefs: any) {
        const dbUser = await prisma.user.findFirst({ where: { clerkId: clerkUserId } });
        if (!dbUser) throw new Error("Database user mapping not found for Clerk ID");

        // 1. Get Top 20 physically similar/complementary users via existing pgvector workflow
        let vectorMatches = await SimilarityService.getSimilarUsers(dbUser.id, courseId, 20);

        // FALLBACK: If vectorMatches is empty (no seeds generated/no assessment taken),
        // we'll pull a random sampling of the course and match them manually on preference score to keep app completely dynamic.
        if (vectorMatches.length === 0) {
            const fallbackUsers = await prisma.user.findMany({
                where: { id: { not: dbUser.id } },
                take: 20
            });
            vectorMatches = fallbackUsers.map(u => ({
                userId: u.id,
                name: u.name,
                distance: 1, // Neutral
                similarityScore: 0.5, // Neutral fallback
                embeddingVersion: null
            }));
        }

        const recommendations = [];

        for (const match of vectorMatches) {
            const candidateDb = await prisma.user.findUnique({ where: { id: match.userId } });
            if (!candidateDb || !candidateDb.clerkId) continue;

            const candidatePrefs = await PreferenceService.getPreferences(candidateDb.clerkId);

            // 2. Extract technical complementarity (try/catch in case seeds are totally stripped)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let compData: any = { complementarityScore: 0.5, details: { missingConcepts: [], topComplementaryConcepts: [] } };
            try {
                compData = await ComplementarityService.computeMatchScore(dbUser.id, candidateDb.id, courseId);
            } catch (e) { /* ignore fallback */ }

            // 3. Extract human preference compatibility
            const prefScore = this.computePreferenceCompatibility(userPrefs, candidatePrefs);

            // 4. Calculate Master Synergistic Score
            // Weighting: 40% Vector Knowledge, 40% Structural Complementarity, 20% Human Preferences
            const masterScore = (match.similarityScore * 0.4) + (compData.complementarityScore * 0.4) + (prefScore * 0.2);

            recommendations.push({
                user: candidateDb,
                matchScore: masterScore,
                vectorSimilarity: match.similarityScore,
                technicalComplementarity: compData.complementarityScore,
                preferenceCompatibility: prefScore,
                // Pass standard interface even on fallback
                details: {
                    missingConcepts: compData.details?.topComplementaryConcepts || []
                },
                sharedPreferences: {
                    mode: userPrefs.studyMode === candidatePrefs?.studyMode,
                    pace: userPrefs.studyPace === candidatePrefs?.studyPace
                }
            });
        }

        // Sort by absolute highest master score
        return recommendations.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
    }
}
