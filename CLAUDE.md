# MockCA.ai — Project Context for Claude Code

---

## Current Status — Last Updated: Week 3 Complete

### Overall Progress
Week 1 ✅ | Week 2 ✅ | Week 3 ✅ | Week 4 ⏳ | Week 5-8 not started

### What Is Fully Working Right Now
- npm run dev starts clean on localhost:3000
- npm run build passes with zero errors
- Email OTP login via Supabase Auth
- Google OAuth login via Supabase Auth
- Invite code gate — 9 codes remaining
- Protected dashboard route with sidebar
- Admin panel at /admin (password protected)
- Questions API GET + POST
- Interview setup 3-step wizard
- Live interview room with timer + feedback
- Results page with score breakdown
- Mocked feedback (score always 75, grade Good)

### What Is NOT Working Yet
- Real AI scoring (Week 4 — next task)
- Audio mode / Whisper STT (Week 5)
- ElevenLabs TTS voice (Week 5)
- Session history page (Week 6)
- Analytics / radar chart (Week 6)

### Files Built So Far
AUTH:
- app/(auth)/login/page.tsx
- app/(auth)/invite-gate/page.tsx
- app/(auth)/layout.tsx
- app/api/auth/validate-invite/route.ts
- app/api/auth/callback/route.ts
- middleware.ts

DASHBOARD:
- app/(dashboard)/layout.tsx
- app/(dashboard)/dashboard/page.tsx
- components/dashboard/NavLink.tsx
- components/dashboard/SignOutButton.tsx

ADMIN:
- app/admin/page.tsx
- app/api/admin/questions/route.ts

INTERVIEW:
- app/(dashboard)/interview/setup/page.tsx
- app/(dashboard)/interview/[sessionId]/page.tsx
- app/(dashboard)/interview/results/[sessionId]/page.tsx
- app/api/sessions/create/route.ts
- app/api/interview/submit-text/route.ts

COMPONENTS:
- components/interview/ScoreRing.tsx
- components/interview/QuestionCard.tsx
- components/interview/Timer.tsx
- components/interview/FeedbackCard.tsx
- components/interview/MissingConceptChip.tsx

STATE:
- lib/stores/interviewStore.ts (Zustand)
- types/index.ts (AIFeedback + all types)

AI STUBS (empty, ready for Week 4):
- lib/ai/scoreAnswer.ts
- lib/ai/openai.ts
- lib/ai/pinecone.ts
- lib/ai/similarity.ts
- lib/ai/transcribe.ts

### Invite Codes (10 total, 1 used for testing)
USED: MOCKCA-BETA-FLBD
AVAILABLE:
MOCKCA-BETA-MNQS  MOCKCA-BETA-7Y26
MOCKCA-BETA-7RXP  MOCKCA-BETA-8GR4
MOCKCA-BETA-9UBY  MOCKCA-BETA-9N4Z
MOCKCA-BETA-TYL9  MOCKCA-BETA-ZAZB
MOCKCA-BETA-Z9TR

### Database — 7 Tables Live in Supabase
users, invite_codes, questions,
interview_sessions, session_questions,
answers, scores

### Session Resume ID
f51dcc4a-a2d2-4e54-a4ac-7cab985ede7a

### Next Task — Week 4: Real AI Engine
Build in this exact order:
1. lib/ai/similarity.ts — cosineSimilarity()
2. lib/ai/openai.ts — embed() with ada-002
3. lib/ai/pinecone.ts — Pinecone index connection
4. scripts/embedAllQuestions.ts — seeder
5. lib/ai/scoreAnswer.ts — full 8-step pipeline
6. Update submit-text route to use real scoreAnswer()

IMPORTANT before Week 4:
- Need minimum 10 questions in DB with good
  idealAnswer and keyTerms filled
- Verify .env has ANTHROPIC_API_KEY,
  OPENAI_API_KEY, PINECONE_API_KEY all filled
- Run embedAllQuestions.ts after building it

### Critical Rules (never break these)
1. All types only in types/index.ts
2. All AI calls only through lib/ai/ modules
3. All DB queries only through Prisma
4. All API routes must use getAuthUser()
5. Never expose SUPABASE_SERVICE_ROLE_KEY to client
6. Shadcn/ui only for UI components
7. Never hardcode API keys
8. npm run build must pass before any session ends

---

## What This Is
AI-powered mock interview platform for CA Intermediate students in India. Students practice exam-style viva questions with AI, get scored answers, and track progress across all 6 CA Intermediate papers.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + Shadcn/ui only |
| Auth + DB + Storage | Supabase |
| ORM | Prisma 5 (PostgreSQL via Supabase, `prisma-client-js`) |
| State | Zustand |
| Data Fetching | TanStack Query |
| AI Scoring | Claude API (`claude-sonnet-4-6`) |
| Embeddings | OpenAI `text-embedding-ada-002` |
| Speech-to-Text | OpenAI Whisper |
| Text-to-Speech | ElevenLabs |
| Vector DB | Pinecone (index: `mockca-questions`, 1536 dims, cosine) |
| Hosting | Vercel |
| Email | Resend |

