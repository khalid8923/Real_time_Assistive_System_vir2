CAPTIONBRIDGE — MASTER PROJECT HANDOFF DOCUMENT
Document Version: 2.0
Generated: From complete conversation history
Purpose: Complete project-memory export for handoff to another AI model
Project Stage: Post-Phase 7 — 7 New Features Added

1. PROJECT IDENTITY
[CONFIRMED / IMPLEMENTED]
Project Name: CaptionBridge

Arabic Name: كابتشن بريدج

Original Tagline: "جسر التواصل للطلاب الصم"
Current Tagline: "رفيقك الذكي في المحاضرات الجامعية"

Purpose:
Real-time AI-powered lecture assistant. Captures professor's live Arabic speech → converts to text → generates AI-powered study materials in real-time. Originally for deaf/hard-of-hearing students in Egypt, rebranded for all university students. Now focusing on STEM students (Math, AI, Engineering, Programming).

Core Problem:
Deaf students in Egyptian universities cannot follow lectures because:

Sign language interpreters are scarce

Auto-captioning tools don't support Egyptian Arabic well

Google's Web Speech API is blocked on Egyptian ISPs

Foreign apps (Otter.ai) are expensive and inaccurate for Arabic

Target Users:

Primary: University students in STEM fields (Egypt + Arab world)

Secondary: Any student wanting better comprehension and organized notes

Target Platform: Web (Chrome desktop, localhost:3000 during development)

Author: Khalid Mohammed, Horus University, Faculty of Computers & AI

GitHub: https://github.com/khalid8923/Real_time_Assistive_System_vir2

Live Site: https://real-time-assistive-system-vir2.vercel.app

Current Stage: Hackathon/Graduation project — pre-submission. 22 features live in production. Recent session: added 7 new visual features (Comparison, Analogy, Timeline, Equations, Cloze, System View, Visualize This).

Long-Term Vision: Comprehensive AI lecture assistant with Napkin-AI-style visual generation, completely free, works in Egypt without VPN, supports 2000+ users (currently ~30 active on free tier).

2. COMPLETE DEVELOPMENT HISTORY — CHRONOLOGICAL
Phase 1: Initial Design
[CONFIRMED]

Built complete UI: multi-theme system, RTL Arabic layout, sidebar, top bar, MindMap using React Flow, GlossaryPanel, notification toast system

Fonts: Cairo (sans) + Amiri (serif), loaded via next/font/google

Phase 2: Mic Pipeline — Attempt 1 (Web Speech API)
[REJECTED]

Used webkitSpeechRecognition

Error: "تعذر الاتصال بخدمة التعرف على الصوت"

Cause: Google blocks service on Egyptian ISP IP ranges

Conclusion: Unreliable. Do NOT retry.

Phase 3: Mic Pipeline — Attempt 2 (Groq Whisper direct)
[CONFIRMED — eventually succeeded after Phase 6]

Initially failed due to malformed API key: gsk_gsk_... (double prefix)

Was a key format issue, not a Groq issue

Phase 4: Mic Pipeline — Attempt 3 (Transformers.js in browser)
[REJECTED]

Used @huggingface/transformers with onnx-community/whisper-tiny

Error: EncodingError: Unable to decode audio data

Cause: whisper-tiny too small for Arabic; Browser AudioContext couldn't decode webm/opus reliably

Conclusion: Browser-based inference is unreliable. Do NOT retry.

Phase 5: LLM — Claude → Gemini
[DEPRECATED]

Originally used @anthropic-ai/sdk with claude-sonnet-4-5

Migrated to Gemini gemini-2.5-flash due to free tier

Error: 404 — models/gemini-2.5-flash is no longer available to new users

Migrated to gemini-3.6-flash

Error: 429 Rate Limit on audio transcription requests

Phase 6: Groq Whisper Working
[CONFIRMED]

User generated working Groq API key

/api/transcribe migrated to Groq Whisper Large v3 Turbo

Working with language: "ar" + prompt

Phase 7: Rebranding & Logo
[CONFIRMED]

Changed tagline: "جسر التواصل للطلاب الصم" → "رفيقك الذكي في المحاضرات الجامعية"

Added logo (public/logo.png + app/icon.png)

Added RobotIcon.tsx

Removed "جديد" badges

Phase 8: UX Cleanup
[CONFIRMED]

Removed search button from SpeechInput, added trash/clear button

Hidden Google login/signup buttons (commented out in UI)

Changed "إيميل الجامعة" → "الإيميل"

Phase 9: HAKIM AI Migration (Current Session — Major)
[CONFIRMED]

Migrated STT from Groq Whisper → Hakim AI (Arabic-first, better accuracy)

Multi-key rotation: 2 Hakim keys

Chunk duration: 15s → 25s → 10s → 6s (faster feedback)

Fallback chain: Hakim #1 → Hakim #2 → Groq Whisper

Phase 10: LLM Provider Migration (Current Session)
[CONFIRMED]

Primary: NVIDIA NIM (3 keys, 40 RPM, 132 models)

Fallback: Groq (openai/gpt-oss-20b, gpt-oss-120b, qwen/qwen3-32b)

Last resort: Gemini (gemini-3.6-flash)

Added jsonMode flag for optional JSON responses

Added friendly error messages (no more raw JSON errors)

Phase 11: DB Improvements (Current Session)
[CONFIRMED]

Versioned migrations with _migrations table

Query timeout (15s)

safeExecute() wrapper

dbHealth() check

ensureDbReady() with retry

/api/health now checks DB connection

Phase 12: Error Handling System (Current Session)
[CONFIRMED]

