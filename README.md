# CaptionBridge

A real-time AI companion for university lectures. It listens to the professor, transcribes in Arabic, and turns the transcript into study material — summaries, mind maps, comparison tables, equations, flashcards, and more.

**Live:** https://real-time-assistive-system-vir2.vercel.app

---

## Why this exists

I watched a friend — deaf since childhood — sit through a two-hour lecture and leave with nothing. Not because she wasn't paying attention. Because there was nothing to pay attention *to*. No interpreter for the whole class. No captions. The professor moves on, and she's two minutes behind, then five, then out.

Egyptian universities don't have this infrastructure. The tools that do exist (Otter, Live Transcribe) are expensive, built for English, and don't work well with Egyptian Arabic dialects. Google's Web Speech API — the obvious free option — is blocked at the ISP level in Egypt.

So I built the thing I wanted her to have. It started as a graduation project at Horus University, Faculty of Computers & AI. It stopped being "for deaf students only" around month four, when I noticed the AI analysis layer helps everyone: the student who overslept, the one reviewing two nights before the exam, the one whose first language isn't Arabic.

The rebrand to **"رفيقك الذكي في المحاضرات الجامعية"** reflects that. Same tool. Wider audience.

---

## Screenshots

> Screenshots coming soon — will be captured from the live deployment.

---

## What it does

### Listening & transcription
- **Live Arabic transcription** — professor's voice to text in ~6-second chunks, using Hakim AI (Arabic-first STT) with automatic fallback to Groq Whisper.
- **Highlighted transcript** — English technical terms, numbers, and exam keywords are color-coded automatically.

### AI study material (all generated from the live transcript)
- **Smart summary** — title, overview, key points, conclusion
- **Mind map** — topic tree drawn with React Flow
- **Academic glossary** — every technical term with a plain-Arabic definition
- **Keywords** — categorized by type (person, tool, concept) with importance stars
- **Flashcards** — question/answer cards, ready for review
- **Action-item radar** — extracts exam hints, assignment deadlines, and important-page references
- **Classroom questions** — infers what remote students asked, based on the professor's reply

### Visual explanations
- **Comparison tables** — "let vs var", "TCP vs UDP", extracted from the transcript itself, with source attribution
- **Analogy maps** — "cache زي المكتب" → two-column correspondence, plus where the analogy breaks
- **Explorable equations** — KaTeX rendering, live sliders, curve preview, all powered by `expr-eval`
- **Exploded system view** — OSI layers, TCP/IP, compiler stages, with an animated scenario player
- **Argument map** — thesis, claims, evidence, counterarguments, rebuttals
- **Causal loop explorer** — X → Y relationships with sign detection, plus reinforcing/balancing loop recognition
- **Flow diagram** — Mermaid-generated process diagrams
- **Visualize This** — picks the right diagram shape (sequence, cycle, hierarchy, comparison, layers) automatically

### Account & classroom
- Email + password auth with required email verification
- Password reset flow
- Save/load lectures to the cloud
- Admin panel for user management
- Telegram notifications — student presses a button, the professor gets a message with inline reply options

