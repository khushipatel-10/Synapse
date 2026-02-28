import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_NAMES = [
    "Aarav Patel", "Priya Iyer", "Daniel Kim", "Sarah Johnson", "Ahmed Hassan",
    "Mei Chen", "Maria Garcia", "John Rivera", "Emily Nguyen", "Lucas Silva",
    "Aisha Khan", "Noah Williams", "Sophia Martinez", "Liam Brown", "Olivia Davis",
    "Ethan Miller", "Ava Wilson", "Mason Moore", "Isabella Taylor", "William Anderson",
    "Mia Thomas", "James Jackson", "Charlotte White", "Benjamin Harris", "Amelia Martin",
    "Elijah Thompson", "Harper Garcia", "Oliver Martinez", "Evelyn Robinson", "Jacob Clark"
];

const DSA_CONCEPTS = [
    "Stacks", "Trees", "Sorting", "Hash Tables", "Graphs",
    "Linked Lists", "Dynamic Programming", "Arrays", "Recursion", "Queues"
];

const HUB_NAMES = [
    "Graph Grind", "DP Deep Dive", "Interview Prep Pod",
    "Trees and Heaps", "Beginner Foundations", "Weekend Sprint"
];

// Helper to generate a deterministic vector of size 12 for matching
function generateMockVector(userIndex: number, performanceValues: number[]): string {
    // Vector 12 elements based on user traits to ensure varied but stable clustering
    const vec = new Array(12).fill(0);
    for (let i = 0; i < 10; i++) {
        vec[i] = performanceValues[i] / 100.0; // Map 0-100 to 0-1
    }
    vec[10] = (userIndex % 5) / 5.0; // Some random seed value
    vec[11] = (userIndex % 3) / 3.0; // Some random seed value
    return `[${vec.join(',')}]`;
}