lib/errors.ts — 12 error categories with Arabic messages

lib/api-client.ts — fetch wrapper with timeout + retry

lib/error-toast.ts — Sonner toast helpers

lib/safe-storage.ts, lib/safe-json.ts, lib/validators.ts, lib/logger.ts

components/ErrorBoundary.tsx — React error boundary

components/ConnectionBanner.tsx — online/offline indicator

components/GlobalErrorCatcher.tsx — unhandled rejection handler

components/RetryButton.tsx, components/ui/EmptyState.tsx, components/ui/ErrorState.tsx

app/offline/page.tsx, app/maintenance/page.tsx, app/session-expired/page.tsx

Phase 13: 7 New Visual Features (Current Session — LATEST)
[CONFIRMED]

Feature #1: Comparison Tables + Cloze

Feature #2: Analogy Map

Feature #3: Lecture Timeline (no LLM)

Feature #4: Explorable Equations (KaTeX + expr-eval + Recharts)

Feature #5: Cloze Overlay (linked to Comparison Tables)

Feature #6: Exploded System View (OSI, TCP/IP, Compiler)

Feature #7: Visualize This (5 templates: sequence, cycle, hierarchy, comparison, layers)

3. CURRENT PROJECT STATE
✅ COMPLETED (22 features total)
Original Core Features (15):

Live Transcription (Hakim + Groq fallback)

Smart Explanation (topic + children + terms)

Mind Map (ReactFlow)

Academic Glossary

Keywords Extraction

Translation

Summary

Flashcards

Action Items Radar

Classroom Questions

Floating Chat

Sound Detection

Highlighted Text

Save/Load Lectures (Turso)

Admin Panel

New Visual Features (7):

Comparison Tables + Cloze

Analogy Map

Lecture Timeline

Explorable Equations

Cloze Diagrams

Exploded System View

Visualize This (5 diagram types)

Infrastructure:

Error handling system (12 categories)

API client with retry + timeout

DB versioned migrations + health check

Multi-key rotation for AI providers

Friendly Arabic error messages

Connection/offline banners

Error boundaries

🔄 IN PROGRESS
Nothing actively being coded — awaiting next directive. Last state: tsc --noEmit returned 0 errors.

📋 PLANNED (Not started)
Feature #8: Causal Loop Explorer

Feature #9: Argument Map

Feature #10: Time-lapse MindMap

40+ additional educational features

🚫 BLOCKED
Magic Link (needs email provider)

Google OAuth (invalid_client error unresolved)

HuggingFace API (blocked by Egyptian ISP)

❓ UNKNOWN
Whether Vercel deployment reflects latest changes

Whether all API keys were rotated after exposure

Long-term scalability beyond 30 users on free tier

4. PROJECT ARCHITECTURE
text
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
│                                                              │
│  ┌──────────────┐   getUserMedia()  ┌─────────────────┐    │
│  │  Mic Button  │ ────────────────→ │ MediaRecorder   │    │
│  │ (SpeechInput)│                    │ 6s chunks       │    │
│  └──────┬───────┘                    └────────┬────────┘    │
│         │                                      │             │
│         │                       FormData (webm/opus blob)   │
│         │                                      │             │
│         ↓                                      ↓             │
│  ┌──────────────────────────────────────────────────┐        │
│  │  useSpeechTranscription Hook                      │        │
│  │  (queue + retry + abort)                         │        │
│  └────────────┬─────────────────────────────────────┘        │
└───────────────┼─────────────────────────────────────────────┘
                │ POST /api/smart (multipart)
                ↓
┌─────────────────────────────────────────────────────────────┐
│            Next.js API Routes (Node runtime)                 │
│                                                              │
│  /api/smart → Hakim #1 → Hakim #2 → Groq Whisper           │
│  /api/analyze → NVIDIA → Groq → Gemini                      │
│  /api/visualize-* → Same LLM chain                          │
│  /api/health → DB check                                     │
└─────────────────────────────────────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────────────────────┐
│              External Services                               │
│                                                              │
│  Hakim AI         → Arabic STT (primary)                    │
│  Groq Whisper     → STT fallback                            │
│  NVIDIA NIM       → LLM (40 RPM × 3 keys)                  │
│  Groq LLM         → LLM fallback                            │
│  Google Gemini    → LLM last resort                         │
│  Turso (libSQL)   → Cloud database                          │
└─────────────────────────────────────────────────────────────┘
AI Provider Fallback Chain
STT (Speech-to-Text):

Hakim API Key #1 (round-robin)

Hakim API Key #2

Groq Whisper Large v3 Turbo

LLM (Text Analysis):

NVIDIA NIM (3 keys × 3 models = 9 combos)

Groq (3 models)

Gemini (2 models)

