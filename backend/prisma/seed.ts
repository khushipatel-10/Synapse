import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Real embedding computation (mirrors EmbeddingService exactly) ────────────
const EMBEDDING_BOUNDS = [
    [0, 100],   // confidence_gap
    [0, 100],   // average_score
    [0, 1],     // frustration_index
    [0, 10],    // improvement_rate
    [0, 100],   // video_success_score
    [0, 100],   // text_success_score
    [0, 100],   // practice_success_score
    [0, 1],     // concept_entropy
    [0, 100],   // confidence_self
    [0, 100],   // confidence_ai
    [0, 2500],  // score_variance
    [0, 1],     // recent_activity_score
];

function computeRealVector(ls: {
    confidenceSelf: number; confidenceAi: number; averageScore: number;
    frustrationIndex: number; improvementRate: number; videoSuccessScore: number;
    textSuccessScore: number; practiceSuccessScore: number; conceptEntropy: number;
}): string {
    const confidence_gap = Math.abs(ls.confidenceSelf - ls.confidenceAi);
    const score_variance = Math.pow(ls.improvementRate, 2) * 2;
    const recent_activity = 1.0; // all seeds are "just updated"

    const raw = [
        confidence_gap, ls.averageScore, ls.frustrationIndex, ls.improvementRate,
        ls.videoSuccessScore, ls.textSuccessScore, ls.practiceSuccessScore,
        ls.conceptEntropy, ls.confidenceSelf, ls.confidenceAi,
        score_variance, recent_activity
    ];

    const normalized = raw.map((val, i) => {
        const [min, max] = EMBEDDING_BOUNDS[i];
        return Math.max(0, Math.min(1, (val - min) / (max - min)));
    });

    return `[${normalized.join(',')}]`;
}

// ─── 30 students with distinct learning profiles ──────────────────────────────
const STUDENTS = [
    { name: "Aarav Patel",      major: "Computer Science",     year: "Junior",    profile: "graphs_strong_dp_weak" },
    { name: "Priya Iyer",       major: "Data Science",         year: "Sophomore", profile: "dp_strong_trees_weak" },
    { name: "Daniel Kim",       major: "Software Engineering", year: "Senior",    profile: "balanced_high" },
    { name: "Sarah Johnson",    major: "Computer Science",     year: "Freshman",  profile: "beginner" },
    { name: "Ahmed Hassan",     major: "Data Science",         year: "Junior",    profile: "sorting_strong_graphs_weak" },
    { name: "Mei Chen",         major: "Software Engineering", year: "Sophomore", profile: "dp_strong_graphs_weak" },
    { name: "Maria Garcia",     major: "Computer Science",     year: "Senior",    profile: "balanced_high" },
    { name: "John Rivera",      major: "Data Science",         year: "Junior",    profile: "trees_strong_dp_weak" },
    { name: "Emily Nguyen",     major: "Software Engineering", year: "Freshman",  profile: "beginner" },
    { name: "Lucas Silva",      major: "Computer Science",     year: "Sophomore", profile: "graphs_strong_sorting_weak" },
    { name: "Aisha Khan",       major: "Data Science",         year: "Junior",    profile: "sorting_strong_trees_weak" },
    { name: "Noah Williams",    major: "Software Engineering", year: "Senior",    profile: "balanced_high" },
    { name: "Sophia Martinez",  major: "Computer Science",     year: "Freshman",  profile: "beginner" },
    { name: "Liam Brown",       major: "Data Science",         year: "Sophomore", profile: "trees_strong_sorting_weak" },
    { name: "Olivia Davis",     major: "Software Engineering", year: "Junior",    profile: "dp_strong_sorting_weak" },
    { name: "Ethan Miller",     major: "Computer Science",     year: "Senior",    profile: "balanced_high" },
    { name: "Ava Wilson",       major: "Data Science",         year: "Freshman",  profile: "beginner" },
    { name: "Mason Moore",      major: "Software Engineering", year: "Sophomore", profile: "graphs_strong_dp_weak" },
    { name: "Isabella Taylor",  major: "Computer Science",     year: "Junior",    profile: "sorting_strong_dp_weak" },
    { name: "William Anderson", major: "Data Science",         year: "Senior",    profile: "balanced_high" },
    { name: "Mia Thomas",       major: "Software Engineering", year: "Freshman",  profile: "beginner" },
    { name: "James Jackson",    major: "Computer Science",     year: "Sophomore", profile: "trees_strong_graphs_weak" },
    { name: "Charlotte White",  major: "Data Science",         year: "Junior",    profile: "dp_strong_trees_weak" },
    { name: "Benjamin Harris",  major: "Software Engineering", year: "Senior",    profile: "balanced_high" },
    { name: "Amelia Martin",    major: "Computer Science",     year: "Freshman",  profile: "beginner" },
    { name: "Elijah Thompson",  major: "Data Science",         year: "Sophomore", profile: "graphs_strong_sorting_weak" },
    { name: "Harper Garcia",    major: "Software Engineering", year: "Junior",    profile: "sorting_strong_graphs_weak" },
    { name: "Oliver Martinez",  major: "Computer Science",     year: "Senior",    profile: "balanced_high" },
    { name: "Evelyn Robinson",  major: "Data Science",         year: "Freshman",  profile: "beginner" },
    { name: "Jacob Clark",      major: "Software Engineering", year: "Sophomore", profile: "dp_strong_graphs_weak" },
];