### Key Prisma notes (Prisma 5)
- Generator is `prisma-client-js` — import from `@prisma/client`
- `url = env("DATABASE_URL")` and `directUrl = env("DIRECT_URL")` are in `schema.prisma`
- `DATABASE_URL` — transaction pooler URL (port 6543, used at runtime)
- `DIRECT_URL` — direct/session URL (port 5432, used by Prisma CLI for migrations)
- After any schema change: `npx prisma migrate dev --name <desc>` (regenerates client automatically)
- `prisma.config.ts` does NOT exist — that was a Prisma 7 concept, deleted

## Folder Structure

```
app/
  (auth)/
    login/
    invite-gate/
  (dashboard)/
    layout.tsx
    dashboard/
    interview/
      setup/
      [sessionId]/
      results/[sessionId]/
    history/
  api/                        # All backend API routes

components/
  interview/
  dashboard/
  shared/

lib/
  prisma.ts
  auth.ts
  supabase.ts
  ai/
    scoreAnswer.ts            # Claude scoring logic
    openai.ts                 # Embeddings client
    pinecone.ts               # Vector DB queries
    similarity.ts             # Cosine similarity helpers
    transcribe.ts             # Whisper STT

  stores/
    interviewStore.ts         # Zustand: active session state
    userStore.ts              # Zustand: user profile/preferences

types/
  index.ts                    # ALL shared TypeScript types — only here
```

## Domain Knowledge: CA Intermediate

- **CA** = Chartered Accountant, governed by **ICAI** (Institute of Chartered Accountants of India)
- **CA Intermediate** is the second level of the CA qualification
- Students are typically in **articleship** (3-year practical training under a CA)
- Common employers after qualification: **Big4** (Deloitte, PwC, EY, KPMG), mid-size firms, industry

### The 6 Papers (use these exact slugs in DB/code)

| Slug | Full Name |
|---|---|
| `accounting` | Advanced Accounting |
| `law` | Corporate and Other Laws |
| `taxation` | Taxation (Income Tax + GST) |
| `cost` | Cost and Management Accounting |
| `audit` | Auditing and Ethics |
| `fm_sm` | Financial Management & Strategic Management |

### Key Technical Terms (must appear correctly in questions/scoring)
- **Ind AS** — Indian Accounting Standards (converged with IFRS)
- **GST** — Goods and Services Tax
- **Deferred Tax** — timing difference between book and tax income
- **Going Concern** — assumption that entity will continue to operate
- **Materiality** — threshold for disclosure significance
- **CARO 2020** — Companies Auditor's Report Order 2020
- **Articleship** — mandatory practical training period

## Critical Rules (never violate)

1. **Types** — ALL shared TypeScript types go in `types/index.ts` only. Never define shared types inline in components or API routes.
2. **AI calls** — ALL calls to Claude, OpenAI, ElevenLabs, Whisper go through `lib/ai/` modules only. No direct SDK calls elsewhere.
3. **Database** — ALL DB queries through Prisma. Never write raw SQL.
4. **Auth** — Every API route MUST call `getAuthUser()` from `lib/auth.ts` before any logic. No unauthenticated endpoints except `/login`.
5. **Secrets** — Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. Server-only.
6. **UI** — Shadcn/ui components only. No custom CSS files. Tailwind utility classes only.
7. **Keys** — Never hardcode API keys. Always use `process.env.*`.

## Environment Variables

```
# Supabase — supabase.com → Settings → API
NEXT_PUBLIC_SUPABASE_URL=          # client-safe
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # client-safe
SUPABASE_SERVICE_ROLE_KEY=         # server only — never expose

# Database — supabase.com → Settings → Database
# DATABASE_URL: Transaction pooler, port 6543 (for runtime via pg adapter)
# DIRECT_URL:   Session mode / direct, port 5432 (for Prisma CLI migrations)
DATABASE_URL=
DIRECT_URL=

# AI Services
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
ELEVENLABS_API_KEY=

# Vector DB
PINECONE_API_KEY=
PINECONE_INDEX=mockca-questions

# Email
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Status

- **Timeline:** 8 weeks total
- **Current week:** 2 of 8
- **Build steps completed:** 3 of 8

## Build Order (reference)

1. ~~Project scaffold + dependencies~~ ✅
2. ~~Prisma schema + folder structure + core lib files~~ ✅
3. ~~Supabase connection + migration + full auth flow~~ ✅
4. **Dashboard + paper selection UI** ← next (Week 2)
5. Interview session (question delivery, STT, TTS)
6. Answer scoring via Claude
7. Results page + history
8. Pinecone integration (semantic question retrieval)
9. Polish, email notifications, deployment
