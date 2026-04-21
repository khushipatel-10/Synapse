import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getOrCreateUser(clerkUserId: string) {
    let user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                clerkId: clerkUserId,
                name: 'Synapse Scholar',
                email: null,
                username: null,
                major: 'Computer Science',
                year: '',
                availability: '[]'
            }
        });
    }
    return user;
}
