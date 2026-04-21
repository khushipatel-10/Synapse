import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import embeddingRoutes from './routes/embedding.routes';
import similarityRoutes from './routes/similarity.routes';
import matchRoutes from './routes/match.routes';
import matchingRoutes from './routes/matching.routes';
import networkRoutes from './routes/network.routes';
import meRoutes from './routes/me.routes';
import recommendationRoutes from './routes/recommendation.routes';
import communityRoutes from './routes/community.routes';
import assessmentRoutes from './routes/assessment.routes';
import connectionRoutes from './routes/connection.routes';
import messageRoutes from './routes/message.routes';
import learnRoutes from './routes/learn.routes';
import userRoutes from './routes/user.routes';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

const corsOptions: cors.CorsOptions = {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(authMiddleware);

// Main health check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'success',
        message: 'Peer Learning System API is running',
        timestamp: new Date().toISOString()
    });
});

// Register API Routes
app.use('/api/v1/embeddings', embeddingRoutes);
app.use('/api/v1/similarity', similarityRoutes);
app.use('/api/v1/match-score', matchRoutes);
app.use('/api/v1/matching', matchingRoutes);
app.use('/api/v1/network', networkRoutes);
app.use('/api/v1/me', meRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/community', communityRoutes);
app.use('/api/v1/assessments', assessmentRoutes);
app.use('/api/v1/connections', connectionRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/learn', learnRoutes);
app.use('/api/v1/users', userRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server initialized on http://localhost:${PORT}`);
});
