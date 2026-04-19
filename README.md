# 🧠 Synapse - AI Peer Learning Platform

> Algorithmic peer matching engine that computes your perfect study partner using diagnostic assessments and AI coaching

---

## ✨ Key Features

| | |
|---|---|
| ![Dashboard](https://drive.google.com/uc?export=view&id=1MHgFUJ8THWzt-4Rk8X0t4g6AjF0V-22d) | ![Recommendations](https://drive.google.com/uc?export=view&id=1qjZzLxtguwoLH7EoNiHPSMBcDJNFoJ2V) |
| **Main Dashboard** | **Recommendations Interface** |

### 🎯 Diagnostic Peer Matching
- Advanced matching algorithm that pairs complementary learners
- Skill vector analysis and knowledge gap mapping
- Real-time compatibility scoring
- Connection requests and peer discovery

### 🤖 AI Coach (Learn Module)
- PDF document upload and analysis
- Interactive AI-powered tutoring sessions
- Socratic questioning and comprehension testing
- Session history and past conversation tracking
- Real-time streaming responses

### 📊 Assessment & Analytics
- Multi-subject diagnostic assessments (DSA, ML, Databases, System Design, Algorithms)
- Personalized knowledge vector calculation
- Learning profile calibration
- Performance insights

### 👥 Community Features
- Study group discovery (hubs)
- Peer connections and messaging
- Learning community engagement
- Recommendation engine

---

## 📁 Project Structure

```
Project/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── recommendations.ts
│   │   │   ├── assessments.ts
│   │   │   ├── learn.ts (AI Coach)
│   │   │   ├── connections.ts
│   │   │   └── messages.ts
│   │   ├── prisma/
│   │   ├── middleware/
│   │   └── index.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── app/
│   │   │   │   ├── recommendations/
│   │   │   │   ├── assessments/
│   │   │   │   ├── learn/
│   │   │   │   ├── connections/
│   │   │   │   ├── messages/
│   │   │   │   ├── community/
│   │   │   │   ├── profile/
│   │   │   │   └── onboarding/
│   │   │   ├── page.tsx (landing)
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── NavBar.tsx
│   │   │   ├── ui/
│   │   │   └── layout/
│   │   └── styles/
│   └── package.json
└── README.md
```

---

## 🗄️ Database Schema

```
Users
├── clerkId (PK)
├── name
├── major
├── preferences
└── created_at

Assessments
├── id (PK)
├── subject
├── questions
└── created_at

UserAssessments
├── userId (FK)
├── assessmentId (FK)
├── score
├── knowledgeVector
└── completed_at

Recommendations
├── userId (FK)
├── recommendedUserId (FK)
├── compatibilityScore
└── created_at

Connections
├── senderId (FK)
├── receiverId (FK)
├── status
└── created_at

LearningSessions
├── userId (FK)
├── sessionId
├── pdfContent
├── messages
└── created_at
```

---

## 🤖 Matching Algorithm

The matching engine computes compatibility based on:

| Factor | Weight | Details |
|--------|--------|---------|
| 🎓 Knowledge Gap | 40% | Complementary skill vectors from assessments |
| 📈 Learning Pace | 25% | Similar study speed preferences |
| 🎯 Study Mode | 20% | Aligned learning methods (sync/async/hybrid) |
| 📚 Subject Overlap | 15% | Shared academic interests |

**Score Formula:**
```
Score = (0.40 × GapComplementarity) + (0.25 × PaceMatch) + 
        (0.20 × ModeMatch) + (0.15 × SubjectOverlap)
```

**Match threshold:** Score ≥ 70

---

## 🎓 AI Coach Features

Upload your study materials and get personalized guidance.
**Coach Capabilities:**
- Document analysis and explanation
- Socratic questioning for deeper understanding
- Comprehension testing
- Session history tracking
- Real-time response streaming

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose | Version |
|---|---|---|
| ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white) | Runtime | Latest |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) | Language | ^5.3.3 |
| ![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white) | Framework | ^4.18.3 |
| ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) | ORM | ^5.10.0 |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white) | Database | - |
| ![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white) | AI/ML | ^6.23.0 |
| ![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white) | Auth | ^1.7.73 |

### Frontend
| Technology | Purpose | Version |
|---|---|---|
| ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) | Framework | 16.1.6 |
| ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black) | Library | 19.2.3 |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) | Language | ^5 |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) | Styling | ^4 |
| ![Lucide React](https://img.shields.io/badge/Lucide-F97316?style=for-the-badge&logo=lucide&logoColor=white) | Icons | ^0.575.0 |
| ![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white) | Auth | ^6.38.1 |
| ![Markdown](https://img.shields.io/badge/Markdown-000000?style=for-the-badge&logo=markdown&logoColor=white) | Rendering | ^10.1.0 |

### DevTools
| Tool | Purpose |
|---|---|
| ![ESLint](https://img.shields.io/badge/ESLint-4B3241?style=for-the-badge&logo=eslint&logoColor=white) | Linting |
| ![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black) | Formatting |
| ![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white) | Version Control |

---

## 🚀 Installation

```bash
# Clone repository
git clone https://github.com/khushipatel-10/Project.git
cd Project

# Setup backend
cd backend
npm install
cp .env.example .env
npm run db:push
npm run dev

# Setup frontend (in new terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

---

## 📖 Usage

**Backend:**
```bash
npm run dev         
npm run build       
npm run db:generate 
npm run db:push    
```

**Frontend:**
```bash
npm run dev    
```
---

