# 🧠 Synapse — AI-Powered Peer Learning

> Vector-based peer matching that finds the study partner who knows exactly what you don't.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-synapse--ai-4F46E5?style=for-the-badge&logo=vercel&logoColor=white)](https://synapse-ai-smoky-xi.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/pgvector-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)

---

## ✨ Screenshots

<div align="center">

| | |
|---|---|
| ![Screenshot 1](https://drive.google.com/file/d/1feXTjdK0yT6IpGmRJGqHVFkEkskC9R0p/view?usp=sharing) | ![Screenshot 2](https://drive.google.com/file/d/1qVhY8edXQL1nm9EzC7_mJxpi5FT8cSH-/view?usp=sharing) |
| **Landing Page** | **Recommendations** |

</div>

---

## 🎯 How It Works

Synapse builds a **12-dimensional knowledge vector** from your assessment answers — encoding confidence, frustration index, recency decay, concept entropy, and more. pgvector's HNSW index then finds peers with **complementary** gaps, not similar ones.

**Matching formula:**
```
score = (vector similarity × 0.35) + (concept complementarity × 0.35)
      + (AI coaching delta × 0.15)  + (preference compatibility × 0.15)
```

---

## ✨ Key Features

### 🎯 Diagnostic Assessments
- 8 subjects: DSA, Machine Learning, Database Systems, Operating Systems, Statistics, OOP, System Design, Mathematics
- Every answer maps to a specific concept node in your knowledge graph
- 12-dimensional float vector computed per user after each attempt
- Concept-level mastery tracking (not just a raw score)

### 🤖 AI Socratic Coach
- Upload lecture PDFs — the coach reads your material, not generic content
- Asks questions, never gives answers (enforced server-side via system prompt)
- Session history and conversation tracking
- Real-time streaming responses

### 📊 Algorithmic Matching
- pgvector cosine similarity over 12-float embeddings
- Complementarity scoring finds the peer who covers your weak spots
- "Why you match" explainability per recommendation card
- Connect → message directly from the recommendations page

### 👥 Community Hubs
- Study groups of up to 6, formed around complementary profiles
- Hub messaging and session tracking
- Create or join hubs, leave at any time

---

## 🛠️ Tech Stack

<div align="center">

| Backend | Purpose | Frontend | Purpose | Infrastructure | Purpose |
|---|---|---|---|---|---|
| ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white) | Runtime | ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) | Framework | ![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white) | Frontend host |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) | Language | ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black) | Library | ![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black) | Backend host |
| ![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white) | API Server | ![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) | Styling | ![Neon](https://img.shields.io/badge/Neon-00E599?style=for-the-badge&logo=postgresql&logoColor=black) | Database |
| ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) | ORM | ![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white) | Auth | ![pgvector](https://img.shields.io/badge/pgvector-336791?style=for-the-badge&logo=postgresql&logoColor=white) | Vector search |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white) | Database | ![Lucide](https://img.shields.io/badge/Lucide-F97316?style=for-the-badge&logo=lucide&logoColor=white) | Icons | ![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white) | Version control |
| ![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white) | AI / LLM | ![Markdown](https://img.shields.io/badge/Markdown-000000?style=for-the-badge&logo=markdown&logoColor=white) | Rendering | ![dotenv](https://img.shields.io/badge/dotenv-ECD53F?style=for-the-badge&logo=dotenv&logoColor=black) | Config |

</div>

---

## 🚀 Local Setup

**Prerequisites:** Node.js 18+, PostgreSQL with pgvector extension

```bash
git clone https://github.com/khushipatel-10/Synapse.git
cd Synapse
```

**Backend:**
```bash
cd backend
npm install
cp .env.example .env        # fill in the variables below
npx prisma db push
npm run dev                 # http://localhost:8000
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env.local  # fill in the variables below
npm run dev                 # http://localhost:3000
```

**Environment variables:**

| Variable | Service | Description |
|---|---|---|
| `DATABASE_URL` | backend | PostgreSQL + pgvector connection string |
| `CLERK_SECRET_KEY` | backend | Clerk secret key |
| `OPENAI_API_KEY` | backend | OpenAI API key |
| `NEXT_PUBLIC_API_URL` | frontend | Backend base URL e.g. `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | frontend | Clerk publishable key |

---

## 📁 Project Structure

```
Synapse/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── middleware/auth.ts
│       ├── routes/
│       │   ├── assessment.routes.ts
│       │   ├── recommendation.routes.ts
│       │   ├── connection.routes.ts
│       │   ├── message.routes.ts
│       │   ├── community.routes.ts
│       │   ├── learn.routes.ts
│       │   └── me.routes.ts
│       ├── services/
│       │   ├── assessment.service.ts
│       │   ├── complementarity.service.ts
│       │   ├── embedding.service.ts
│       │   └── preference.service.ts
│       └── index.ts
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx                    (landing)
        │   └── app/
        │       ├── recommendations/        (peer matches)
        │       ├── assessments/            (diagnostics)
        │       ├── learn/                  (AI coach)
        │       ├── connections/            (peer management)
        │       ├── messages/               (threads)
        │       ├── community/              (hubs)
        │       └── profile/
        └── components/
            ├── NavBar.tsx
            └── layout/PageShell.tsx
```

---

## 🗄️ Database Schema

| Model | Purpose |
|---|---|
| `User` | Identity, major, Clerk ID |
| `Assessment` + `AssessmentQuestion` | Diagnostic question bank |
| `AssessmentAttempt` + `AssessmentResponse` | Per-user answers |
| `LearningState` | Per-concept mastery scores |
| `UserEmbedding` | 12-float pgvector embedding |
| `PeerConnection` | Connection requests + status |
| `MessageThread` + `Message` | Direct messaging |
| `Hub` + `HubMember` | Study groups |
| `AIStudySession` | Socratic coaching sessions |

---

## 🤖 Matching Algorithm

| Factor | Weight | Details |
|--------|--------|---------|
| 🧮 Vector Similarity | 35% | pgvector cosine distance over 12-float knowledge embeddings |
| 🎯 Concept Complementarity | 35% | Peer strong in what you're weak in, and vice versa |
| 🤖 AI Coaching Delta | 15% | Improvement rate from AI coaching sessions |
| 🎓 Preference Compatibility | 15% | Study pace, mode, timezone, group size |

**Match threshold:** Score ≥ 0.50 (displayed as percentage on cards)