---

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (App Router, Turbopack) | Server components, streaming, and a mature API routes system |
| Language | TypeScript 5.9 | Strict mode everywhere — no `any` escapes |
| UI | React 19 + Tailwind v4 | Latest concurrent features + new Tailwind engine |
| Components | Hand-rolled (shadcn-style) | No lock-in to a specific UI library |
| Animation | Motion (formerly Framer Motion) | Fine-grained control over layout and presence |
| Diagrams | React Flow + Mermaid | React Flow for interactive mind maps, Mermaid for static flows |
| Math | KaTeX + expr-eval | KaTeX renders, expr-eval evaluates live |
| Charts | Recharts | Works well with React 19 |
| Auth | Better Auth | Self-hosted, no third-party dependency, works with Kysely |
| Database | Turso (libSQL) | Cloud SQLite — free tier is enough for a student project |
| STT | Hakim AI (primary) → Groq Whisper (fallback) | Hakim handles Egyptian Arabic better; Groq is a reliable backup |
| LLM | NVIDIA NIM → Groq → Gemini | Three-tier fallback chain, all free tier |
| Deployment | Vercel | Zero-config for Next.js |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│                                                             │
│  ┌────────────┐  getUserMedia  ┌──────────────────┐        │
│  │ Mic button │ ─────────────→ │ MediaRecorder    │        │
│  └────────────┘                │ 6-second chunks  │        │
│                                └────────┬─────────┘        │
│                                         │                   │
│                                         ↓ FormData          │
│                                ┌──────────────────┐        │
│                                │ /api/smart       │        │
│                                └────────┬─────────┘        │
└─────────────────────────────────────────┼──────────────────┘
                                          │
                                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Next.js API routes (nodejs runtime)                        │
│                                                             │
│  /api/smart              → Hakim → Groq Whisper            │
│  /api/analyze            → LLM chain (topic, terms)        │
│  /api/visualize-*  (10)  → LLM chain (structured JSON)     │
│  /api/summarize          → LLM chain                        │
│  /api/keywords           → LLM chain                        │
│  /api/notify-doctor      → Telegram Bot API                │
│  /api/auth/[...all]      → Better Auth                     │
└─────────────────────────────────────────┬──────────────────┘
                                          │
                                          ↓
┌─────────────────────────────────────────────────────────────┐
│  External services                                          │
│                                                             │
│  Hakim AI        — Arabic STT                              │
│  Groq Whisper    — STT fallback                            │
│  NVIDIA NIM      — LLM (3 keys × 4 models, rotated)        │
│  Groq LLM        — LLM fallback                            │
│  Google Gemini   — LLM last resort                         │
│  Turso (libSQL)  — Cloud database                          │
│  Telegram Bot    — Doctor notifications                    │
│  Gmail SMTP      — Email verification                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Getting started

### Prerequisites

- Node.js 20+
- A Turso database (free tier is enough)
- API keys for at least one STT provider (Hakim or Groq) and one LLM provider (NVIDIA, Groq, or Gemini)

### Install

```bash
git clone https://github.com/khalid8923/Real_time_Assistive_System_vir2.git
cd Real_time_Assistive_System_vir2
npm install
```

### Configure

Copy `.env.example` to `.env.local` and fill in the values. See the **Environment Variables** section below.

### Run

```bash
npm run dev
```

Open http://localhost:3000. The microphone permission prompt will appear the first time you start the transcription.