5. FILE / FOLDER STRUCTURE
text
my-web/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx              # Auth layout with logo
│   │   ├── login/page.tsx          # Login (Google hidden)
│   │   ├── login/magic-link/page.tsx  # Stub
│   │   └── signup/page.tsx
│   ├── account/page.tsx            # User dashboard (4 tabs + Progress Dashboard)
│   ├── actions/
│   │   ├── lectures.ts             # Server Actions: lectures CRUD
│   │   ├── settings.ts             # Settings CRUD
│   │   ├── study.ts                # Glossary + flashcards + stats
│   │   └── user.ts                 # getFullUser
│   ├── admin/
│   │   ├── login/page.tsx          # Admin login (password only)
│   │   ├── settings/page.tsx       # Change admin password
│   │   └── users/page.tsx          # User management
│   ├── api/
│   │   ├── action-items/route.ts   # Exam hints
│   │   ├── admin/
│   │   │   ├── change-password/route.ts
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── users/route.ts
│   │   ├── analyze/route.ts        # Topic + children + terms
│   │   ├── auth/[...all]/route.ts  # Better Auth catch-all
│   │   ├── chat/route.ts           # AI assistant
│   │   ├── classroom-questions/route.ts
│   │   ├── flashcards/route.ts
│   │   ├── health/route.ts         # ✅ NEW — DB health check
│   │   ├── keywords/route.ts
│   │   ├── smart/route.ts          # ✅ Hakim + Groq multi-key
│   │   ├── stats/timeline/route.ts # ✅ NEW — Feature #8
│   │   ├── summarize/route.ts
│   │   ├── transcribe/route.ts     # Fallback STT
│   │   ├── translate/route.ts
│   │   ├── user/profile/route.ts
│   │   ├── visualize-analogy/route.ts     # ✅ Feature #2
│   │   ├── visualize-comparison/route.ts  # ✅ Feature #1
│   │   ├── visualize-equations/route.ts   # ✅ Feature #4
│   │   ├── visualize-flow/route.ts        # Mermaid flow
│   │   ├── visualize-infographic/route.ts # Multi-section
│   │   ├── visualize-system/route.ts      # ✅ Feature #6
│   │   └── visualize-this/route.ts        # ✅ Feature #7
│   ├── error.tsx                   # Global error boundary
│   ├── global-error.tsx            # Catastrophic error boundary
│   ├── forbidden/page.tsx
│   ├── unauthorized/page.tsx
│   ├── offline/page.tsx            # ✅ NEW
│   ├── maintenance/page.tsx        # ✅ NEW
│   ├── session-expired/page.tsx    # ✅ NEW
│   ├── loading.tsx                 # Global loading
│   ├── not-found.tsx               # 404
│   ├── opengraph-image.tsx         # Dynamic OG (no edge runtime)
│   ├── robots.ts
│   ├── sitemap.ts
│   ├── layout.tsx                  # Root RTL layout
│   ├── globals.css                 # Tailwind v4 + 3 themes
│   ├── page.tsx                    # Main app orchestrator
│   └── icon.png                    # Favicon
│
├── components/
│   ├── account/
│   │   ├── ProfileTab.tsx
│   │   ├── LecturesTab.tsx
│   │   ├── StudyTab.tsx
│   │   └── SettingsTab.tsx
│   ├── auth/
│   │   ├── AuthForm.tsx
│   │   └── GoogleButton.tsx        # Disabled
│   ├── ui/
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── sonner.tsx
│   │   ├── switch.tsx
│   │   ├── tabs.tsx
│   │   ├── Skeleton.tsx
│   │   ├── CopyButton.tsx
│   │   ├── EmptyState.tsx          # ✅ NEW
│   │   └── ErrorState.tsx          # ✅ NEW (with category icons)
│   ├── ActionItemsPanel.tsx
│   ├── AnalogyMapPanel.tsx         # ✅ Feature #2
│   ├── AppShell.tsx
│   ├── AppSidebar.tsx
│   ├── AuthSessionWatcher.tsx
│   ├── Breadcrumbs.tsx
│   ├── ClassroomQuestionsPanel.tsx
│   ├── ClozeOverlay.tsx            # ✅ Feature #5
│   ├── ComparisonTablePanel.tsx    # ✅ Feature #1 + Cloze
│   ├── ConnectionBanner.tsx        # ✅ NEW
│   ├── DiagramRenderer.tsx         # ✅ Feature #7 (5 renderers)
│   ├── EquationsPanel.tsx          # ✅ Feature #4
│   ├── ErrorBoundary.tsx           # ✅ NEW
│   ├── ExplorableEquation.tsx      # ✅ Feature #4 (KaTeX + expr-eval)
│   ├── ExportButton.tsx
│   ├── FlashcardsPanel.tsx
│   ├── FloatingChat.tsx            # Uses RobotIcon
│   ├── FlowDiagramPanel.tsx        # Mermaid
│   ├── GlossaryPanel.tsx
│   ├── GlobalErrorCatcher.tsx      # ✅ NEW
│   ├── HighlightedText.tsx
│   ├── InactivityWarning.tsx
│   ├── InfographicPanel.tsx
│   ├── InfographicSectionRenderer.tsx
│   ├── KeywordsPanel.tsx
│   ├── LectureTimelinePanel.tsx    # ✅ Feature #3
│   ├── LecturesDrawer.tsx
│   ├── MermaidDiagram.tsx          # ✅ NEW
│   ├── MindMap.tsx                 # ReactFlow
│   ├── OfflineIndicator.tsx
│   ├── ProgressDashboard.tsx       # ✅ NEW (Recharts)
│   ├── RetryButton.tsx             # ✅ NEW
│   ├── RobotIcon.tsx
│   ├── ScrollToTop.tsx
│   ├── SearchInTranscript.tsx      # Unused
│   ├── SkipToContent.tsx
│   ├── SoundIndicator.tsx
│   ├── SpeechInput.tsx
│   ├── SummaryPanel.tsx
│   ├── SystemExplorerPanel.tsx     # ✅ Feature #6
│   ├── ThemeProvider.tsx
│   ├── ThemeSwitcher.tsx
│   ├── TopProgressBar.tsx
│   └── VisualizeThisPanel.tsx      # ✅ Feature #7
│
├── hooks/
│   ├── useSpeechTranscription.ts   # ✅ 6s chunks + retry + abort
│   ├── useInactivityLogout.ts
│   ├── useLoginRateLimit.ts
│   ├── useSoundDetection.ts
│   ├── useNetworkStatus.ts         # ✅ NEW
│   └── useRetry.ts                 # ✅ NEW
│
├── lib/
│   ├── ai/
│   │   └── provider.ts             # ✅ Multi-key NVIDIA + Groq + Gemini
│   ├── db/
│   │   ├── index.ts                # ✅ Versioned migrations + safeExecute
│   │   └── queries.ts              # All DB queries
│   ├── ai-types.ts                 # All types (Comparison, Analogy, Equation, System, Diagram)
│   ├── api-client.ts               # ✅ NEW — fetch wrapper
│   ├── auth-client.ts
│   ├── auth.ts                     # Better Auth config
│   ├── error-toast.ts              # ✅ NEW
│   ├── errors.ts                   # ✅ NEW — 12 categories + Arabic
│   ├── features.ts                 # All feature definitions
│   ├── logger.ts                   # ✅ NEW
│   ├── rate-limit.ts               # In-memory with unref timer
│   ├── safe-json.ts                # ✅ NEW
│   ├── safe-storage.ts             # ✅ NEW
│   ├── themes.ts                   # 3 themes metadata
│   ├── utils.ts                    # cn() helper
│   └── validators.ts               # ✅ NEW
│
├── public/
│   ├── logo.png
│   ├── file.svg, globe.svg, next.svg, vercel.svg, window.svg
│   └── screenshots/
│
├── proxy.ts                        # Next.js 16 middleware replacement
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
├── package.json
├── package-lock.json
├── .env.local                      # SECRETS (gitignored)
├── .env.example
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── components.json
├── README.md
├── settings.json
└── sqlite.db, sqlite.db-shm, sqlite.db-wal
6. TECHNOLOGY STACK
Category	Technology	Version	Purpose	Status
Runtime	Node.js	24.20.0	Runtime	[CONFIRMED]
Framework	Next.js	16.3.5 (Turbopack)	App Router	[CONFIRMED]
UI Lib	React	19.2.8	UI	[CONFIRMED]
Language	TypeScript	5.9.3	Type safety	[CONFIRMED]
Styling	Tailwind CSS	v4	Styling	[CONFIRMED]
Icons	lucide-react	^1.46.0	Icons	[CONFIRMED]
Animation	motion (framer-motion)	^11.18.2	Animations	[CONFIRMED]
Mind Map	reactflow	^11.11.4	Diagrams	[CONFIRMED]
Charts	recharts	latest	Data viz	[CONFIRMED]
Diagram	mermaid	latest	Flowcharts	[CONFIRMED]
Math	katex	latest	Equation rendering	[CONFIRMED]
Math eval	expr-eval	latest	Live equation calculation	[CONFIRMED]
Notifications	sonner	^2.0.8	Toasts	[CONFIRMED]
Auth	Better Auth	^1.7.5	Auth	[CONFIRMED]
Database	Turso (libSQL)	latest	Cloud SQLite	[CONFIRMED]
DB Client	@libsql/client + Kysely	latest	DB queries	[CONFIRMED]
STT	Hakim AI	v2	Arabic STT	[CONFIRMED]
STT fallback	Groq Whisper Large v3 Turbo	—	STT	[CONFIRMED]
LLM	NVIDIA NIM	40 RPM	Primary LLM	[CONFIRMED]
LLM	Groq	—	Fallback LLM	[CONFIRMED]
LLM	Google Gemini	3.6-flash	Last resort	[CONFIRMED]
Deployment	Vercel	Hobby plan	Hosting	[CONFIRMED]
Uninstalled (Dead deps removed):

