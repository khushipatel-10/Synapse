import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PreferenceService {
    /**
     * Upsert a user's preferences by Clerk ID
     */
    static async upsertPreferences(clerkUserId: string, preferencesData: any, userFullName?: string) {
        // Just-in-Time User Creation if they hit onboarding before anything else
        let user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    clerkId: clerkUserId,
                    name: userFullName || preferencesData.displayName || "Synapse Scholar",
                    major: "", // Optional now
                    year: "", // Optional now
                    availability: JSON.stringify(preferencesData.availability || [])
                }
            });
        }

        return prisma.userPreferences.upsert({
            where: { clerkUserId },
            update: {
                studyPace: preferencesData.studyPace,
                studyMode: preferencesData.studyMode,
                learningStyle: preferencesData.learningStyle,
                goal: preferencesData.goal,
                subjectInterests: preferencesData.subjectInterests || [],
                preferredGroupSize: preferencesData.preferredGroupSize,
                availability: preferencesData.availability || null,
            },
            create: {
                clerkUserId,
                studyPace: preferencesData.studyPace,
                studyMode: preferencesData.studyMode,
                learningStyle: preferencesData.learningStyle,
                goal: preferencesData.goal,
                subjectInterests: preferencesData.subjectInterests || [],
                preferredGroupSize: preferencesData.preferredGroupSize,
                availability: preferencesData.availability || null,
            }
        });
    }

    /**
     * Get preferences by Clerk ID
     */
    static async getPreferences(clerkUserId: string) {
        return prisma.userPreferences.findUnique({
            where: { clerkUserId }
        });
    }
}