---

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `BETTER_AUTH_SECRET` | Yes | Session signing key (generate with `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Yes | Full URL of the app (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public URL — used for OG metadata and callbacks |
| `TURSO_DATABASE_URL` | Yes | libSQL connection string |
| `TURSO_AUTH_TOKEN` | Yes | Turso auth token |
| `HAKIM_API_KEY` | Optional | Arabic STT (primary) |
| `HAKIM_API_KEY_2` | Optional | Second Hakim key for rotation |
| `GROQ_API_KEY` | Optional | Whisper STT fallback + LLM fallback |
| `NVIDIA_API_KEY` | Optional | Primary LLM provider |
| `NVIDIA_API_KEY_2`, `_3` | Optional | Additional NVIDIA keys for rotation |
| `GEMINI_API_KEY` | Optional | Last-resort LLM |
| `ADMIN_PASSWORD` | Optional | Fallback if no password is set in the database |
| `GMAIL_USER` | Optional | Gmail address for sending verification emails |
| `GMAIL_APP_PASSWORD` | Optional | Gmail app password (16 chars) |
| `TELEGRAM_BOT_TOKEN` | Optional | For the doctor-notification feature |
| `TELEGRAM_CHAT_ID` | Optional | Doctor's chat ID |

At least one STT and one LLM provider must be configured. The app degrades gracefully — if a provider is missing, the chain simply skips it.

---

## Project structure

```
app/
├── (auth)/                    # login, signup, verify-email, forgot-password, reset-password
├── account/                   # user dashboard
├── admin/                     # admin panel
├── api/
│   ├── smart/                 # STT entry point (Hakim + Groq)
│   ├── analyze/               # topic + children + terms
│   ├── chat/                  # AI assistant
│   ├── summarize/
│   ├── keywords/
│   ├── flashcards/
│   ├── action-items/
│   ├── classroom-questions/
│   ├── translate/
│   ├── visualize-*/           # 10 endpoints, one per visualization type
│   ├── notify-doctor/         # Telegram integration
│   ├── auth/[...all]/         # Better Auth catch-all
│   └── health/                # DB + uptime check
├── actions/                   # server actions (lectures, settings, study, user)
├── layout.tsx                 # root layout (RTL, Arabic-first)
└── globals.css                # Tailwind v4 + theme tokens

components/
├── auth/                      # AuthForm, GoogleButton, AuthCompanion
├── ui/                        # buttons, inputs, cards, tabs
├── SpeechInput.tsx            # main transcription UI
├── MindMap.tsx                # React Flow based
├── *Panel.tsx                 # feature panels
└── FloatingChat.tsx           # draggable AI chat

lib/
├── ai/provider.ts             # LLM fallback chain
├── db/
│   ├── index.ts               # migrations, connection, health
│   └── queries.ts             # all queries
├── auth.ts                    # Better Auth config
├── email.ts                   # Gmail SMTP + Resend fallback
├── telegram-poller.ts         # server-side Telegram polling
└── rate-limit.ts              # per-route scoped rate limiter

hooks/
├── useSpeechTranscription.ts  # MediaRecorder + queue + abort
├── useSoundDetection.ts       # ambient sound level
└── useInactivityLogout.ts     # auto-logout after 30 min idle
```

---

## Database schema

Seven tables besides the four Better Auth tables (`user`, `session`, `account`, `verification`):

- `user_settings` — theme, font size, sound sensitivity per user
- `saved_lectures` — transcript, summary, mind map JSON, glossary JSON
- `saved_glossary` — starred terms
- `flashcards_progress` — question, answer, mastery level
- `doctor_replies` — Telegram notification records
- `admin_settings` — password hash (scrypt)
- `_migrations` — applied migrations

Migrations run automatically on first request. Nothing manual.

---

## API endpoints

| Method | Path | Rate limit | Purpose |
|--------|------|------------|---------|
| POST | `/api/smart` | 15/min | STT |
| POST | `/api/transcribe` | 15/min | Whisper fallback |
| POST | `/api/analyze` | 15/min | Topic + children + terms |
| POST | `/api/chat` | 20/min | AI assistant |
| POST | `/api/summarize` | 10/min | Summary |
| POST | `/api/keywords` | 15/min | Keyword extraction |
| POST | `/api/flashcards` | 10/min | Flashcards |
| POST | `/api/action-items` | 10/min | Exam/assignment radar |
| POST | `/api/classroom-questions` | 10/min | Inferred questions |
| POST | `/api/translate` | 15/min | EN → AR translation |
| POST | `/api/visualize-comparison` | 10/min | Comparison tables |
| POST | `/api/visualize-analogy` | 10/min | Analogy maps |
| POST | `/api/visualize-equations` | 8/min | Equations |
| POST | `/api/visualize-system` | 10/min | Layered systems |
| POST | `/api/visualize-this` | 10/min | Auto-shaped diagrams |
| POST | `/api/visualize-causal` | 10/min | Causal loops |
| POST | `/api/visualize-argument` | 10/min | Argument maps |
| POST | `/api/visualize-flow` | 10/min | Mermaid flows |
| POST | `/api/visualize-infographic` | 8/min | Multi-section infographics |
| POST | `/api/notify-doctor` | 1 per 30s per student | Telegram notification |
| GET | `/api/notify-doctor/check` | — | Poll for reply |
| GET | `/api/health` | — | DB + uptime |
| PATCH | `/api/user/profile` | — | Update profile |

Every route runs through a scoped rate limiter — the scope string is unique per route, so hitting `/api/summarize` doesn't count against `/api/chat`'s budget.

---

## Design decisions worth explaining

**Why Turso and not Postgres.**
The free tier covers the projected usage of a graduation project. It's SQLite under the hood, so migrations are trivial, and libSQL works from edge functions. For anything beyond a few hundred users, I'd switch to Neon or Supabase Postgres.

**Why Hakim AI and not Whisper as primary.**
Hakim is tuned for Arabic — including Egyptian dialect — and returns cleaner output for this domain. Whisper is faster and more available, so it stays as a fallback. The chain rotates between two Hakim keys round-robin and drops to Groq only when both fail.

**Why three LLM providers.**
No free-tier LLM provider is reliable enough alone. NVIDIA NIM gives 40 requests/min per key. Groq gives 1,000/day per model. Gemini gives 1,500/day. By stacking them, a single lecture rarely fails, and I never pay a cent.

**Why per-route rate limit scope.**
The first version of the limiter shared a single counter across all routes. A 10/min limit on `/api/chat` was effectively a 10/min limit on the entire app. Splitting the scope fixed it.

**Why an animated visual companion on the auth pages.**
Authentication is where people decide whether to trust a product. A static form is fine, but a small, well-crafted visual response communicates that the tool was built with intention. It respects `prefers-reduced-motion` and never blocks the form.

**Why RTL-first.**
The target audience reads Arabic. RTL is the default, not an afterthought.

---

## Known limitations

- **Free-tier quotas.** ~30 daily active users before any AI endpoint starts throttling. Realistic for a graduation demo, not for a class of 200.
- **Gmail SMTP verification lands in spam.** Gmail personal accounts have poor sender reputation for automated mail. A custom domain with Resend or Brevo solves this; I'll do it before the commercial launch.
- **Google OAuth.** Hidden in the production UI. The current client works locally but Vercel's environment has a stale client ID. It'll come back after I set up a dedicated Google Cloud project.
- **Sound detection is experimental.** It reads ambient dB, not real event classification. Door slams and phone rings are caught; quiet footsteps are not.
- **No tests.** Everything was verified manually and via scripted end-to-end checks. Not great, but honest.
- **Single-instance rate limiting.** The limiter uses in-memory `Map`. On a multi-region deployment it would need Redis.

---

## What's next

- Custom domain + Resend for email
- Re-enable Google login with a fresh OAuth client
- Practice quiz mode + mastery dashboard
- Time-lapse playback of the mind map
- Unit tests for the LLM fallback chain
- A proper landing page

---

## License

MIT — see [LICENSE](./LICENSE).

---

## Author

**Khalid Mohammed**
Faculty of Computers & AI, Horus University
GitHub: [@khalid8923](https://github.com/khalid8923)

---

## بالعربية

**CaptionBridge** — رفيقك الذكي في المحاضرات الجامعية.

تطبيق يحوّل كلام الدكتور إلى نص لحظيًا، ثم يحوّل النص إلى مواد دراسية: ملخصات، خرائط ذهنية، معجم مصطلحات، جداول مقارنة، معادلات تفاعلية، وأكثر. الفكرة بدأت كمشروع تخرج، واتوسعت لأن التحليل الذكي يساعد كل طالب — مش بس الطلاب الصم.

**روابط:**
- [التطبيق المباشر](https://real-time-assistive-system-vir2.vercel.app)
- [اقرأ النسخة العربية من الشرح](./README.ar.md)

---

<div align="center">
<sub>Built in Cairo, one commit at a time.</sub>
</div>