@anthropic-ai/sdk

@huggingface/transformers

@supabase/ssr

@supabase/supabase-js

7. DATABASE SCHEMA (Turso)
Better Auth Tables (auto-created)
user: id, name, email, emailVerified, image, fullName, university, studentId, role, createdAt, updatedAt

session: id, expiresAt, token, createdAt, updatedAt, ipAddress, userAgent, userId

account: id, accountId, providerId, userId, accessToken, refreshToken, idToken, accessTokenExpiresAt, refreshTokenExpiresAt, scope, password, createdAt, updatedAt

verification: id, identifier, value, expiresAt, createdAt, updatedAt

Custom Tables
user_settings: id, userId (UNIQUE), theme, transcriptFontSize, colorCodingEnabled, soundDetectionEnabled, soundSensitivityQuiet, soundSensitivityNormal, soundSensitivityLoud, soundSensitivitySpike, createdAt, updatedAt

saved_lectures: id, userId, name, transcript, summary, mindMapJson, glossaryJson, wordCount, durationMs, createdAt, updatedAt + INDEX (userId, createdAt DESC)

saved_glossary: id, userId, term, definition, sourceLectureId, starred, createdAt + INDEX (userId, createdAt DESC)

flashcards_progress: id, userId, question, answer, difficulty, sourceLectureId, masteryLevel, reviewCount, lastReviewedAt, createdAt + INDEX (userId, createdAt DESC)

admin_settings: id, passwordHash, passwordSalt, updatedAt — scrypt hashing

_migrations: id, appliedAt — versioned migrations tracking [NEW]

CRITICAL DB RULES
All queries are ASYNC — use db.execute({ sql, args })

NEVER use db.prepare()

Password hashing uses Node crypto scryptSync (16-byte salt, 64-byte key)

safeExecute() wrapper adds 15s timeout

dbHealth() check available at /api/health

