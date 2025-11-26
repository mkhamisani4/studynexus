# AI Study Companion

An intelligent study companion that helps students manage their learning journey with AI-powered features including personalized study recommendations, auto-generated quizzes, progress tracking, and adaptive learning support.

## Features

### 🧠 Core Features

1. **Auto-Organizing Knowledge Map (AI Knowledge Graph)**
   - Automatically builds concept maps from uploaded notes
   - Visualizes relationships between topics
   - Identifies prerequisite chains and weak areas
   - Interactive graph visualization

2. **Auto-Generated Exam Mode**
   - AI analyzes all uploaded materials
   - Creates predicted exam difficulty
   - Generates 60-minute or 120-minute mock exams
   - Mix of question types (multiple choice, short answer, essay, code)

3. **Multi-Level Explanations**
   - ELI5 (kid-level)
   - Beginner
   - Standard student
   - Graduate-level
   - Professor-level (technical depth)

4. **Study Coach Mode**
   - Motivational nudges and feedback
   - Study streak tracking
   - Personalized recommendations
   - Achievement system

5. **Just In Time Help**
   - Context-aware explanations
   - Analyzes current reading material
   - Considers recent mistakes and weakness profile

6. **Handwritten Notes Processing**
   - OCR + LLM conversion
   - Clean, structured text output
   - Auto-creates headings and summaries
   - Highlights important definitions

7. **Time Allocation Recommendation Engine**
   - Personalized daily micro-schedules
   - Based on deadlines, difficulty, performance, and energy levels
   - Optimized study session planning

8. **Learning Pacing Profiles**
   - Detects learning style (spaced repetition, slow-burn, burst)
   - Adapts quiz difficulty and frequency
   - Identifies weak concept clusters

9. **Weekly Progress Digest**
   - AI-summarized progress reports
   - Mastery percentages
   - Weak area identification
   - Recommended next steps

10. **Reverse Learning Mode**
    - Start with a problem
    - AI backtracks all required concepts
    - Creates pre-study materials automatically

11. **Citation Finder**
    - AI scans notes and suggests sources
    - Textbooks, research papers, videos, websites
    - Relevance scoring

12. **Multi-Mode Flashcards**
    - Text-based
    - Image-based
    - Fill-in-the-blank
    - Multiple choice
    - Code snippets
    - Explain-in-your-own-words

13. **Concept Weakness Heatmap**
    - Visual map showing mastery levels
    - Green (mastered), Yellow (learning), Red (weak)
    - Subject-based filtering

14. **Study Together AI Groups**
    - Matches students by courses, weaknesses, deadlines
    - AI-generated group study plans
    - Shared quizzes and conversation prompts

15. **AI Research Assistant**
    - Summarizes research papers
    - Extracts key contributions
    - Generates contrasting viewpoints
    - Provides potential exam questions

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: OpenAI API (GPT-4)
- **Database**: Supabase (PostgreSQL)
- **Visualization**: Recharts, React Force Graph
- **UI Components**: Lucide React Icons, Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- OpenAI API key
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mkdevpost25
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials. See [ENV_SETUP.md](./ENV_SETUP.md) for detailed instructions.

**Required variables:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

**Where to find these:**
- **Supabase**: Go to your project → Settings → API
- **OpenAI**: Go to platform.openai.com → API keys

4. Set up the database:
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Run the SQL from `supabase/schema.sql`

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
mkdevpost25/
├── app/
│   ├── api/              # API routes
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main page
├── components/
│   ├── features/         # Feature components
│   ├── Dashboard.tsx     # Main dashboard router
│   ├── Header.tsx        # App header
│   └── Sidebar.tsx       # Navigation sidebar
├── lib/
│   ├── openai.ts        # OpenAI API utilities
│   └── supabase.ts       # Supabase client and types
├── supabase/
│   └── schema.sql        # Database schema
└── public/               # Static assets
```

## API Routes

- `POST /api/explain` - Generate explanations at different levels
- `POST /api/quiz` - Generate quizzes from content
- `POST /api/flashcards` - Generate flashcards
- `POST /api/knowledge-graph` - Build knowledge graphs
- `POST /api/exam` - Generate practice exams
- `POST /api/schedule` - Generate study schedules
- `POST /api/citations` - Find citations and sources
- `POST /api/reverse-learning` - Generate reverse learning paths
- `POST /api/research` - Analyze research papers
- `POST /api/notes` - Clean handwritten notes (OCR)

## Database Schema

The application uses Supabase (PostgreSQL) with the following main tables:

- `study_materials` - Uploaded notes and documents
- `concepts` - Knowledge graph nodes
- `concept_relationships` - Relationships between concepts
- `flashcards` - Generated flashcards
- `study_sessions` - Study session tracking
- `exams` - Generated and completed exams
- `study_groups` - Collaborative study groups
- `learning_profiles` - User learning profiles and preferences

See `supabase/schema.sql` for the complete schema.

## Features in Detail

### Knowledge Graph
The AI automatically analyzes uploaded materials to build a visual knowledge graph showing:
- Concept relationships
- Prerequisite chains
- Mastery levels (color-coded)
- Weak vs strong areas

### Exam Mode
Generates comprehensive practice exams based on:
- All uploaded study materials
- Historical performance
- Predicted difficulty
- Mix of question types

### Study Coach
Acts as an AI mentor providing:
- Daily motivational messages
- Study streak tracking
- Performance feedback
- Personalized study recommendations
- Achievement badges

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, OpenAI, and Supabase