const DSA_CONCEPTS = [
    "Stacks", "Trees", "Sorting", "Hash Tables", "Graphs",
    "Linked Lists", "Dynamic Programming", "Arrays", "Recursion", "Queues"
];

// Profile → concept mastery scores (deterministic, genuinely varied)
function conceptMastery(profile: string, concept: string): number {
    const base: Record<string, Record<string, number>> = {
        balanced_high:          { default: 83, "Dynamic Programming": 80, "Graphs": 81 },
        beginner:               { default: 42, "Arrays": 58, "Stacks": 55, "Queues": 52, "Linked Lists": 46, "Trees": 38, "Graphs": 28, "Dynamic Programming": 22, "Sorting": 40, "Recursion": 35, "Hash Tables": 33 },
        graphs_strong_dp_weak:  { default: 70, "Graphs": 91, "Dynamic Programming": 30, "Trees": 72, "Sorting": 70 },
        dp_strong_trees_weak:   { default: 68, "Dynamic Programming": 90, "Trees": 32, "Graphs": 60, "Sorting": 70 },
        sorting_strong_graphs_weak: { default: 70, "Sorting": 92, "Graphs": 30, "Dynamic Programming": 50, "Trees": 66 },
        dp_strong_graphs_weak:  { default: 72, "Dynamic Programming": 91, "Graphs": 30, "Trees": 65, "Sorting": 70 },
        trees_strong_dp_weak:   { default: 70, "Trees": 92, "Dynamic Programming": 30, "Graphs": 60, "Sorting": 68 },
        graphs_strong_sorting_weak: { default: 68, "Graphs": 90, "Sorting": 30, "Dynamic Programming": 48, "Trees": 70 },
        sorting_strong_trees_weak:  { default: 70, "Sorting": 91, "Trees": 30, "Graphs": 56, "Dynamic Programming": 50 },
        trees_strong_sorting_weak:  { default: 70, "Trees": 91, "Sorting": 30, "Dynamic Programming": 48, "Graphs": 60 },
        dp_strong_sorting_weak: { default: 72, "Dynamic Programming": 90, "Sorting": 30, "Trees": 67, "Graphs": 59 },
        sorting_strong_dp_weak: { default: 72, "Sorting": 91, "Dynamic Programming": 30, "Trees": 68, "Graphs": 60 },
        trees_strong_graphs_weak: { default: 70, "Trees": 91, "Graphs": 30, "Dynamic Programming": 48, "Sorting": 67 },
    };
    const map = base[profile] ?? base.beginner;
    const score = map[concept] ?? map['default'] ?? 60;
    return Math.max(0, Math.min(100, score + (Math.random() * 8 - 4)));
}

// Derive honest LearningState from concept scores
function deriveLearningState(profile: string, conceptScores: number[]) {
    const avg = conceptScores.reduce((a, b) => a + b, 0) / conceptScores.length;
    const variance = conceptScores.reduce((s, c) => s + Math.pow(c - avg, 2), 0) / conceptScores.length;
    const conceptEntropy = Math.min(1, Math.sqrt(variance) / 50);

    const isBeginner = profile === 'beginner';
    const isAdvanced = profile === 'balanced_high';

    const frustrationIndex = isBeginner ? 0.5 + Math.random() * 0.2
        : isAdvanced ? 0.05 + Math.random() * 0.08
        : 0.15 + Math.random() * 0.15;

    const improvementRate = isBeginner ? 0.5 + Math.random() * 0.5
        : isAdvanced ? 2.0 + Math.random() * 1.5
        : 1.0 + Math.random() * 0.8;

    return {
        confidenceSelf: Math.round(avg * 0.9 + Math.random() * 8),
        confidenceAi: Math.round(avg),
        averageScore: Math.round(avg * 10) / 10,
        frustrationIndex: Math.round(frustrationIndex * 1000) / 1000,
        improvementRate: Math.round(improvementRate * 100) / 100,
        videoSuccessScore: Math.min(100, avg * 0.85 + Math.random() * 10),
        textSuccessScore: Math.min(100, avg * 0.9 + Math.random() * 8),
        practiceSuccessScore: Math.min(100, avg * 0.95 + Math.random() * 5),
        conceptEntropy: Math.round(conceptEntropy * 1000) / 1000,
    };
}