8. API ENDPOINTS
Method	Route	Rate Limit	Purpose
POST	/api/smart	15/min	STT (Hakim → Groq)
POST	/api/transcribe	15/min	Fallback STT
POST	/api/analyze	15/min	Topic + children + terms
POST	/api/chat	20/min	AI assistant
POST	/api/summarize	10/min	Lecture summary
POST	/api/keywords	15/min	Extract keywords
POST	/api/flashcards	10/min	Generate flashcards
POST	/api/action-items	10/min	Exam hints
POST	/api/classroom-questions	10/min	Infer distant questions
POST	/api/translate	15/min	Translate EN→AR
POST	/api/visualize-flow	10/min	Mermaid flow
POST	/api/visualize-infographic	8/min	Multi-section infographic
POST	/api/visualize-comparison	10/min	Comparison tables
POST	/api/visualize-analogy	10/min	Analogy maps
POST	/api/visualize-equations	8/min	Equation capture
POST	/api/visualize-system	10/min	Layered systems
POST	/api/visualize-this	10/min	5-template diagrams
GET	/api/stats/timeline	—	30-day activity
GET	/api/health	—	DB + uptime
PATCH	/api/user/profile	—	Update user profile
POST	/api/admin/login	5 attempts → 5min lock	Admin login
GET/DELETE	/api/admin/users	30/min	Manage users
POST	/api/admin/change-password	5/min	Change password
POST	/api/admin/logout	30/min	Clear cookie
ALL	/api/auth/[...all]	—	Better Auth catch-all
9. ENVIRONMENT VARIABLES (.env.local)
env
# ================ Better Auth ================
BETTER_AUTH_SECRET=[REDACTED SECRET]
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ================ Admin ================
ADMIN_PASSWORD=[REDACTED SECRET]

# ================ AI Services ================
# Hakim AI (Arabic-first STT)
HAKIM_API_KEY=[REDACTED SECRET]
HAKIM_API_KEY_2=[REDACTED SECRET]

# NVIDIA NIM (40 RPM free — primary LLM)
NVIDIA_API_KEY=[REDACTED SECRET]
NVIDIA_API_KEY_2=[REDACTED SECRET]
NVIDIA_API_KEY_3=[REDACTED SECRET]

# Groq (Whisper fallback + LLM)
GROQ_API_KEY=[REDACTED SECRET]

# Google Gemini (LLM fallback)
GEMINI_API_KEY=[REDACTED SECRET]
GEMINI_API_KEY_2=[REDACTED SECRET]

# HuggingFace (for FLUX — blocked by ISP)
HF_TOKEN=[REDACTED SECRET]

# ================ Turso ================
TURSO_DATABASE_URL=libsql://[REDACTED]
TURSO_AUTH_TOKEN=[REDACTED SECRET]

# ================ Google OAuth ================
GOOGLE_CLIENT_ID=[REDACTED SECRET]
GOOGLE_CLIENT_SECRET=[REDACTED SECRET]
⚠️ WARNING: All API keys were exposed in chat. User was advised to rotate all.

10. AI PROVIDER ARCHITECTURE
File: lib/ai/provider.ts

3-Tier Fallback System
Tier 1 — NVIDIA NIM (multi-key + multi-model):

Reads NVIDIA_API_KEY, _2, _3

Models tried in order:

meta/llama-3.3-70b-instruct (NEW — old 3.1 was 410 Gone)

nvidia/llama-3.3-nemotron-super-49b-v1

meta/llama-3.1-70b-instruct

mistralai/mistral-nemotron

On 429: next key. On 404/400: next model.

Tier 2 — Groq:

Models: openai/gpt-oss-20b, openai/gpt-oss-120b, qwen/qwen3-32b

On 429: fail to next provider

Tier 3 — Google Gemini:

Models: gemini-3.6-flash, gemini-flash-latest

Multi-key rotation

API:

typescript
generateText({
  systemPrompt, messages, temperature, maxTokens,
  prefer?: "nvidia" | "groq" | "gemini",
  jsonMode?: boolean
}) → { ok, text?, provider?, model?, error? }
Friendly Error Messages: All errors are converted to Arabic user-friendly messages via FRIENDLY_ERRORS map.

11. STT ARCHITECTURE (/api/smart)
Provider chain (in order):

Hakim #1 — Round-robin, 4.3s per 10s chunk

Hakim #2 — Failover on 429/401

Groq Whisper Large v3 Turbo — Fallback

Chunk settings (in hooks/useSpeechTranscription.ts):

CHUNK_DURATION_MS = 6_000 (was 25s → 10s → 6s)

MIN_BLOB_SIZE = 4000

Retry: 2 attempts on network error

Abort: Uses AbortController for cancel on stop

Queue: FIFO processing with prevention of double-start

Hakim API call:

typescript
POST https://api.tryhakim.ai/v1/audio/transcriptions
Headers: { Authorization: Bearer hk_live_... }
Body: {
  file: audio (webm),
  model: "hakim-arab-v2",
  language: "ar",
  response_format: "json"
}
12. FEATURES (22 total)
Core Features (15)
Live Transcription — Hakim + Groq fallback, 6s chunks

Smart Explanation — Topic + children + terms (NVIDIA → Groq → Gemini)

Mind Map — ReactFlow radial layout, accumulates topics

Academic Glossary — Color-coded term cards

Keywords — Categories + importance stars + filter chips

Translation — EN→AR technical terms with pronunciation

Lecture Summary — Title + overview + keyPoints + conclusion

Flashcards — 3D flip animation, difficulty badges

Action Items Radar — Exam/assignment hints with toast notifications

Classroom Questions — Infer distant students' questions

Floating Chat — Draggable AI assistant (uses RobotIcon)

Sound Detection — Vertical meter with 4 levels

Highlighted Text — English blue, numbers violet, keywords amber

