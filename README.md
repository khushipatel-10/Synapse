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

**Supported services:**
- Google Drive: `https://drive.google.com/uc?export=view&id=FILE_ID`
- Imgur: Direct URL
- GitHub: Raw content URL

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database ORM:** Prisma
- **Authentication:** Clerk
- **AI/ML:** OpenAI API
- **File Upload:** Multer
- **PDF Processing:** pdf-parse
- **Rate Limiting:** express-rate-limit
- **CORS:** cors

### Frontend
- **Framework:** Next.js 16 with React 19
- **Styling:** Tailwind CSS 4 + PostCSS
- **UI Components:** Custom React components
- **Typography:** @tailwindcss/typography
- **Icons:** Lucide React
- **Markdown:** react-markdown + remark-gfm
- **Authentication:** Clerk
- **Utilities:** clsx, tailwind-merge
- **Language:** TypeScript

### DevTools
- **Language:** TypeScript (backend & frontend)
- **Build:** Next.js, tsc
- **Linting:** ESLint
- **Runtime Execution:** tsx, ts-node
- **Environment:** dotenv

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

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ by khushipatel-10**