const PREFERENCES = [
    { studyPace: "fast",     studyMode: "solo",   learningStyle: "visual",   goal: "career",  subjectInterests: ["DSA", "System Design"] },
    { studyPace: "moderate", studyMode: "group",  learningStyle: "reading",  goal: "grades",  subjectInterests: ["DSA", "OOP"] },
    { studyPace: "slow",     studyMode: "group",  learningStyle: "practice", goal: "mastery", subjectInterests: ["DSA", "Math"] },
    { studyPace: "fast",     studyMode: "hybrid", learningStyle: "visual",   goal: "career",  subjectInterests: ["DSA", "System Design", "ML"] },
    { studyPace: "moderate", studyMode: "solo",   learningStyle: "practice", goal: "mastery", subjectInterests: ["DSA"] },
];

const HUB_NAMES = [
    "Graph Grind", "DP Deep Dive", "Interview Prep Pod",
    "Trees & Heaps", "Beginner Foundations", "Weekend Sprint"
];

const HUB_MESSAGES: Record<string, string[]> = {
    "Graph Grind": [
        "Just solved Dijkstra's in O((V+E) log V) — the priority queue is the key insight!",
        "Anyone working on bipartite graph detection? I keep getting the coloring logic wrong.",
        "Pro tip: always clarify directed vs undirected before starting.",
        "When do you use Bellman-Ford over Dijkstra's?",
        "When there are negative weight edges. Dijkstra's assumes non-negative weights only."
    ],
    "DP Deep Dive": [
        "Finally memorised 0/1 Knapsack. Thinking 'include or exclude' unlocked it for me.",
        "Can someone explain memoization vs tabulation? I keep using them interchangeably.",
        "Memoization = top-down (recursive + cache). Tabulation = bottom-up (iterative). Same result, different approach.",
        "Longest Increasing Subsequence is still my nemesis.",
        "Start with the patience sorting analogy — it makes LIS much more intuitive."
    ],
    "Interview Prep Pod": [
        "Behavioural round went well! STAR format really structures answers cleanly.",
        "For system design: always clarify scale requirements before jumping into architecture.",
        "Mock interview slot open Saturday 2pm if anyone wants practice.",
        "Which sorting algo should I know cold for interviews?",
        "Quicksort (avg O(n log n)), Mergesort (stable), and when to use each. That's the full answer."
    ],
    "Beginner Foundations": [
        "Finally understood why arrays are O(1) access — contiguous memory + pointer arithmetic!",
        "Recursion clicked today. Base case + recursive step. That's literally it.",
        "Stacks and queues feel abstract at first but make sense once you implement undo/redo or a task queue.",
        "What's the actual difference between a stack and a queue?",
        "Stack = LIFO (last in, first out). Queue = FIFO (first in, first out). Different exit orders."
    ],
};

// ─── Assessment bank ──────────────────────────────────────────────────────────