Save/Load Lectures — Turso DB

Admin Panel — User management + password change

New Visual Features (7)
Comparison Tables + Cloze — Extract "X vs Y" comparisons, add cloze practice mode

Analogy Map — "Cache زي المكتب" → 2 columns + correspondence mapping + where analogy breaks

Lecture Timeline — Density chart, no LLM needed, click segments

Explorable Equations — KaTeX + sliders + Recharts curve + expr-eval + "try automatic" button

Cloze Diagrams — Interactive cloze overlay, matches cells with shuffled chips

Exploded System View — OSI, TCP/IP, Compiler layers, with scenario player animation

Visualize This — 5 templates: sequence, cycle, hierarchy, comparison, layers

13. ERROR HANDLING SYSTEM
12 Error Categories:

network, timeout, offline, auth, permission, notFound, validation, rateLimit, server, provider, storage, unknown

Each category has:

Arabic title (e.g., "مشكلة في الاتصال")

Arabic description

Arabic hint (e.g., "اتأكد إن الإنترنت شغال")

Icon (wifi, clock, lock, shield, search, alert, server, hard-drive)

Color theme (amber for warnings, rose for errors)

Retryable flag

Components:

<ErrorState category="..." /> — full block error display

<EmptyState icon={...} /> — empty data

<ErrorBoundary> — React error boundary with retry

<ConnectionBanner> — offline/online indicator

toastError(appError) — Sonner toast with icon + hint

Files:

lib/errors.ts — categories, factory, normalize

lib/api-client.ts — fetch wrapper with timeout + retry

lib/error-toast.ts — toast helpers

lib/safe-storage.ts, lib/safe-json.ts, lib/validators.ts, lib/logger.ts

14. COMPLETE ERROR HISTORY & DEBUGGING KNOWLEDGE
Error #1: Web Speech API "Could not connect to speech recognition service"
Cause: Google blocks service on Egyptian ISPs

Fix: Abandoned approach

Do NOT retry

Error #2: gsk_gsk_ double prefix in Groq key
Cause: User pasted key twice

Fix: Use single gsk_ prefix

Warning: Groq keys are 56 chars starting with gsk_

Error #3: EncodingError: Unable to decode audio data (Transformers.js)
Cause: Browser AudioContext couldn't handle webm/opus

Fix: Abandoned browser-based inference

Do NOT retry

Error #4: Gemini 404 — models/gemini-2.5-flash is no longer available
Fix: Changed to gemini-3.6-flash

Warning: Google deprecates model names aggressively

Error #5: Gemini 429 Rate Limit
Cause: Free tier audio quota tight; 15s chunks → 4 req/min

Fix: Switched to Groq → eventually Hakim

Error #6: Groq 401 Invalid API Key
Cause: .env.local contained gsk_gsk_...

Fix: Replace with single-prefix key + restart server

Error #7: Cannot convert argument to a ByteString because the character at index 11 has a value of 1575
Cause: Arabic character (1575 = ا) got into API key

Fix: Copy key via copy button only

Error #8: Groq models all decommissioned (2026)
Cause: llama-3.1-8b-instant, llama-3.2-3b-preview, gemma2-9b-it, mixtral-8x7b-32768 all decommissioned

Fix: Updated GROQ_MODELS to openai/gpt-oss-20b, openai/gpt-oss-120b, qwen/qwen3-32b

Error #9: NVIDIA 410 Gone
Cause: meta/llama-3.1-8b-instruct reached end of life

Fix: Updated to meta/llama-3.3-70b-instruct, nvidia/llama-3.3-nemotron-super-49b-v1

Error #10: HuggingFace getaddrinfo ENOTFOUND api-inference.huggingface.co
Cause: Egyptian ISP blocks HF inference API

Fix: Removed HF from STT provider chain

Error #11: React Flow nodeTypes warning
Cause: nodeTypes object created inside component

Fix: Memoize outside component

Error #12: favicon.ico overriding icon.png
Fix: Deleted app/favicon.ico

Error #13: switch.tsx Tailwind typo
Bug: data-[size=sm]:h-3.5data-[size=sm]:h-[14px] — missing space

Status: Resolved (verified file)

Error #14: Mojibake in HighlightedText.tsx
Bug: Corrupted Arabic (Windows-1256 encoding)

Status: Verified clean in current state

Error #15: lib/auth.ts invalid export const runtime = "nodejs"
Cause: Runtime export in non-route file

Fix: Removed

Error #16: TypeError: Failed to fetch in browser
Cause: First request arrives before Next.js compiles route (dev only)

Fix: Added network retry logic in hook

Error #17: USER_MESSAGES missing after refactor
Cause: Renamed to CATEGORY_META but api-client.ts still imported old name

Fix: Updated import

