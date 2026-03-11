# MockCA.ai — Project Context for Claude Code

---

## Current Status
_Last updated: 2026-03-10 — Week 1, Day 1_

### What is working right now
- `npm run build` passes clean with zero errors
- Next.js 14 App Router project fully scaffolded
- All npm dependencies installed (see Tech Stack)
- Shadcn/ui configured (Slate theme, CSS variables, RSC mode)
- All 10 Shadcn components installed and type-safe
- Complete folder structure matching CLAUDE.md spec
- Prisma 7 schema defined with all 7 models
- Prisma client generated at `lib/generated/prisma/`
- `lib/prisma.ts` singleton ready (uses `@prisma/adapter-pg`)
- `lib/supabase.ts` exports `createSupabaseClient()` and `createSupabaseServer()`
- `lib/auth.ts` exports `getAuthUser(request)` — ready to use in API routes
- `types/index.ts` fully populated with all shared types

### Exact stopping point
Prisma schema is written and `prisma generate` has run successfully.
**No Supabase project has been connected yet.**
`DATABASE_URL` and `DIRECT_URL` in `.env` are empty placeholders.
`npx prisma migrate dev` has NOT been run — no tables exist in any database yet.

### Files created today

**Project scaffold (via create-next-app@14)**
- `package.json` — name: camockpro, Next.js 14
- `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- `app/favicon.ico`, `app/fonts/GeistVF.woff`, `app/fonts/GeistMonoVF.woff`
- `.gitignore` — extended to exclude `.env` and `lib/generated/prisma`
- `next-env.d.ts`

**Shadcn/ui**
- `components.json` — style: default, baseColor: slate, cssVariables: true
- `tailwind.config.ts` — full Shadcn token set (colors, radius, keyframes)
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/dialog.tsx`
- `components/ui/tabs.tsx`
- `components/ui/badge.tsx`
- `components/ui/progress.tsx`
- `components/ui/toast.tsx`
- `components/ui/toaster.tsx`
- `components/ui/accordion.tsx`
- `components/ui/collapsible.tsx`
- `hooks/use-toast.ts`

**Folder structure (empty folders tracked with .gitkeep)**
- `app/(auth)/login/.gitkeep`
- `app/(auth)/invite-gate/.gitkeep`
- `app/(dashboard)/dashboard/.gitkeep`
- `app/(dashboard)/interview/setup/.gitkeep`
- `app/(dashboard)/interview/[sessionId]/.gitkeep`
- `app/(dashboard)/interview/results/[sessionId]/.gitkeep`
- `app/(dashboard)/history/.gitkeep`
- `app/api/.gitkeep`
- `components/interview/.gitkeep`
- `components/dashboard/.gitkeep`
- `components/shared/.gitkeep`

**Core lib files**
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `lib/prisma.ts` — Prisma 7 singleton with `@prisma/adapter-pg`
- `lib/supabase.ts` — `createSupabaseClient()` (anon) + `createSupabaseServer()` (service role)
- `lib/auth.ts` — `getAuthUser(request)` validates token, upserts User into Prisma

**AI module stubs (headers only, not yet implemented)**
- `lib/ai/scoreAnswer.ts`
- `lib/ai/openai.ts`
- `lib/ai/pinecone.ts`
- `lib/ai/similarity.ts`
- `lib/ai/transcribe.ts`

**Zustand store stubs (headers only, not yet implemented)**
- `lib/stores/interviewStore.ts`
- `lib/stores/userStore.ts`

**Types**
- `types/index.ts` — all Paper/Difficulty/SessionStatus enums, all model types,
  AI I/O contracts (ScoreAnswerInput/Output, PineconeMatch),
  Zustand store types (InterviewPhase, ActiveSessionQuestion),
  API response wrappers (ApiSuccess, ApiError, ApiResponse)

**Database**
- `prisma/schema.prisma` — 7 models: User, InviteCode, Question,
  InterviewSession, SessionQuestion, Answer, Score
- `prisma.config.ts` — Prisma 7 CLI config (reads DIRECT_URL for migrations)
- `lib/generated/prisma/` — generated Prisma client (gitignored, must regenerate)
- `.env` — full env variable template (gitignored, values are empty)

### Files modified today
- `app/globals.css` — replaced scaffold styles with full Shadcn CSS variable theme
- `tailwind.config.ts` — replaced scaffold config with Shadcn token config
- `.gitignore` — added `.env` and `lib/generated/prisma`
- `prisma.config.ts` — corrected Prisma 7 datasource config (removed unsupported `directUrl`)

### Next task (start here tomorrow)

**Step 1 — Connect Supabase (5 min, manual)**
1. Create a Supabase project at supabase.com
2. Go to Settings → Database → copy the two connection strings:
   - "Transaction" pooler (port 6543) → `DATABASE_URL` in `.env`
   - "Session" pooler or direct (port 5432) → `DIRECT_URL` in `.env`
3. Go to Settings → API → copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role secret → `SUPABASE_SERVICE_ROLE_KEY`
4. Copy `.env` to `.env.local` (Next.js runtime reads `.env.local`)

**Step 2 — Run first migration**
```bash
npx prisma migrate dev --name init
```
This creates all 7 tables in Supabase.

**Step 3 — Build the auth flow**
- `app/(auth)/login/page.tsx` — email/password + Google OAuth via Supabase
- `app/(auth)/invite-gate/page.tsx` — validate invite code before allowing signup
- `app/(dashboard)/layout.tsx` — server component auth guard (redirect to /login if no session)
- `app/api/auth/verify-invite/route.ts` — POST endpoint to check InviteCode

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
| ORM | Prisma 7 (PostgreSQL via Supabase, `@prisma/adapter-pg`) |
| State | Zustand |
| Data Fetching | TanStack Query |
| AI Scoring | Claude API (`claude-sonnet-4-6`) |
| Embeddings | OpenAI `text-embedding-ada-002` |
| Speech-to-Text | OpenAI Whisper |
| Text-to-Speech | ElevenLabs |
| Vector DB | Pinecone (index: `mockca-questions`, 1536 dims, cosine) |
| Hosting | Vercel |
| Email | Resend |

### Key Prisma 7 notes
- `url` / `directUrl` are NOT in `schema.prisma` (Prisma 7 removed this)
- CLI connection is in `prisma.config.ts` → reads `DIRECT_URL` from env
- Runtime connection uses `@prisma/adapter-pg` in `lib/prisma.ts` → reads `DATABASE_URL`
- Import Prisma types from `@/lib/generated/prisma/client`, not `@prisma/client`
- After any schema change: `npx prisma migrate dev` then `npx prisma generate`

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
- **Current week:** 1 of 8
- **Build steps completed:** 2 of 8 (scaffold + schema)

## Build Order (reference)

1. ~~Project scaffold + dependencies~~ ✅
2. ~~Prisma schema + folder structure + core lib files~~ ✅
3. **Supabase connection + first migration + auth flow** ← next
4. Dashboard + paper selection UI
5. Interview session (question delivery, STT, TTS)
6. Answer scoring via Claude
7. Results page + history
8. Pinecone integration (semantic question retrieval)
9. Polish, email notifications, deployment