async function main() {
    console.log('Seeding Phase 12 Dev Data...');

    // 1. Maintain the CS101 Course
    const course = await prisma.course.upsert({
        where: { code: 'CS101' },
        update: {},
        create: {
            id: '15d92016-00f7-4fe7-b423-6ced0b269793',
            name: 'Data Structures',
            code: 'CS101'
        }
    });

    // 2. Ensure Assessment exists (Phase 9)
    await prisma.assessmentResponse.deleteMany();
    await prisma.assessmentAttempt.deleteMany();
    await prisma.assessmentQuestion.deleteMany();
    await prisma.assessment.deleteMany();

    const assessment = await prisma.assessment.create({
        data: {
            subject: 'DSA',
            title: 'Data Structures Mastery Diagnostic',
            description: 'Evaluate your foundational knowledge in Data Structures and Algorithms.'
        }
    });

    const dsaQuestions = [
        { questionText: 'Which data structure follows the Last-In-First-Out (LIFO) principle?', options: JSON.stringify(['Queue', 'Tree', 'Stack', 'Graph']), correctAnswer: 'Stack', conceptName: 'Stacks', difficulty: 'easy' },
        { questionText: 'What is the time complexity of searching a value in a balanced Binary Search Tree?', options: JSON.stringify(['O(1)', 'O(n)', 'O(log n)', 'O(n^2)']), correctAnswer: 'O(log n)', conceptName: 'Trees', difficulty: 'medium' },
        { questionText: 'Which sorting algorithm has a worst-case time complexity of O(n^2) but is often O(n log n) in practice?', options: JSON.stringify(['Merge Sort', 'Quick Sort', 'Heap Sort', 'Bubble Sort']), correctAnswer: 'Quick Sort', conceptName: 'Sorting', difficulty: 'medium' },
        { questionText: 'In a hash table, what handles the scenario when two keys map to the same index?', options: JSON.stringify(['Rehashing', 'Collision Resolution', 'Indexing', 'Garbage Collection']), correctAnswer: 'Collision Resolution', conceptName: 'Hash Tables', difficulty: 'easy' },
        { questionText: 'Which graph traversal algorithm uses a Queue?', options: JSON.stringify(['Depth First Search', 'Breadth First Search', 'Kruskals Algorithm', 'Dijkstras Algorithm']), correctAnswer: 'Breadth First Search', conceptName: 'Graphs', difficulty: 'medium' },
        { questionText: 'A linked list node typically contains data and...', options: JSON.stringify(['An index', 'A pointer to the next node', 'A hash key', 'A parent reference']), correctAnswer: 'A pointer to the next node', conceptName: 'Linked Lists', difficulty: 'easy' },
        { questionText: 'What technique involves solving a problem by solving smaller instances of the same problem and remembering results to avoid recomputation?', options: JSON.stringify(['Greedy Algorithm', 'Divide and Conquer', 'Dynamic Programming', 'Backtracking']), correctAnswer: 'Dynamic Programming', conceptName: 'Dynamic Programming', difficulty: 'hard' },
        { questionText: 'Which of the following operations is O(1) in a standard array?', options: JSON.stringify(['Searching an element', 'Inserting at the beginning', 'Accessing by index', 'Deleting an element']), correctAnswer: 'Accessing by index', conceptName: 'Arrays', difficulty: 'easy' },
        { questionText: 'What is the primary characteristic of a recursive function?', options: JSON.stringify(['It involves iteration like for/while', 'It calls itself with a base case', 'It is always faster', 'It uses no extra memory']), correctAnswer: 'It calls itself with a base case', conceptName: 'Recursion', difficulty: 'medium' },
        { questionText: 'Which data structure is best for implementing a priority queue?', options: JSON.stringify(['Array', 'Linked List', 'Binary Heap', 'Stack']), correctAnswer: 'Binary Heap', conceptName: 'Trees', difficulty: 'hard' }
    ];

    for (const q of dsaQuestions) {
        await prisma.assessmentQuestion.create({
            data: { assessmentId: assessment.id, ...q }
        });
    }

    // --- Added Extra Assessments ---
    const greAssessment = await prisma.assessment.create({
        data: {
            subject: 'GRE',
            title: 'GRE Quantitative & Verbal Check',
            description: 'Evaluate your readiness for graduate-level analytical reasoning, verbal comprehension, and math.'
        }
    });

    const greQuestions = [
        { questionText: 'If 3x + 5 = 20, what is the value of x?', options: JSON.stringify(['3', '4', '5', '6']), correctAnswer: '5', conceptName: 'Algebra', difficulty: 'easy' },
        { questionText: 'Choose the word most similar to "Ephemeral":', options: JSON.stringify(['Permanent', 'Pervasive', 'Transient', 'Luminous']), correctAnswer: 'Transient', conceptName: 'Vocabulary', difficulty: 'medium' },
        { questionText: 'What is the area of a circle with a radius of 4?', options: JSON.stringify(['8π', '16π', '4π', '12π']), correctAnswer: '16π', conceptName: 'Geometry', difficulty: 'medium' },
    ];
    for (const q of greQuestions) {
        await prisma.assessmentQuestion.create({ data: { assessmentId: greAssessment.id, ...q } });
    }

    const ieltsAssessment = await prisma.assessment.create({
        data: {
            subject: 'IELTS',
            title: 'IELTS English Proficiency Test',
            description: 'Determine your proficiency level in academic vocabulary, reading, and listening comprehension.'
        }
    });

    const ieltsQuestions = [
        { questionText: 'Identify the correct sentence:', options: JSON.stringify(['She don\'t like apples.', 'She doesn\'t likes apples.', 'She doesn\'t like apples.', 'She not like apples.']), correctAnswer: 'She doesn\'t like apples.', conceptName: 'Grammar', difficulty: 'easy' },
        { questionText: 'Which of the following is an academic linking word?', options: JSON.stringify(['So', 'Furthermore', 'And', 'But']), correctAnswer: 'Furthermore', conceptName: 'Writing', difficulty: 'medium' }
    ];
    for (const q of ieltsQuestions) {
        await prisma.assessmentQuestion.create({ data: { assessmentId: ieltsAssessment.id, ...q } });
    }

    const oopAssessment = await prisma.assessment.create({
        data: {
            subject: 'OOP',
            title: 'Object-Oriented Programming (OOP) Diagnostic',
            description: 'Test your understanding of classes, inheritance, polymorphism, and encapsulation.'
        }
    });

    const oopQuestions = [
        { questionText: 'Which OOP principle hides the internal state of an object?', options: JSON.stringify(['Polymorphism', 'Inheritance', 'Encapsulation', 'Abstraction']), correctAnswer: 'Encapsulation', conceptName: 'Encapsulation', difficulty: 'easy' },
        { questionText: 'When a subclass provides a specific implementation of a method already provided by its parent class, it is called:', options: JSON.stringify(['Overloading', 'Overriding', 'Inheriting', 'Casting']), correctAnswer: 'Overriding', conceptName: 'Polymorphism', difficulty: 'medium' }
    ];
    for (const q of oopQuestions) {
        await prisma.assessmentQuestion.create({ data: { assessmentId: oopAssessment.id, ...q } });
    }

    const confidenceAssessment = await prisma.assessment.create({
        data: {
            subject: 'General',
            title: 'Subject Confidence Check (Exclusive)',
            description: 'A self-reported subjective metric. Declare your confidence level across various academic modules.'
        }
    });

    const confQuestions = [
        { questionText: 'On a scale from limited to expert, how confident are you in taking timed technical exams?', options: JSON.stringify(['Very Unconfident', 'Somewhat Unconfident', 'Neutral', 'Confident', 'Very Confident']), correctAnswer: 'Confident', conceptName: 'Test Taking', difficulty: 'medium' },
        { questionText: 'How would you rate your ability to explain complex topics to peers?', options: JSON.stringify(['Beginner', 'Intermediate', 'Advanced', 'Expert']), correctAnswer: 'Advanced', conceptName: 'Teaching', difficulty: 'medium' }
    ];
    for (const q of confQuestions) {
        await prisma.assessmentQuestion.create({ data: { assessmentId: confidenceAssessment.id, ...q } });
    }

    // 3. Clear existing demo users safely
    // A demo user is identifiable by clerkId starting with demo_
    console.log('Cleaning up old demo data...');
    const demoUsers = await prisma.user.findMany({
        where: { clerkId: { startsWith: 'demo_' } }
    });

    const demoUserIds = demoUsers.map(u => u.id);

    if (demoUserIds.length > 0) {
        await prisma.conceptPerformance.deleteMany({ where: { userId: { in: demoUserIds } } });
        await prisma.learningState.deleteMany({ where: { userId: { in: demoUserIds } } });
        await prisma.userEmbedding.deleteMany({ where: { userId: { in: demoUserIds } } });
        await prisma.hubMember.deleteMany({ where: { userId: { in: demoUserIds } } });
        await prisma.joinRequest.deleteMany({ where: { userId: { in: demoUserIds } } });
        await prisma.networkEdge.deleteMany({ where: { OR: [{ userAId: { in: demoUserIds } }, { userBId: { in: demoUserIds } }] } });

        await prisma.peerConnection.deleteMany({ where: { OR: [{ requesterUserId: { in: demoUserIds } }, { receiverUserId: { in: demoUserIds } }] } });
        await prisma.messageParticipant.deleteMany({ where: { userId: { in: demoUserIds } } });
        await prisma.message.deleteMany({ where: { senderId: { in: demoUserIds } } });
        await prisma.hubMessage.deleteMany({ where: { senderId: { in: demoUserIds } } });
        await prisma.hubSession.deleteMany({ where: { createdById: { in: demoUserIds } } });

        const demoSessions = await prisma.aIStudySession.findMany({ where: { userId: { in: demoUserIds } } });
        const demoSessionIds = demoSessions.map(s => s.id);
        if (demoSessionIds.length > 0) {
            await prisma.aIScore.deleteMany({ where: { sessionId: { in: demoSessionIds } } });
            await prisma.aIStudySession.deleteMany({ where: { id: { in: demoSessionIds } } });
        }

        await prisma.user.deleteMany({ where: { id: { in: demoUserIds } } });
    }

    // Also clear existing hubs to recreate fresh ones
    await prisma.hubMember.deleteMany();
    await prisma.joinRequest.deleteMany();
    await prisma.hubMessage.deleteMany();
    await prisma.hubSession.deleteMany();
    await prisma.hub.deleteMany();

    // 4. Create new Demo Users
    console.log('Generating 30 realistic demo students...');
    const createdUsers = [];
    for (let i = 0; i < DEMO_NAMES.length; i++) {
        const user = await prisma.user.create({
            data: {
                name: DEMO_NAMES[i],
                clerkId: `demo_${i}`, // Unique demo marker
                major: ["Computer Science", "Data Science", "Software Engineering"][i % 3],
                year: ["Freshman", "Sophomore", "Junior", "Senior"][i % 4],
                availability: {}
            }
        });

        // Generate semi-random deterministic performance
        const performanceValues: number[] = [];
        let totalScore = 0;

        for (const concept of DSA_CONCEPTS) {
            // Some are strong in early concepts, some in late concepts based on index
            let score = 50 + (String(user.id).charCodeAt(0) % 30) + (i % 5 === 0 ? 20 : -10);
            if (concept === "Dynamic Programming" || concept === "Graphs") {
                score -= 20; // Harder topics
            }
            score = Math.max(0, Math.min(100, score));
            performanceValues.push(score);
            totalScore += score;

            await prisma.conceptPerformance.create({
                data: {
                    userId: user.id,
                    courseId: course.id,
                    conceptName: concept,
                    masteryScore: score,
                    attempts: 1 + (i % 3)
                }
            });
        }

        const avgScore = totalScore / DSA_CONCEPTS.length;

        await prisma.learningState.create({
            data: {
                userId: user.id,
                courseId: course.id,
                confidenceSelf: avgScore,
                confidenceAi: avgScore,
                averageScore: avgScore,
                frustrationIndex: 0.1,
                improvementRate: 0.05,
                videoSuccessScore: 0.5,
                textSuccessScore: 0.5,
                practiceSuccessScore: 0.8,
                conceptEntropy: 0.2
            }
        });

        // Insert vector using raw SQL
        const vectorStr = generateMockVector(i, performanceValues);
        await prisma.$executeRaw`
            INSERT INTO "UserEmbedding" (id, "userId", "courseId", embedding, version, "createdAt")
            VALUES (gen_random_uuid(), ${user.id}, ${course.id}, ${vectorStr}::vector(12), 1, NOW())
        `;

        createdUsers.push(user);
    }

    // 5. Create Hubs
    console.log('Creating 6 Community Hubs...');
    for (let i = 0; i < HUB_NAMES.length; i++) {
        const hub = await prisma.hub.create({
            data: {
                courseId: course.id,
                name: HUB_NAMES[i]
            }
        });

        // Assign members to hubs. 
        // Hubs 0-4 will have 4-6 members
        // Hub 5 "Weekend Sprint" will only have 1 member (highly joinable)
        const memberCount = i === 5 ? 1 : 3 + (i % 3);

        for (let j = 0; j < memberCount; j++) {
            // Pick a user sequentially to distribute them
            const userIndex = (i * 5 + j) % createdUsers.length;
            const targetUser = createdUsers[userIndex];

            await prisma.hubMember.create({
                data: {
                    hubId: hub.id,
                    userId: targetUser.id,
                    role: j === 0 ? "owner" : "member",
                    status: "active"
                }
            });
        }
    }

    console.log('Seed completed successfully. Product is now alive.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