Error #18: ComparisonTable type conflict
Cause: Two types with same name (old from Infographic, new from Feature #1)

Fix: Renamed to InfographicComparisonTable for the old one

Error #19: id: "classroomQuestions" | "flowDiagram" broke object literal
Cause: PowerShell replace hit both type definition AND object literal

Fix: Rewrote features.ts from scratch

15. REJECTED / POSTPONED IDEAS
Idea	Status	Reason
Web Speech API	[REJECTED]	Google blocks Egyptian ISPs
Transformers.js in browser	[REJECTED]	Decoding errors, model too small
n8n workflow for STT	[REJECTED]	Just a proxy, adds complexity
Anthropic Claude API	[REJECTED]	No free tier
Gemini 2.0/2.5-flash	[DEPRECATED]	Model deprecated for new users
Gemini for audio	[REJECTED]	Rate limit too strict
Supabase	[REJECTED]	DNS issues
better-sqlite3	[REJECTED]	Synchronous, conflicts with async libSQL
middleware.ts	[DEPRECATED]	Replaced by proxy.ts in Next.js 16
Magic Link auth	[REJECTED]	Needs email provider
Telegram bot	[POSTPONED]	Time constraint
Text-to-Infographic (Napkin)	[POSTPONED → then IMPLEMENTED with custom solution]	—
HuggingFace FLUX	[BLOCKED]	ISP blocks HF API
Bytez	[REJECTED]	$1/month + 7B models only
Alibaba Qwen3-ASR	[REJECTED]	Requires credit card
Full chat with professor	[REJECTED]	App is for students only
16. USER PREFERENCES & DEVELOPMENT STYLE
Language: Arabic (Egyptian dialect for explanations, technical terms in English)

Tone: Direct, no fluff, blunt honesty, no flattery

Constraints repeatedly emphasized:

PowerShell only — user does not open VS Code

No manual testing — wants automated test scripts via PowerShell

Wants full file replacements, not snippets

Wants error messages in Arabic (not raw JSON)

Wants errors to look "شيك" (nice), not scary

$0 cost — no paid APIs

Works in Egypt without VPN

Chrome only

RTL Arabic first

No npm run dev from wrong folder (recurring issue)

Wants maximum work in single command

Dislikes:

Vague suggestions

Repeating failed approaches

Long summaries

Wasting time

Simple error messages (wants specific causes)

Prefers:

One-shot definitive solutions

Batch operations (multiple features at once)

Clear structure and organization

17. TESTING
No formal tests exist. [CONFIRMED]

Manual test approach:

PowerShell test script hits all endpoints with Arabic text

Checks server health at /api/health

Validates each feature responds correctly

Test Script (PART A of latest feature script):

Server health check

9 endpoints tested with test Arabic text

Results table displayed

18. PERFORMANCE & SCALABILITY
Current bottleneck analysis:

Resource	Limit	Max Users
Hakim STT	10K credit/month (×2 keys)	~8-13 lectures
Groq Whisper	2000 req/day	~4 lectures
NVIDIA NIM LLM	40 RPM × 3 keys = 120 RPM	~360 RPM effective
Groq LLM	1000 req/day per model	~100 users
Gemini	1500 req/day	~150 users
Vercel Hobby	1M invocation/month	~200 users
Turso Free	5GB storage	~17K lectures
Verdict: Max ~30 daily active users on free tier, or ~200 light users.

19. DEPLOYMENT
Vercel:

Auto-deploy on git push to main

Framework: Next.js

Node: 20+

Hobby plan (60s serverless timeout, 10s default)

GitHub:

Repo: khalid8923/Real_time_Assistive_System_vir2

Branch: main

Latest commit: 724d2ad (fix: Groq models + NVIDIA NIM + error handling system + DB improvements)

Local:

powershell
Set-Location "D:\Real_time_Assistive_System\my-web"
npm run dev
# runs on http://localhost:3000
WARNING: npm run dev must be run from my-web folder, not system32.

20. TECHNICAL DEBT
Item	File	Severity
HF_TOKEN exposed	.env.local	High
All API keys exposed in chat	.env.local	Critical
No unit tests	Entire project	High
SearchInTranscript.tsx unused	components	Low
Vercel Hobby limits	Infrastructure	High
Groq 429 on high load	provider.ts	Medium
No rate limit retry on Whisper	/api/smart	Low (fixed with retry)
Google OAuth broken	lib/auth.ts	Medium
Magic Link stub	login/magic-link	Low
NVIDIA models may deprecate	provider.ts	Medium
Very large components (>400 lines)	Multiple	Low
21. ROADMAP — NEXT FEATURES
Tier S (Completed)
✅ #1 Comparison Tables

✅ #2 Analogy Map

✅ #3 Lecture Timeline

✅ #4 Explorable Equations

✅ #5 Cloze Diagrams

Tier A (Completed/Next)
✅ #6 Exploded System View

✅ #7 Visualize This

⏳ #8 Causal Loop Explorer

⏳ #9 Argument Map

⏳ #10 Time-lapse MindMap

Tier B (Planned)
Concept Constellation

Practice Quiz

Mastery Dashboard

Board Reference Alerts

Syllabus Coverage Tracker

Postponed
Slide Sync (needs spike)

Data Snapshots

Expressive Captions

22. OPEN QUESTIONS
Does NVIDIA NIM hold up under sustained load?

Best chunk duration tradeoff (6s vs 8s vs 10s)?

Can we get more Hakim keys or free credits?

Should we move to Fly.io for better free tier?

Is Turso going to scale beyond 200 users on free?

How to handle key rotation on Vercel?

23. IMMEDIATE NEXT STEPS
Must do immediately
Test Feature #7 (Visualize This) via PowerShell

Verify 5 templates render correctly

Rotate all exposed API keys

Commit latest changes to GitHub

Should do next
Implement Feature #8 (Causal Loop Explorer)

Implement Feature #9 (Argument Map)

Implement Feature #10 (Time-lapse MindMap)

Should verify
/api/health DB status

Vercel deployment reflects latest changes

Multi-key rotation works under load

Future work
Test with real 15-minute lecture

Optimize chunk duration

Add Cerebras as backup LLM

Implement Practice Quiz + Mastery Dashboard

24. INSTRUCTIONS FOR THE NEXT AI
You are inheriting a partially complete Next.js 16 project called CaptionBridge — a real-time AI-powered lecture assistant for university students (focusing on STEM fields).

Before You Do Anything:
Read this entire document — do not skip sections.

Check the actual project files before making architectural decisions.

Preserve existing decisions unless you have a strong, explicit reason to change them.

Status Handling Rules:
[CONFIRMED / IMPLEMENTED] — Treat as established, immutable context.

[PLANNED] — Intended work, ready to implement when asked.

[PROPOSED] — Optional; ask user before implementing.

[REJECTED] — Do NOT re-suggest.

[POSTPONED] — Do NOT implement yet.

[UNKNOWN] / [REQUIRES VERIFICATION] — Verify with actual files first.

[DEPRECATED] — Do NOT resurrect.

Hard Constraints:
❌ Do NOT switch to better-sqlite3

❌ Do NOT use Supabase

❌ Do NOT use middleware.ts (uses proxy.ts)

❌ Do NOT remove rate limiting

❌ Do NOT use db.prepare() — use db.execute({ sql, args })

❌ Do NOT push to GitHub without explicit permission

❌ Do NOT re-enable Google OAuth until invalid_client is fixed

❌ Do NOT implement Magic Link/Telegram/FLUX until user gives green light

❌ Do NOT switch to Web Speech API or Transformers.js

❌ Do NOT use Gemini 2.0/2.5 models (deprecated)

❌ Do NOT re-add @anthropic-ai/sdk or @huggingface/transformers

❌ Do NOT use VS Code — user works only in PowerShell

Must Maintain:
✅ TypeScript strict mode compatibility

✅ Async DB operations

✅ Arabic RTL UI

✅ Rate limiting on new endpoints

✅ Design system: Violet (#8470ff) + Sky blue (#67bfff)

✅ Better Auth as auth solution

✅ Turso as database

✅ Friendly Arabic error messages (no raw JSON)

✅ Multi-key rotation for AI providers

✅ Error handling system (12 categories)

Communication Style:
Speak in Arabic (Egyptian dialect) with English technical terms

Be direct and honest — no flattery

Warn about security issues immediately

Provide full PowerShell scripts (no VS Code)

Walk through steps one at a time

Use Set-Location "D:\Real_time_Assistive_System\my-web" as first line

Immediate Priority:
The user was last working on:

Feature #7 (Visualize This) — just implemented, needs testing

Next up: Feature #8 (Causal Loop Explorer)

Continue from THIS state. Do not restart the project.

25. FINAL PROJECT STATE SNAPSHOT
Project
CaptionBridge — كابتشن بريدج — "رفيقك الذكي في المحاضرات الجامعية"

Purpose
Real-time AI-powered lecture assistant for university STEM students. Transcribes Arabic speech, generates visual study materials (comparison tables, analogies, timelines, equations, system diagrams, and 5-template auto-diagrams).

Current Stage
Hackathon/Graduation project — pre-submission. 22 features live in production.

Stack
Next.js 16.3.5 (App Router + Turbopack) + TypeScript 5.9.3 + React 19.2.8 + Tailwind v4 + shadcn/ui + Motion + ReactFlow + Recharts + Mermaid + KaTeX + expr-eval + Better Auth 1.7.5 + Turso (libSQL) + Hakim AI + Groq Whisper + NVIDIA NIM + Groq LLM + Gemini + Vercel

Architecture
RSC-first with client components for interactivity. Server Actions for mutations. API routes for AI calls. proxy.ts as middleware. Multi-provider fallback chains for STT and LLM.

Database
Turso (libSQL, cloud). 4 Better Auth tables + 6 custom tables + _migrations. All queries async via @libsql/client.

Backend
Next.js API routes (24 endpoints). All rate-limited. AI calls via lib/ai/provider.ts with friendly Arabic error messages.

Frontend
Arabic RTL UI. 3 themes (light/dark/focus). Recharts for charts. ReactFlow for MindMap. Mermaid for flowcharts. KaTeX for equations. Error handling system with 12 categories.

AI
STT: Hakim AI (multi-key round-robin) + Groq Whisper fallback

LLM: NVIDIA NIM (3 keys × 4 models) → Groq (3 models) → Gemini (2 models)

Error handling: Arabic friendly messages (no raw JSON)

Games
None — not a game project.

Adaptive System
None — not applicable.

Authentication
Better Auth with email/password. Google OAuth (hidden in UI). Admin mode via separate cookie.

Admin
/admin/* routes with admin_mode cookie. Password-only login. User management + password change.

Analytics
Basic user stats. Progress Dashboard with 3 charts (Area, Bar, Pie).

Completed
All 22 features

All 24 API endpoints

Error handling system

DB versioned migrations

Multi-key rotation

Progress Dashboard

New visual features (1-7)

In Progress
Nothing actively — awaiting next directive.

Planned
Features #8, #9, #10

Practice Quiz + Mastery Dashboard

30+ additional educational features

Blocked
Magic Link (needs email provider)

Google OAuth (invalid_client error)

HuggingFace (ISP blocks)

Alibaba Cloud (requires credit card)

Known Bugs
Groq 429 on high load

NVIDIA models may deprecate over time

npm run dev must be run from correct folder

Technical Debt
No unit tests

HF_TOKEN exposed

All API keys exposed in chat

Large component files (>400 lines)

Immediate Next Steps
Test Feature #7 (Visualize This) via PowerShell

Rotate all exposed API keys

Implement Feature #8 (Causal Loop Explorer)

Implement Feature #9 (Argument Map)

Implement Feature #10 (Time-lapse MindMap)

Implement Practice Quiz + Mastery Dashboard

END OF HANDOFF DOCUMENT

Document Status: Complete
Last Updated: From latest conversation state (Feature #7 just implemented, tsc --noEmit = 0 errors)