const ASSESSMENTS = [
    {
        subject: 'DSA',
        title: 'Data Structures & Algorithms Diagnostic',
        description: 'Evaluate your foundational knowledge in Data Structures and Algorithms — the core of technical interviews and CS coursework.',
        questions: [
            { q: 'Which data structure follows LIFO?', opts: ['Queue', 'Tree', 'Stack', 'Graph'], ans: 'Stack', concept: 'Stacks', diff: 'easy' },
            { q: 'Time complexity of search in a balanced BST?', opts: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], ans: 'O(log n)', concept: 'Trees', diff: 'medium' },
            { q: 'Which sorting algorithm uses a pivot to partition?', opts: ['Merge Sort', 'Quick Sort', 'Heap Sort', 'Bubble Sort'], ans: 'Quick Sort', concept: 'Sorting', diff: 'medium' },
            { q: 'What resolves two keys mapping to the same hash index?', opts: ['Rehashing', 'Collision Resolution', 'Indexing', 'Garbage Collection'], ans: 'Collision Resolution', concept: 'Hash Tables', diff: 'easy' },
            { q: 'BFS uses which data structure?', opts: ['Stack', 'Queue', 'Heap', 'Tree'], ans: 'Queue', concept: 'Graphs', diff: 'easy' },
            { q: 'A linked list node contains data and...?', opts: ['An index', 'A pointer to the next node', 'A hash key', 'A parent reference'], ans: 'A pointer to the next node', concept: 'Linked Lists', diff: 'easy' },
            { q: 'What technique memoises sub-problem results to avoid recomputation?', opts: ['Greedy', 'Divide and Conquer', 'Dynamic Programming', 'Backtracking'], ans: 'Dynamic Programming', concept: 'Dynamic Programming', diff: 'hard' },
            { q: 'Which array operation is O(1)?', opts: ['Search', 'Insert at beginning', 'Access by index', 'Delete element'], ans: 'Access by index', concept: 'Arrays', diff: 'easy' },
            { q: 'What must every recursive function have?', opts: ['Iteration', 'A base case', 'Always faster execution', 'No extra memory'], ans: 'A base case', concept: 'Recursion', diff: 'medium' },
            { q: 'Best structure for a priority queue?', opts: ['Array', 'Linked List', 'Binary Heap', 'Stack'], ans: 'Binary Heap', concept: 'Trees', diff: 'hard' },
            { q: 'DFS uses which data structure?', opts: ['Queue', 'Heap', 'Stack', 'Hash Table'], ans: 'Stack', concept: 'Graphs', diff: 'medium' },
            { q: 'Worst-case time for Quicksort?', opts: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], ans: 'O(n²)', concept: 'Sorting', diff: 'hard' },
        ]
    },
    {
        subject: 'Machine Learning',
        title: 'Machine Learning Fundamentals Diagnostic',
        description: 'Test your understanding of ML algorithms, model evaluation, and core mathematical concepts behind learning systems.',
        questions: [
            { q: 'Which algorithm finds the decision boundary that maximises the margin?', opts: ['Decision Tree', 'SVM', 'KNN', 'Naïve Bayes'], ans: 'SVM', concept: 'Classification', diff: 'medium' },
            { q: 'What does overfitting mean?', opts: ['Model performs well on training, poorly on test', 'Model performs poorly on both', 'Model has too few parameters', 'Model trains too slowly'], ans: 'Model performs well on training, poorly on test', concept: 'Model Evaluation', diff: 'easy' },
            { q: 'Which metric is best for imbalanced classification?', opts: ['Accuracy', 'F1 Score', 'Mean Squared Error', 'R²'], ans: 'F1 Score', concept: 'Model Evaluation', diff: 'medium' },
            { q: 'L2 regularisation is also called?', opts: ['Lasso', 'Ridge', 'Dropout', 'Batch Norm'], ans: 'Ridge', concept: 'Regularisation', diff: 'medium' },
            { q: 'What does the kernel trick in SVMs allow?', opts: ['Faster training', 'Operating in high-dimensional feature space implicitly', 'Reducing overfitting', 'Handling missing data'], ans: 'Operating in high-dimensional feature space implicitly', concept: 'Classification', diff: 'hard' },
            { q: 'K-Means is what type of learning?', opts: ['Supervised', 'Reinforcement', 'Unsupervised', 'Semi-supervised'], ans: 'Unsupervised', concept: 'Clustering', diff: 'easy' },
            { q: 'Which activation function outputs values in (0,1)?', opts: ['ReLU', 'Tanh', 'Sigmoid', 'Softmax'], ans: 'Sigmoid', concept: 'Neural Networks', diff: 'easy' },
            { q: 'Gradient descent with mini-batches is called?', opts: ['Batch GD', 'Stochastic GD', 'Mini-batch GD', 'Adam'], ans: 'Mini-batch GD', concept: 'Optimisation', diff: 'medium' },
            { q: 'What does cross-validation protect against?', opts: ['Underfitting', 'Overfitting to a specific train/test split', 'Slow inference', 'Label noise'], ans: 'Overfitting to a specific train/test split', concept: 'Model Evaluation', diff: 'medium' },
            { q: 'Random Forest reduces variance by...?', opts: ['Using a single deep tree', 'Averaging predictions from many trees', 'Increasing learning rate', 'Applying L1 regularisation'], ans: 'Averaging predictions from many trees', concept: 'Ensemble Methods', diff: 'hard' },
        ]
    },
    {
        subject: 'Mathematics',
        title: 'Applied Mathematics Diagnostic',
        description: 'Assess your grasp of calculus, linear algebra, and probability — the mathematical backbone of computer science and data science.',
        questions: [
            { q: 'Derivative of f(x) = x³?', opts: ['x²', '3x', '3x²', '2x³'], ans: '3x²', concept: 'Calculus', diff: 'easy' },
            { q: 'The dot product of vectors [1,2] and [3,4]?', opts: ['7', '10', '11', '14'], ans: '11', concept: 'Linear Algebra', diff: 'easy' },
            { q: 'P(A ∩ B) when A and B are independent?', opts: ['P(A) + P(B)', 'P(A) × P(B)', 'P(A|B)', 'P(A) - P(B)'], ans: 'P(A) × P(B)', concept: 'Probability', diff: 'medium' },
            { q: 'What is the rank of a matrix?', opts: ['Number of rows', 'Number of columns', 'Number of linearly independent rows/columns', 'Determinant'], ans: 'Number of linearly independent rows/columns', concept: 'Linear Algebra', diff: 'medium' },
            { q: '∫2x dx = ?', opts: ['x', '2x²', 'x² + C', '2 + C'], ans: 'x² + C', concept: 'Calculus', diff: 'easy' },
            { q: 'Expected value of a fair six-sided die?', opts: ['3', '3.5', '4', '2.5'], ans: '3.5', concept: 'Probability', diff: 'medium' },
            { q: 'Eigenvalues of the identity matrix are all?', opts: ['0', '1', 'Undefined', 'Equal to the matrix size'], ans: '1', concept: 'Linear Algebra', diff: 'hard' },
            { q: 'The chain rule applies to?', opts: ['Integrals of sums', 'Derivatives of composite functions', 'Matrix multiplication', 'Probability distributions'], ans: 'Derivatives of composite functions', concept: 'Calculus', diff: 'hard' },
        ]
    },
    {
        subject: 'Database Systems',
        title: 'Database Systems Diagnostic',
        description: 'Test your knowledge of SQL, relational design, normalisation, indexing, and transaction management.',
        questions: [
            { q: 'Which SQL clause filters rows after grouping?', opts: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'], ans: 'HAVING', concept: 'SQL', diff: 'medium' },
            { q: '3rd Normal Form (3NF) eliminates?', opts: ['Duplicate rows', 'Transitive dependencies', 'NULL values', 'Foreign keys'], ans: 'Transitive dependencies', concept: 'Normalisation', diff: 'hard' },
            { q: 'A B-tree index improves performance most for?', opts: ['Full table scans', 'Range queries and equality lookups', 'Aggregate functions only', 'INSERT operations'], ans: 'Range queries and equality lookups', concept: 'Indexing', diff: 'medium' },
            { q: 'ACID stands for?', opts: ['Atomicity, Consistency, Isolation, Durability', 'Access, Control, Index, Data', 'Array, Column, Insert, Delete', 'Autonomy, Concurrency, Integrity, Distribution'], ans: 'Atomicity, Consistency, Isolation, Durability', concept: 'Transactions', diff: 'easy' },
            { q: 'A foreign key references?', opts: ['Any column in any table', 'The primary key of another table', 'A unique index', 'A view'], ans: 'The primary key of another table', concept: 'SQL', diff: 'easy' },
            { q: 'Which JOIN returns all rows from both tables including unmatched?', opts: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'], ans: 'FULL OUTER JOIN', concept: 'SQL', diff: 'medium' },
            { q: 'What does a deadlock mean in a database?', opts: ['A query runs forever', 'Two transactions wait for each other to release locks', 'An index is corrupt', 'A constraint violation'], ans: 'Two transactions wait for each other to release locks', concept: 'Transactions', diff: 'hard' },
        ]
    },
    {
        subject: 'Operating Systems',
        title: 'Operating Systems Concepts Diagnostic',
        description: 'Evaluate your understanding of processes, threads, memory management, scheduling, and concurrency.',
        questions: [
            { q: 'What is a process?', opts: ['A program in execution', 'A file on disk', 'A CPU register', 'A memory page'], ans: 'A program in execution', concept: 'Processes', diff: 'easy' },
            { q: 'Round Robin scheduling uses?', opts: ['Priority queues', 'Time quantum (time slice)', 'FIFO order only', 'Random selection'], ans: 'Time quantum (time slice)', concept: 'Scheduling', diff: 'easy' },
            { q: 'Virtual memory allows?', opts: ['Faster CPU execution', 'Programs to use more memory than physically available', 'Direct hardware access', 'Shared memory across networks'], ans: 'Programs to use more memory than physically available', concept: 'Memory Management', diff: 'medium' },
            { q: 'A mutex prevents?', opts: ['Deadlocks', 'Race conditions by mutual exclusion', 'Memory leaks', 'Page faults'], ans: 'Race conditions by mutual exclusion', concept: 'Concurrency', diff: 'medium' },
            { q: 'What is a page fault?', opts: ['A hardware failure', 'Accessing a memory page not currently in RAM', 'A bad disk sector', 'An invalid pointer dereference'], ans: 'Accessing a memory page not currently in RAM', concept: 'Memory Management', diff: 'medium' },
            { q: 'Thrashing occurs when?', opts: ['CPU utilisation reaches 100%', 'Processes spend more time swapping pages than executing', 'Too many threads are created', 'I/O waits dominate'], ans: 'Processes spend more time swapping pages than executing', concept: 'Memory Management', diff: 'hard' },
            { q: 'What distinguishes a thread from a process?', opts: ['Threads have separate memory spaces', 'Threads share memory space within a process', 'Threads run on separate CPUs only', 'Threads cannot communicate'], ans: 'Threads share memory space within a process', concept: 'Processes', diff: 'medium' },
            { q: 'The Banker\'s Algorithm solves?', opts: ['Page replacement', 'CPU scheduling', 'Deadlock avoidance', 'Memory allocation'], ans: 'Deadlock avoidance', concept: 'Concurrency', diff: 'hard' },
        ]
    },
    {
        subject: 'Statistics',
        title: 'Statistics & Probability Diagnostic',
        description: 'Test your fluency with descriptive statistics, hypothesis testing, distributions, and statistical inference.',
        questions: [
            { q: 'The median is resistant to?', opts: ['Small samples', 'Outliers', 'Normal distributions', 'Large variance'], ans: 'Outliers', concept: 'Descriptive Statistics', diff: 'easy' },
            { q: 'A p-value < 0.05 means?', opts: ['Null hypothesis is true', 'Strong practical significance', 'Result is statistically significant at 5% level', 'Effect size is large'], ans: 'Result is statistically significant at 5% level', concept: 'Hypothesis Testing', diff: 'medium' },
            { q: 'Standard deviation measures?', opts: ['Central tendency', 'Spread of data around the mean', 'Skewness', 'Correlation'], ans: 'Spread of data around the mean', concept: 'Descriptive Statistics', diff: 'easy' },
            { q: 'A normal distribution is characterised by?', opts: ['Skewed tail', 'Bell curve, symmetric around mean', 'Only positive values', 'Discrete outcomes'], ans: 'Bell curve, symmetric around mean', concept: 'Distributions', diff: 'easy' },
            { q: 'Pearson correlation of −1 means?', opts: ['No relationship', 'Perfect positive linear relationship', 'Perfect negative linear relationship', 'Non-linear relationship'], ans: 'Perfect negative linear relationship', concept: 'Correlation', diff: 'medium' },
            { q: 'Type I error is?', opts: ['Failing to reject a false null hypothesis', 'Rejecting a true null hypothesis', 'Low statistical power', 'High p-value'], ans: 'Rejecting a true null hypothesis', concept: 'Hypothesis Testing', diff: 'hard' },
            { q: 'The Central Limit Theorem states?', opts: ['All data is normally distributed', 'Sample means approximate normal distribution for large n', 'Variance equals the mean', 'Population must be normal'], ans: 'Sample means approximate normal distribution for large n', concept: 'Distributions', diff: 'hard' },
        ]
    },
    {
        subject: 'OOP',
        title: 'Object-Oriented Programming Diagnostic',
        description: 'Test your grasp of classes, inheritance, polymorphism, encapsulation, and SOLID design principles.',
        questions: [
            { q: 'Which OOP principle hides internal state?', opts: ['Polymorphism', 'Inheritance', 'Encapsulation', 'Abstraction'], ans: 'Encapsulation', concept: 'Encapsulation', diff: 'easy' },
            { q: 'Method overriding is an example of?', opts: ['Encapsulation', 'Abstraction', 'Compile-time polymorphism', 'Runtime polymorphism'], ans: 'Runtime polymorphism', concept: 'Polymorphism', diff: 'medium' },
            { q: 'The "D" in SOLID stands for?', opts: ['Dependency Injection', 'Dependency Inversion Principle', 'Data Abstraction', 'Dynamic Dispatch'], ans: 'Dependency Inversion Principle', concept: 'Design Principles', diff: 'hard' },
            { q: 'An abstract class cannot?', opts: ['Have methods', 'Be subclassed', 'Be instantiated directly', 'Declare fields'], ans: 'Be instantiated directly', concept: 'Abstraction', diff: 'medium' },
            { q: 'Composition over inheritance is preferred because?', opts: ['It is faster', 'It avoids tight coupling and brittle hierarchies', 'It uses less memory', 'It is easier to write'], ans: 'It avoids tight coupling and brittle hierarchies', concept: 'Design Principles', diff: 'hard' },
        ]
    },
    {
        subject: 'System Design',
        title: 'System Design Fundamentals Diagnostic',
        description: 'Assess your understanding of scalability, distributed systems, caching, databases at scale, and API design.',
        questions: [
            { q: 'Horizontal scaling means?', opts: ['Adding more RAM to one server', 'Adding more servers', 'Increasing CPU cores', 'Optimising queries'], ans: 'Adding more servers', concept: 'Scalability', diff: 'easy' },
            { q: 'A CDN primarily reduces?', opts: ['Database load', 'Latency by serving content from geographically closer nodes', 'Compute costs', 'Authentication overhead'], ans: 'Latency by serving content from geographically closer nodes', concept: 'Performance', diff: 'easy' },
            { q: 'CAP theorem states a distributed system can guarantee at most?', opts: ['All three: consistency, availability, partition tolerance', 'Two of: consistency, availability, partition tolerance', 'Either consistency or availability', 'Neither consistency nor availability'], ans: 'Two of: consistency, availability, partition tolerance', concept: 'Distributed Systems', diff: 'hard' },
            { q: 'Eventual consistency is a property of?', opts: ['SQL databases', 'NoSQL and distributed datastores', 'In-memory caches only', 'File systems'], ans: 'NoSQL and distributed datastores', concept: 'Distributed Systems', diff: 'medium' },
            { q: 'A message queue decouples producers and consumers to?', opts: ['Increase database performance', 'Enable async processing and absorb traffic spikes', 'Enforce ACID transactions', 'Reduce API latency directly'], ans: 'Enable async processing and absorb traffic spikes', concept: 'Architecture', diff: 'medium' },
            { q: 'Rate limiting protects APIs from?', opts: ['SQL injection', 'Abuse and overload', 'XSS attacks', 'Data leaks'], ans: 'Abuse and overload', concept: 'Architecture', diff: 'easy' },
            { q: 'Consistent hashing is used in?', opts: ['Sorting algorithms', 'Distributing keys evenly across nodes in a distributed cache', 'SQL indexing', 'Load balancing HTTP requests only'], ans: 'Distributing keys evenly across nodes in a distributed cache', concept: 'Distributed Systems', diff: 'hard' },
        ]
    },
];

async function main() {
    console.log('🌱 Seeding Synapse with real learning profiles...');

    // Course
    const course = await prisma.course.upsert({
        where: { code: 'CS101' },
        update: {},
        create: {
            id: '15d92016-00f7-4fe7-b423-6ced0b269793',
            name: 'Data Structures & Algorithms',
            code: 'CS101'
        }
    });

    // Clear old assessments
    await prisma.assessmentResponse.deleteMany();
    await prisma.assessmentAttempt.deleteMany();
    await prisma.assessmentQuestion.deleteMany();
    await prisma.assessment.deleteMany();

    // Seed all assessments
    console.log(`📋 Creating ${ASSESSMENTS.length} assessments...`);
    for (const a of ASSESSMENTS) {
        const assessment = await prisma.assessment.create({
            data: { subject: a.subject, title: a.title, description: a.description }
        });
        for (const q of a.questions) {
            await prisma.assessmentQuestion.create({
                data: {
                    assessmentId: assessment.id,
                    questionText: q.q,
                    options: JSON.stringify(q.opts),
                    correctAnswer: q.ans,
                    conceptName: q.concept,
                    difficulty: q.diff
                }
            });
        }
    }

    // Refresh demo-user data only — never touch real users' hubs, connections, or hub memberships
    console.log('🧹 Refreshing demo student data (preserving real user state)...');
    const demoUsers = await prisma.user.findMany({ where: { clerkId: { startsWith: 'demo_' } } });
    const demoIds = demoUsers.map(u => u.id);

    if (demoIds.length > 0) {
        // Refresh AI sessions
        const sessions = await prisma.aIStudySession.findMany({ where: { userId: { in: demoIds } } });
        const sessionIds = sessions.map(s => s.id);
        if (sessionIds.length > 0) {
            await prisma.aIScore.deleteMany({ where: { sessionId: { in: sessionIds } } });
            await prisma.aIStudySession.deleteMany({ where: { id: { in: sessionIds } } });
        }
        // Refresh learning data
        await prisma.conceptPerformance.deleteMany({ where: { userId: { in: demoIds } } });
        await prisma.learningState.deleteMany({ where: { userId: { in: demoIds } } });
        await prisma.userEmbedding.deleteMany({ where: { userId: { in: demoIds } } });
        // Refresh hub presence (hub memberships recreated below via upsert)
        await prisma.hubMember.deleteMany({ where: { userId: { in: demoIds } } });
        await prisma.hubMessage.deleteMany({ where: { senderId: { in: demoIds } } });
        await prisma.hubSession.deleteMany({ where: { createdById: { in: demoIds } } });
        // Clean demo-user network edges and join requests
        await prisma.networkEdge.deleteMany({ where: { OR: [{ userAId: { in: demoIds } }, { userBId: { in: demoIds } }] } });
        await prisma.joinRequest.deleteMany({ where: { userId: { in: demoIds } } });
        // NOTE: intentionally NOT deleting peerConnections or messageThreads involving demo users
        // so that real users' sent connection requests to demo students are preserved
    }

    // Create 30 students with STABLE IDs — same ID every run so connections survive re-seeding
    console.log('👥 Upserting 30 students with stable IDs and real learning vectors...');
    const createdUsers: any[] = [];

    for (let i = 0; i < STUDENTS.length; i++) {
        const s = STUDENTS[i];
        // Stable deterministic UUID: 00000000-0000-0000-0000-000000000001 through ...0030
        const stableId = `00000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
        const user = await prisma.user.upsert({
            where: { clerkId: `demo_${i}` },
            update: { name: s.name, major: s.major, year: s.year },
            create: { id: stableId, name: s.name, clerkId: `demo_${i}`, major: s.major, year: s.year, availability: {} }
        });

        // Generate concept scores from profile
        const conceptScores: number[] = [];
        for (const concept of DSA_CONCEPTS) {
            const score = conceptMastery(s.profile, concept);
            conceptScores.push(score);
            await prisma.conceptPerformance.create({
                data: {
                    userId: user.id, courseId: course.id,
                    conceptName: concept, masteryScore: score,
                    attempts: 1 + (i % 4),
                    lastPracticed: new Date(Date.now() - Math.random() * 5 * 86400000)
                }
            });
        }

        // Derive LearningState from actual concept scores
        const ls = deriveLearningState(s.profile, conceptScores);
        const learningState = await prisma.learningState.create({
            data: { userId: user.id, courseId: course.id, ...ls }
        });

        // Compute REAL 12D embedding from LearningState (same formula as EmbeddingService)
        const vectorStr = computeRealVector(ls);
        await prisma.$executeRaw`
            INSERT INTO "UserEmbedding" (id, "userId", "courseId", embedding, version, "createdAt")
            VALUES (gen_random_uuid(), ${user.id}, ${course.id}, ${vectorStr}::vector(12), 1, NOW())
        `;

        // Preferences
        const pref = PREFERENCES[i % PREFERENCES.length];
        await prisma.userPreferences.upsert({
            where: { clerkUserId: `demo_${i}` },
            update: {},
            create: {
                clerkUserId: `demo_${i}`, ...pref,
                subjectInterests: pref.subjectInterests,
                preferredGroupSize: i % 3 === 0 ? 'pair' : i % 3 === 1 ? 'small' : 'large',
                offlineOrOnline: i % 2 === 0 ? 'online' : 'hybrid',
                timezone: 'UTC',
                materialPreferred: i % 3 === 0 ? 'video' : i % 3 === 1 ? 'text' : 'mixed'
            }
        });

        createdUsers.push({ ...user, profile: s.profile, learningState });
    }

    // Seed AI study sessions for non-beginner students
    console.log('🤖 Seeding AI coaching sessions...');
    const concepts = ["Dynamic Programming", "Graph Traversal", "Binary Trees", "Sorting", "Hash Tables"];
    for (let i = 0; i < Math.min(18, createdUsers.length); i++) {
        const u = createdUsers[i];
        const concept = concepts[i % concepts.length];
        const isStrong = u.profile.startsWith(concept.toLowerCase().split(' ')[0]);
        const comp = isStrong ? 82 : u.profile === 'balanced_high' ? 80 : 52;
        const impl = isStrong ? 78 : u.profile === 'balanced_high' ? 75 : 45;
        const integ = isStrong ? 80 : u.profile === 'balanced_high' ? 77 : 48;

        const session = await prisma.aIStudySession.create({
            data: {
                userId: u.id, courseId: course.id,
                pdfName: `${concept} — Lecture Notes.pdf`,
                pdfText: `Introduction to ${concept}. Core concepts, complexity analysis, and practical applications.`,
                status: 'completed',
                transcript: `user: Let me ask about ${concept}.\nassistant: Great — what do you already know?\nuser: I know the basics.\nassistant: Walk me through the time complexity.`,
                messages: [
                    { role: 'user', content: `Can we review ${concept}?` },
                    { role: 'assistant', content: `Absolutely! Before I explain, what do you already know about ${concept}?` },
                    { role: 'user', content: 'I understand the basics but struggle with edge cases.' },
                    { role: 'assistant', content: 'Good — tell me: when would you choose this approach over a greedy algorithm?' }
                ]
            } as any
        });

        await prisma.aIScore.create({
            data: {
                sessionId: session.id,
                comprehensionScore: comp, implementationScore: impl, integrationScore: integ,
                conceptGaps: isStrong ? [] : [`${concept} edge cases`, 'Time complexity analysis']
            }
        });
    }

    // Create hubs with messages — find-or-create so real user memberships survive re-seeding
    console.log('🏠 Upserting community hubs...');
    for (let i = 0; i < HUB_NAMES.length; i++) {
        // Find existing hub by name or create it
        let hub = await prisma.hub.findFirst({ where: { courseId: course.id, name: HUB_NAMES[i] } });
        if (!hub) {
            hub = await prisma.hub.create({ data: { courseId: course.id, name: HUB_NAMES[i] } });
        }

        const memberCount = i === 5 ? 1 : 3 + (i % 3);
        const hubMembers: any[] = [];

        for (let j = 0; j < memberCount; j++) {
            const u = createdUsers[(i * 5 + j) % createdUsers.length];
            // Upsert hub membership — @@unique([hubId, userId]) means this is safe to call repeatedly
            await prisma.hubMember.upsert({
                where: { hubId_userId: { hubId: hub.id, userId: u.id } },
                update: {},
                create: { hubId: hub.id, userId: u.id, role: j === 0 ? 'owner' : 'member', status: 'active' }
            });
            hubMembers.push(u);
        }

        // Re-seed hub messages and sessions (demo user versions were deleted above)
        const msgs = HUB_MESSAGES[HUB_NAMES[i]];
        if (msgs && hubMembers.length > 0) {
            for (let m = 0; m < msgs.length; m++) {
                await prisma.hubMessage.create({
                    data: { hubId: hub.id, senderId: hubMembers[m % hubMembers.length].id, content: msgs[m] }
                });
            }
        }

        // Only create session if none exist for this hub (avoids duplicating on re-runs)
        if (i < 3 && hubMembers.length > 0) {
            const existingSession = await prisma.hubSession.findFirst({ where: { hubId: hub.id } });
            if (!existingSession) {
                await prisma.hubSession.create({
                    data: {
                        hubId: hub.id, title: `${HUB_NAMES[i]} — Weekly Session`,
                        scheduledAt: new Date(Date.now() + (i + 1) * 3 * 86400000),
                        createdById: hubMembers[0].id
                    }
                });
            }
        }
    }

    console.log('✅ Seed complete.');
    console.log('   • 30 students with real 12D embeddings computed from LearningState');
    console.log('   • 8 assessments across DSA, ML, Maths, Databases, OS, Statistics, OOP, System Design');
    console.log('   • 18 AI coaching sessions with scores');
    console.log('   • 6 hubs with seeded conversations');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
