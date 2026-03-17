# MockCA.ai — Project Context for Claude Code

---

## Current Status
_Last updated: 2026-03-13 — Week 1 COMPLETE_

### Week 1 — All tasks done ✅

| Task | Status |
|---|---|
| Next.js 14 scaffold + all dependencies | ✅ |
| Prisma 5 schema (7 models) + migration | ✅ |
| All 7 tables live in Supabase | ✅ |
| Login page — Google OAuth + Email magic link | ✅ |
| Invite gate page | ✅ |
| `POST /api/auth/validate-invite` route | ✅ |
| `GET /api/auth/callback` route | ✅ |
| Middleware protecting all dashboard + API routes | ✅ |
| 10 invite codes seeded in Supabase | ✅ |

### What is working right now
- `npm run build` passes clean, zero errors
- Supabase project connected (`jatkltrqgfeeurvdukql`)
- All 7 tables live: `users`, `invite_codes`, `questions`, `interview_sessions`, `session_questions`, `answers`, `scores`
- Auth flow end-to-end: Google OAuth → callback → invite gate → dashboard
- Magic link OTP flow: email → callback → invite gate → dashboard
- Middleware refreshes session on every request; unauthenticated requests → `/login`; authed users on `/login` → `/invite-gate`
- `getAuthUser()` reads cookie-based session, upserts user into Prisma on first login
- `lib/supabase.ts` exports `createSupabaseAdmin()` (service role, server-only)
- `types/index.ts` fully populated with all shared types and AI I/O contracts

### Invite codes live in Supabase (maxUses: 1, isActive: true)
```
MOCKCA-BETA-FLBD    MOCKCA-BETA-MNQS    MOCKCA-BETA-7Y26
MOCKCA-BETA-7RXP    MOCKCA-BETA-8GR4    MOCKCA-BETA-9UBY
MOCKCA-BETA-9N4Z    MOCKCA-BETA-TYL9    MOCKCA-BETA-ZAZB
MOCKCA-BETA-Z9TR
```
To generate more: `npx tsx scripts/seedInviteCodes.ts`

### All files (complete list)

**App scaffold**
- `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css` (Shadcn CSS variable theme)
- `.gitignore` — excludes `.env`, `lib/generated/prisma`
- `next-env.d.ts`

**Shadcn/ui**
- `components.json`, `tailwind.config.ts`
- `components/ui/` — button, card, dialog, tabs, badge, progress, toast, toaster, accordion, collapsible, input, label
- `hooks/use-toast.ts`

**Auth flow**
- `app/(auth)/layout.tsx` — centered layout, `force-dynamic`
- `app/(auth)/login/page.tsx` — Google OAuth + magic link OTP
- `app/(auth)/invite-gate/page.tsx` — invite code form
- `app/api/auth/validate-invite/route.ts` — validates code, increments `useCount`
- `app/api/auth/callback/route.ts` — exchanges code for session cookie
- `middleware.ts` — session refresh + route protection

**Core lib**
- `lib/utils.ts` — `cn()` helper
- `lib/prisma.ts` — Prisma 5 singleton (`@prisma/client`)
- `lib/supabase.ts` — `createSupabaseAdmin()` (service role, server-only)
- `lib/auth.ts` — `getAuthUser()` cookie-based, upserts User

**AI module stubs (not yet implemented)**
- `lib/ai/scoreAnswer.ts`, `lib/ai/openai.ts`, `lib/ai/pinecone.ts`
- `lib/ai/similarity.ts`, `lib/ai/transcribe.ts`

**Zustand store stubs (not yet implemented)**
- `lib/stores/interviewStore.ts`, `lib/stores/userStore.ts`

**Types + DB**
- `types/index.ts` — all shared types, AI I/O contracts, store types, API wrappers
- `prisma/schema.prisma` — Prisma 5, `prisma-client-js`, 7 models
- `prisma/migrations/20260314053030_init/` — initial migration (applied)
- `scripts/seedInviteCodes.ts` — generates + inserts invite codes

### Exact stopping point
Week 1 is complete. The app currently shows the landing page at `/`.
`app/(dashboard)/layout.tsx` does not exist yet — `/dashboard` 404s.
No dashboard UI, no interview flow, no question bank yet.

### Next task — Week 2: Dashboard + Paper Selection

1. `app/(dashboard)/layout.tsx` — sidebar nav, user avatar, sign-out button
2. `app/(dashboard)/dashboard/page.tsx` — paper selection cards (6 papers), recent sessions
3. `app/(dashboard)/interview/setup/page.tsx` — pick difficulty + question count
4. `app/api/sessions/route.ts` — POST to create a new `InterviewSession`
5. `lib/stores/userStore.ts` — implement Zustand store with user profile
6. `components/dashboard/PaperCard.tsx` — card for each CA paper
7. `components/dashboard/RecentSessions.tsx` — last 5 sessions with scores

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
