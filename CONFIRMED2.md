CAPTIONBRIDGE
Generated: From complete conversation history
Purpose: Transfer complete project context to a new AI model
Status Legend: [CONFIRMED] [PLANNED] [PROPOSED] [REJECTED] [EXPERIMENTAL] [DEPRECATED] [UNKNOWN] [REQUIRES VERIFICATION]

1. PROJECT IDENTITY
Project Name: CaptionBridge — كابتشن بريدج

Original Tagline: "جسر التواصل للطلاب الصم" (Bridge of communication for deaf students)
Current Tagline (after rebranding): "رفيقك الذكي في المحاضرات الجامعية" (Your smart companion in university lectures) [CONFIRMED]

Purpose:
Real-time AI-powered web application that helps deaf and hard-of-hearing university students follow university lectures by transcribing speech in real-time and using generative AI to produce smart summaries, mind maps, glossaries, flashcards, action items, and classroom Q&A.

Core Problem Solved:

In Egypt and the Arab world, over 2 million deaf students study in regular universities. When a professor explains for 2 hours, the deaf student leaves with no comprehension.

Target Users:

Primary: Deaf and hard-of-hearing university students [CONFIRMED — original scope]

After Rebranding: General university students (more inclusive) [CONFIRMED — recent decision]

Secondary: Any student wanting better comprehension and organized notes

Platform: Web application (RTL-first, Arabic UI with Egyptian dialect recognition)

Project Type: Hackathon / Graduation Project

Author: Khalid Mohammed, Horus University, Faculty of Computers & AI

GitHub: https://github.com/khalid8923/Real_time_Assistive_System_vir2
Live Site: https://real-time-assistive-system-vir2.vercel.app

2. TECHNOLOGY STACK
Category	Technology	Version	Status
Framework	Next.js (App Router + Turbopack)	16.3.5	[CONFIRMED]
Language	TypeScript	5.9.3	[CONFIRMED]
UI Library	React	19.2.8	[CONFIRMED]
CSS	Tailwind CSS	v4	[CONFIRMED]
Components	shadcn/ui (base-nova style)	-	[CONFIRMED]
Icons	Lucide React	1.46.0	[CONFIRMED]
Animation	Motion (framer-motion)	11.18.2	[CONFIRMED]
Notifications	Sonner	2.0.8	[CONFIRMED]
Flow Diagrams	ReactFlow	11.11.4	[CONFIRMED]
Auth	Better Auth	1.7.5	[CONFIRMED]
Database	Turso (libSQL)	-	[CONFIRMED]
DB Client	@libsql/client + Kysely + @libsql/kysely-libsql	-	[CONFIRMED]
Speech AI	Groq Whisper Large V3 Turbo	-	[CONFIRMED]
Text AI (Primary)	Google Gemini (multi-key)	2.22.0	[CONFIRMED]
Text AI (Fallback)	Groq Llama models	-	[CONFIRMED]
Deployment	Vercel (auto-deploy)	-	[CONFIRMED]
Node Version	20+	-	[CONFIRMED]
Deprecated/Rejected:

❌ Supabase — was tried, had DNS issues [REJECTED]

❌ better-sqlite3 — synchronous, conflicts with libSQL async [REJECTED]

❌ middleware.ts — replaced by proxy.ts in Next.js 16 [DEPRECATED]

3. DEVELOPMENT HISTORY
Phase 1: Initial Build
Built the base CaptionBridge app with core features

Set up Next.js 16 + Better Auth + Turso

Implemented 12 features + 16 API routes

Phase 2: AI Fallback Fixes
[CONFIRMED] commit 57e7a51: Fix /api/smart to only use Whisper (removed LLM refinement to avoid 60s Vercel timeout)

[CONFIRMED] commit a08b569: Switch to Groq-first, update model names

[CONFIRMED] commit 5657522: Add multi-key Gemini + Groq fallbacks

[CONFIRMED] commit 5537c4e: Add Groq model fallbacks + fix 404 errors

[CONFIRMED] commit 60c287d: Fix use db.execute() instead of db.prepare() in admin/users

Phase 3: Rebranding & Logo (Current)
[CONFIRMED] commit e420c63: "feat: new logo, rebranding, robot icon, clear transcript button"

Changed tagline from "جسر التواصل للطلاب الصم" → "رفيقك الذكي في المحاضرات الجامعية"

Added new logo (public/logo.png + app/icon.png)

Added RobotIcon.tsx for AI chat button

Removed "جديد" badges from features

Phase 4: UX Cleanup (Current)
[CONFIRMED] Removed search button from SpeechInput, added trash/clear button

[CONFIRMED] Hidden Google login/signup buttons (commented out)

[CONFIRMED] Changed "إيميل الجامعة" → "الإيميل"

[CONFIRMED] Removed placeholders from signup form

Phase 5: Postponed Features
[POSTPONED] Ask Professor (Telegram bot integration) — decided to postpone until after hackathon qualification

[POSTPONED] Text-to-Infographic (Napkin.ai style) — decided to postpone

[REJECTED] Magic Link — decided it's not worth the time investment for hackathon

4. COMPLETE FILE STRUCTURE
text
my-web/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx              # Auth layout with logo + gradient bg
│   │   ├── login/page.tsx          # Login page (Google button HIDDEN)
│   │   ├── login/magic-link/page.tsx  # Stub — shows "coming soon"
│   │   └── signup/page.tsx         # Signup (Google button HIDDEN, placeholders removed)
│   ├── account/page.tsx            # User dashboard (4 tabs)
│   ├── actions/
│   │   ├── lectures.ts             # Server Actions: lectures CRUD
│   │   ├── settings.ts             # Server Actions: user settings
│   │   ├── study.ts                # Server Actions: glossary + flashcards + stats
│   │   └── user.ts                 # Server Action: getFullUser
│   ├── admin/
│   │   ├── login/page.tsx          # Admin login (password only)
│   │   ├── settings/page.tsx       # Admin change password
│   │   └── users/page.tsx          # Admin users management
│   ├── api/
│   │   ├── action-items/route.ts   # Extract exam/assignment hints
│   │   ├── admin/
│   │   │   ├── change-password/route.ts
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── users/route.ts
│   │   ├── analyze/route.ts        # Topic + children + terms
│   │   ├── auth/[...all]/route.ts  # Better Auth catch-all
│   │   ├── chat/route.ts           # AI assistant Q&A
│   │   ├── classroom-questions/route.ts
│   │   ├── flashcards/route.ts     # ✅ FIXED — was wrong content
│   │   ├── keywords/route.ts       # ✅ FIXED — was wrong content
│   │   ├── smart/route.ts          # Whisper only
│   │   ├── summarize/route.ts
│   │   ├── transcribe/route.ts     # Fallback Whisper
│   │   ├── translate/route.ts
│   │   └── user/profile/route.ts
│   ├── error.tsx                   # Global error boundary
│   ├── global-error.tsx            # Catastrophic error boundary
│   ├── forbidden/page.tsx          # 403 page
│   ├── unauthorized/page.tsx       # 401 page
│   ├── loading.tsx                 # Global loading skeleton
│   ├── not-found.tsx               # 404 page
│   ├── opengraph-image.tsx         # Dynamic OG image
│   ├── robots.ts                   # robots.txt
│   ├── sitemap.ts                  # sitemap.xml
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Design system (3 themes)
│   ├── page.tsx                    # Main app page
│   ├── icon.png                    # ✅ NEW — favicon (replaces favicon.ico)
│   └── favicon.ico                 # ⚠️ SHOULD BE DELETED (overrides icon.png)
│
├── components/
│   ├── account/
│   │   ├── ProfileTab.tsx
│   │   ├── LecturesTab.tsx
│   │   ├── StudyTab.tsx
│   │   └── SettingsTab.tsx
│   ├── auth/
│   │   ├── AuthForm.tsx            # AuthForm, AuthInput, AuthPasswordInput
│   │   └── GoogleButton.tsx        # ✅ MODIFIED — now shows "قيد التطوير" (disabled)
│   ├── ui/                         # shadcn components
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── sonner.tsx
│   │   ├── switch.tsx
│   │   ├── tabs.tsx
│   │   ├── Skeleton.tsx
│   │   └── CopyButton.tsx
│   ├── ActionItemsPanel.tsx
│   ├── AppShell.tsx                # ✅ MODIFIED — uses new logo
│   ├── AppSidebar.tsx              # ✅ MODIFIED — uses new logo, badges removed
│   ├── AuthSessionWatcher.tsx
│   ├── Breadcrumbs.tsx
│   ├── ChatPanel.tsx               # Legacy
│   ├── ClassroomQuestionsPanel.tsx
│   ├── ExportButton.tsx
│   ├── FlashcardsPanel.tsx
│   ├── FloatingChat.tsx            # ✅ MODIFIED — uses RobotIcon
│   ├── GlossaryPanel.tsx
│   ├── HighlightedText.tsx         # ⚠️ HAS MOJIBAKE BUG in KEYWORD_PATTERNS
│   ├── InactivityWarning.tsx
│   ├── KeywordsPanel.tsx
│   ├── LecturesDrawer.tsx
│   ├── MindMap.tsx                 # ReactFlow
│   ├── OfflineIndicator.tsx
│   ├── RobotIcon.tsx               # ✅ NEW — robot with graduation cap + pen
│   ├── ScrollToTop.tsx
│   ├── SearchInTranscript.tsx      # ⚠️ NO LONGER USED in SpeechInput
│   ├── SkipToContent.tsx
│   ├── SoundIndicator.tsx
│   ├── SpeechInput.tsx             # ✅ MODIFIED — clear button, no search
│   ├── SummaryPanel.tsx
│   ├── ThemeProvider.tsx
│   ├── ThemeSwitcher.tsx
│   └── TopProgressBar.tsx
│
├── hooks/
│   ├── useSpeechTranscription.ts   # ✅ MODIFIED — added clearTranscript
│   ├── useInactivityLogout.ts
│   ├── useLoginRateLimit.ts
│   └── useSoundDetection.ts
│
├── lib/
│   ├── ai/provider.ts              # Multi-key Gemini + Groq fallback
│   ├── db/index.ts                 # Turso client + migrations
│   ├── db/queries.ts               # All DB queries
│   ├── ai-types.ts                 # Shared AI types
│   ├── auth.ts                     # Better Auth config
│   ├── auth-client.ts              # Client-side Better Auth
│   ├── features.ts                 # Feature list + categories
│   ├── rate-limit.ts               # In-memory rate limiter
│   ├── themes.ts                   # Theme metadata
│   └── utils.ts                    # cn() helper
│
├── public/
│   ├── logo.png                    # ✅ NEW
│   ├── file.svg, globe.svg, next.svg, vercel.svg, window.svg
│   └── screenshots/                # README screenshots
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
├── sqlite.db, sqlite.db-shm, sqlite.db-wal  # Local DB files
│
└── Real_time_Assistive_System_vir2/  # ❌ NESTED REPO — should be deleted
5. DATABASE SCHEMA (Turso)
Better Auth Tables (auto-created)
user: id, name, email, emailVerified, image, fullName, university, studentId, role, createdAt, updatedAt

session: id, expiresAt, token, createdAt, updatedAt, ipAddress, userAgent, userId

account: id, accountId, providerId, userId, accessToken, refreshToken, idToken, accessTokenExpiresAt, refreshTokenExpiresAt, scope, password, createdAt, updatedAt

verification: id, identifier, value, expiresAt, createdAt, updatedAt

Custom Tables (from lib/db/index.ts migrations)
user_settings: id, userId (UNIQUE), theme, transcriptFontSize, colorCodingEnabled, soundDetectionEnabled, soundSensitivityQuiet, soundSensitivityNormal, soundSensitivityLoud, soundSensitivitySpike, createdAt, updatedAt

saved_lectures: id, userId, name, transcript, summary, mindMapJson, glossaryJson, wordCount, durationMs, createdAt, updatedAt + INDEX (userId, createdAt DESC)

saved_glossary: id, userId, term, definition, sourceLectureId, starred, createdAt + INDEX (userId, createdAt DESC)

flashcards_progress: id, userId, question, answer, difficulty, sourceLectureId, masteryLevel, reviewCount, lastReviewedAt, createdAt + INDEX (userId, createdAt DESC)

admin_settings: id, passwordHash, passwordSalt, updatedAt — scrypt hashing

⚠️ CRITICAL DB RULES:

All queries are ASYNC (use db.execute({ sql, args }))

NEVER use db.prepare()

Password hashing uses Node crypto scryptSync (16-byte salt, 64-byte key)

6. API ROUTES
Method	Route	Rate Limit	Purpose	Status
POST	/api/smart	10/min	Whisper transcription only (multipart)	[CONFIRMED]
POST	/api/transcribe	15/min	Fallback Whisper	[CONFIRMED]
POST	/api/analyze	15/min	Topic + children + terms	[CONFIRMED]
POST	/api/chat	20/min	AI assistant Q&A	[CONFIRMED]
POST	/api/summarize	10/min	Lecture summary	[CONFIRMED]
POST	/api/keywords	15/min	Extract keywords	[CONFIRMED — recently fixed]
POST	/api/flashcards	10/min	Generate flashcards	[CONFIRMED — recently fixed]
POST	/api/action-items	10/min	Exam/assignment hints	[CONFIRMED]
POST	/api/classroom-questions	10/min	Infer distant students' questions	[CONFIRMED]
POST	/api/translate	15/min	Translate English terms to Arabic	[CONFIRMED]
PATCH	/api/user/profile	—	Update user profile	[CONFIRMED]
POST	/api/admin/login	5 attempts → 5min lock	Admin login	[CONFIRMED]
GET/DELETE	/api/admin/users	30/min	Manage users	[CONFIRMED]
POST	/api/admin/change-password	5/min	Change admin password	[CONFIRMED]
POST	/api/admin/logout	30/min	Clear admin cookie	[CONFIRMED]
ALL	/api/auth/[...all]	—	Better Auth catch-all	[CONFIRMED]
7. AI PROVIDER ARCHITECTURE
File: lib/ai/provider.ts

2-Tier Fallback System
Tier 1 — Gemini (multi-key rotation) [CONFIRMED]
Reads GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3

Models tried in order: gemini-3.6-flash → gemini-flash-latest → gemini-2.0-flash

On 429: next key. On 503: next model. On 404: next model.

Tier 2 — Groq (model fallback) [CONFIRMED — but models failing]
Models tried: llama-3.1-8b-instant → llama-3.2-3b-preview → gemma2-9b-it → mixtral-8x7b-32768

⚠️ ALL GROQ MODELS ARE CURRENTLY FAILING with "unavailable" or "decommissioned" errors in logs. Gemini fallback works.

API
typescript
generateText({
  systemPrompt, messages, temperature, maxTokens, prefer: "gemini" | "groq"
}) → { ok, text?, provider?, model?, error? }

parseJsonResponse<T>(raw) // strips markdown fences, parses JSON
Default order: Groq → Gemini (Groq is faster)
Can prefer Gemini: prefer: "gemini"

8. AUTHENTICATION
Framework: Better Auth 1.7.5
Adapter: Kysely + LibsqlDialect (required for Turso)

Features [CONFIRMED]
Email/password (min 6 chars, no email verification)

Google OAuth (currently HIDDEN in UI but still configured)

Session: 7 days expiry, 24h update age, 5min cookie cache

Additional user fields: fullName, university, studentId, role (default "student")

Middleware (proxy.ts) [CONFIRMED]
API routes bypass middleware

/admin/login public (redirects if admin_mode cookie)

Other /admin/* require admin_mode cookie

/login and /signup redirect to / if session exists

Protected pages require session OR guest_mode cookie

Adds security headers to all responses

Cookies [CONFIRMED]
guest_mode=true (24h) — app without account

admin_mode=true (httpOnly, 12h) — separate from user sessions

Admin Password [CONFIRMED]
Stored in admin_settings table (scrypt hashed)

Fallback to ADMIN_PASSWORD env var

Current value: CaptionBridge@Admin2026

9. FEATURES (12 total)
Core [CONFIRMED]
Live Transcription — MediaRecorder in 15s chunks, MIN_BLOB_SIZE 5000 bytes

Smart Explanation — Topic + children + terms

Mind Map — ReactFlow with custom ParentNode + ChildNode

Academic Glossary — Color-coded term cards

AI [CONFIRMED]
Lecture Summary — Title + overview + keyPoints + conclusion

Keywords — Categories + importance stars + filter chips

Flashcards — Flip 3D animation + difficulty badges

Action Items Radar — Exam hints with toast notifications

Classroom Questions — Infer distant students' questions

Floating Chat — Draggable AI assistant (uses RobotIcon now)

Accessibility [CONFIRMED]
Sound Detection — Vertical meter with 4 levels

Highlighted Text — English blue, numbers violet, keywords amber (⚠️ has bug)

Extra [CONFIRMED]
Export PDF/TXT

Search in transcript (Ctrl+F) — ⚠️ REMOVED from SpeechInput

Save/load lectures (Turso DB)

3 themes (light, dark, focus)

Font size, color coding, sound sensitivity in Settings

Admin panel

10. DESIGN SYSTEM
Themes [CONFIRMED]
light: bg #f3f4f6, fg #1f2937, primary #8470ff

dark: bg #111827, fg #f3f4f6, primary #8470ff (DEFAULT)

focus: bg #fafafa, fg #0a0a0a, primary #0a0a0a

Primary color: Violet (#8470ff)
Accent 1: Violet, Accent 2: Sky blue (#67bfff)
Fonts: Cairo (sans) + Amiri (serif) via next/font/google
Colors: CSS variables in OKLCH with @theme inline for Tailwind v4

Custom Utilities [CONFIRMED]
.glass, .glow-primary, .glow-accent, .text-gradient, .no-scrollbar

11. ENVIRONMENT VARIABLES
.env.local (local — NOT committed) [CONFIRMED]
env
# Better Auth
BETTER_AUTH_SECRET=[REDACTED SECRET]
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Admin
ADMIN_PASSWORD=[REDACTED SECRET]

# AI Services
GEMINI_API_KEY=[REDACTED SECRET]
GEMINI_API_KEY_2=[REDACTED SECRET]
GROQ_API_KEY=[REDACTED SECRET]

# Turso
TURSO_DATABASE_URL=libsql://captionbridge-khalid8923.aws-eu-west-1.turso.io
TURSO_AUTH_TOKEN=[REDACTED SECRET]

# Google OAuth
GOOGLE_CLIENT_ID=[REDACTED SECRET]
GOOGLE_CLIENT_SECRET=[REDACTED SECRET]
Vercel Production Variables [CONFIRMED]
Same variables with:

BETTER_AUTH_URL = https://real-time-assistive-system-vir2.vercel.app

NEXT_PUBLIC_SITE_URL = same

⚠️ ALL KEYS WERE EXPOSED IN CHAT — USER WAS ADVISED TO ROTATE ALL [CONFIRMED — user changed them]

12. RECENT MODIFICATIONS (during this session)
1. Logo & Branding [CONFIRMED]
Added public/logo.png (round badge with bridge + signal icon)

Added app/icon.png (favicon replacement)

⚠️ app/favicon.ico still exists — MUST BE DELETED to use icon.png

2. Text Changes [CONFIRMED]
Location	Old	New
(auth)/layout.tsx	جسر التواصل للطلاب الصم	رفيقك الذكي في المحاضرات الجامعية
AppShell.tsx	جسر التواصل للطلاب الصم	رفيقك الذكي في المحاضرات
AppSidebar.tsx	للطلاب الصم	للطلاب الجامعيين
login/page.tsx	إيميل الجامعة	الإيميل
login/page.tsx	معندكش حساب؟	ليس لديك حساب؟
signup/page.tsx	عندك حساب بالفعل؟	لديك حساب بالفعل؟
3. Google OAuth Hidden [CONFIRMED]
components/auth/GoogleButton.tsx — rewritten as disabled button with "جاري التطوير" badge

login/page.tsx — <GoogleButton> and <AuthDivider> commented out [PLANNED: to be re-enabled after Google OAuth fix]

signup/page.tsx — same

4. RobotIcon [CONFIRMED]
New file: components/RobotIcon.tsx — SVG robot with graduation cap + pen

Used in FloatingChat.tsx (replaced <Bot> icon in 3 places)

5. Badges Removed [CONFIRMED]
Removed badge: "جديد" from actionItems and classroomQuestions in lib/features.ts

6. SpeechInput Modified [CONFIRMED]
Removed <SearchInTranscript> from header

Added clear transcript button (trash icon, red, with confirm dialog)

Requires onClearTranscript prop

7. useSpeechTranscription Modified [CONFIRMED]
Added clearTranscript() function that resets currentTranscript, refinedChunks, and error

8. Nested Repo Removed [CONFIRMED]
Real_time_Assistive_System_vir2/ folder was a nested git repo — removed from git tracking and deleted from disk

13. KNOWN BUGS & ISSUES
Bug 1: HighlightedText.tsx Mojibake [CONFIRMED — UNFIXED]
File: components/HighlightedText.tsx
Problem: KEYWORD_PATTERNS array contains corrupted Arabic text (Mojibake from Windows-1256 encoding):

js
const KEYWORD_PATTERNS = [
  /丕賲鬲丨丕賳|賵丕噩亘|鬲爻賱賷賲|.../,  // CORRUPTED
  ...
];
Impact: Arabic keyword highlighting doesn't work.
Cause: File was saved with wrong encoding at some point.
Fix: Replace with proper UTF-8 Arabic keywords:

امتحان | واجب | تكليف | مشروع | اختبار | كويز | أسايمنت

مهم | ملاحظة | انتبه | ركز | تذكر | بالمناسبة

نظرية | قانون | قاعدة | تعريف | معادلة | دالة | متغير | خوارزمية

برمجة | شبكة | قاعدة بيانات | ذكاء اصطناعي | تعلم آلة

Bug 2: Groq Models All Failing [CONFIRMED — UNFIXED]
Evidence from logs:

text
[ai] Groq model "llama-3.1-8b-instant" unavailable — trying next
[ai] Groq model "llama-3.2-3b-preview" unavailable — trying next
[ai] Groq model "gemma2-9b-it" unavailable — trying next
[ai] Groq model "mixtral-8x7b-32768" unavailable — trying next
[ai] groq failed: Groq 400 (mixtral-8x7b-32768): "decommissioned"
[ai] Gemini OK | key #1 | model "gemini-3.6-flash"
Impact: All AI requests fall back to Gemini (slower).
Fix needed: Update GROQ_MODELS in lib/ai/provider.ts with currently-available models.

Bug 3: React Flow Warning [CONFIRMED — minor]
text
[browser] [React Flow]: It looks like you've created a new nodeTypes or edgeTypes object.
File: components/MindMap.tsx
Cause: nodeTypes object created inside component.
Fix: Move nodeTypes outside the component or useMemo it.

Bug 4: Magic Link Not Implemented [CONFIRMED]
File: app/(auth)/login/magic-link/page.tsx
Status: Stub that shows a toast "قريباً".
Note: Better Auth supports Magic Link plugin, but requires email provider.

Bug 5: Google OAuth state_mismatch / invalid_client [CONFIRMED — WORKED AROUND]
Symptoms:

text
State mismatch: State not persisted correctly
error: 'invalid_client', error_description: 'The provided client secret is invalid.'
Root causes:

BETTER_AUTH_SECRET was placeholder

Editing .env.local while server running

GOOGLE_CLIENT_SECRET mismatch

Nested repo confusion (editing wrong copy)
Workaround: Disabled Google buttons in UI; kept OAuth config intact.

Bug 6: app/favicon.ico Overrides app/icon.png [CONFIRMED — UNFIXED]
Impact: Tab shows old ▲ Next.js favicon instead of new logo.
Fix: Delete app/favicon.ico.

14. REJECTED / POSTPONED IDEAS
Idea	Status	Reason
Telegram bot for "Ask Professor"	[POSTPONED]	Decided after hackathon qualification
Text-to-Infographic (Napkin.ai style)	[POSTPONED]	Not worth time for hackathon
Magic Link authentication	[REJECTED]	Needs email provider; password auth is enough
Supabase integration	[REJECTED]	DNS issues
better-sqlite3	[REJECTED]	Synchronous — conflicts with async libSQL
middleware.ts	[DEPRECATED]	Replaced by proxy.ts in Next.js 16
Full chat between student and professor in-app	[REJECTED]	App is for students only
Real-time Telegram integration	[POSTPONED]	Time constraint
15. USER PREFERENCES
Development Style [CONFIRMED]
Prefers Arabic UI (RTL-first)

Wants clear step-by-step explanations

Does NOT want to push to GitHub without explicit permission

Tests locally first before pushing

Currently in hackathon prep mode — values speed over perfection

Wants "coming soon" modals for unreleased features (to demo vision)

Prefers clean, minimal solutions

Dislikes over-engineering for the hackathon

Working with the AI [CONFIRMED]
Prefers to copy full file contents rather than snippets

Prefers Arabic explanations with English technical terms

Wants to be warned about security issues (API keys, etc.)

Asks for direct, honest feedback without flattery

16. DEPLOYMENT
Vercel [CONFIRMED]
Auto-deploy on git push to main

Framework: Next.js

Node: 20+

Hobby plan (60s serverless timeout)

Latest successful deployment: commit e420c63

GitHub [CONFIRMED]
Repo: https://github.com/khalid8923/Real_time_Assistive_System_vir2

Branch: main

Latest commit: e420c63 — "feat: new logo, rebranding, robot icon, clear transcript button"

Local [CONFIRMED]
powershell
cd D:\Real_time_Assistive_System\my-web
npm run dev
# runs on http://localhost:3000
17. CURRENT STATE SNAPSHOT
✅ COMPLETED
All 12 features

All 16 API routes

Better Auth with Google OAuth config

Turso DB with 6 tables + migrations

Admin panel (login, users, change password)

Account dashboard (4 tabs)

3 themes

New logo + RobotIcon

Rebranding ("رفيقك الذكي...")

Google buttons hidden

Clear transcript button added

flashcards and keywords route files fixed

🔄 IN PROGRESS
Nothing actively being coded — awaiting next directive

📋 PLANNED
Delete app/favicon.ico (so app/icon.png works)

Fix Groq models in lib/ai/provider.ts

Fix Mojibake in HighlightedText.tsx

Re-enable Google OAuth after fixing secret mismatch

⏸️ BLOCKED
Magic Link — needs email provider

Google OAuth — needs correct GOOGLE_CLIENT_SECRET

🚫 POSTPONED
Ask Professor (Telegram)

Text-to-Infographic

❓ UNKNOWN
Whether user is satisfied with current Vercel deployment (asked for favicon.ico deletion but not confirmed)

Exact new API keys after rotation

18. IMMEDIATE NEXT STEPS
Must Do Immediately
[PLANNED] Delete app/favicon.ico → so app/icon.png becomes favicon

[PLANNED] Push latest login/page.tsx change (Google button hidden on login)

[PLANNED] Fix Groq models list in lib/ai/provider.ts

[PLANNED] Fix Mojibake in HighlightedText.tsx

Should Do Next
Update GROQ_MODELS in lib/ai/provider.ts to currently available models

Add "Forgot Password" or re-enable Google OAuth (after fixing GOOGLE_CLIENT_SECRET)

Test deployment after favicon.ico deletion

Should Verify
Whether Vercel deployment reflects latest changes (browser cache issues reported)

Whether all users' API keys were rotated after exposure

Whether Real_time_Assistive_System_vir2/ folder is fully removed

Future Work
Fix Magic Link (needs email provider like Resend/SendGrid)

Implement Ask Professor feature (post-hackathon)

Implement Text-to-Infographic (post-hackathon)

Add unit tests

Fix technical debt

19. TECHNICAL DEBT
Item	File	Severity
Mojibake in keyword patterns	HighlightedText.tsx	High
Groq models all failing	lib/ai/provider.ts	High
favicon.ico overriding icon.png	app/favicon.ico	Low
SearchInTranscript unused	SpeechInput.tsx	Low
React Flow warning	MindMap.tsx	Low
Magic Link stub	login/magic-link/page.tsx	Medium
Google OAuth broken	lib/auth.ts	Medium
No unit tests	Entire project	High
Real_time_Assistive_System_vir2/ nested repo	Root	Medium
Duplicate auth.ts and themes.ts in project structure	lib/	Low
20. SECURITY NOTES
✅ Rate limiting on all API routes (in-memory)

✅ Security headers via proxy.ts

✅ Admin password scrypt hashed

✅ Better Auth session cookies (httpOnly, SameSite=Lax)

✅ Admin mode separate cookie (httpOnly, 12h)

✅ Input validation on all APIs

⚠️ All API keys exposed in chat session — user rotated them

⚠️ BETTER_AUTH_SECRET was placeholder for a long time — user generated new one

⚠️ Google OAuth redirect_uri_mismatch — user fixed URIs in Google Cloud Console

⚠️ Google OAuth invalid_client — Google client secret mismatch — unresolved

21. COMMANDS & WORKFLOWS
Development
bash
cd D:\Real_time_Assistive_System\my-web
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
Git Workflow
bash
git status                          # Check what changed
git check-ignore .env.local         # Verify env is ignored
git add .                           # Stage all
git commit -m "message"             # Commit
git log -1 --stat                   # View last commit
git push                            # Push to GitHub (triggers Vercel deploy)
PowerShell vs CMD Commands [IMPORTANT — user got confused]
Action	CMD	PowerShell
Delete folder	rmdir /s /q folder	Remove-Item -Recurse -Force folder
Delete file	del file.txt	Remove-Item file.txt
Copy	copy a b	Copy-Item a b
22. EXTERNAL SERVICES
Service	Purpose	Status
Vercel	Hosting	✅ Working
GitHub	Version control	✅ Working
Turso	Cloud DB	✅ Working
Google Cloud Console	OAuth	⚠️ Configured but invalid_client
Groq	Whisper + Llama	⚠️ Whisper works, Llama models failing
Google Gemini	Text AI	✅ Working (main fallback)
Google OAuth Client:

Project: CaptionBridge

Client name: CaptionBridge Web

Authorized JavaScript origins: http://localhost:3000, https://real-time-assistive-system-vir2.vercel.app

Authorized redirect URIs: (should include /api/auth/callback/google for both)

OAuth consent screen: External + Testing mode with test user

23. OPEN QUESTIONS
[UNKNOWN] Are Google OAuth credentials still in .env.local and Vercel?

[UNKNOWN] Did user rotate all exposed API keys?

[UNKNOWN] Is Real_time_Assistive_System_vir2/ folder fully deleted from disk?

[UNKNOWN] Latest Vercel deployment status after the login/page.tsx change

[UNKNOWN] What caused the Groq model decommissioning — is GROQ_API_KEY still valid?

[REQUIRES VERIFICATION] Whether app/icon.png shows correctly after favicon.ico deletion

INSTRUCTIONS FOR THE NEXT AI
You are inheriting a partially complete Next.js 16 project called CaptionBridge — a real-time AI-powered lecture assistant for university students.

Before You Do Anything:
Read this entire document first — do not skip sections.

Read the actual project files before making any architectural decisions.

Preserve existing decisions unless you have a strong, explicit reason to change them.

Status Handling Rules:
[CONFIRMED] — treat as established, immutable context.

[PLANNED] — intended work, ready to implement when asked.

[PROPOSED] — optional; ask user before implementing.

[REJECTED] — do NOT re-suggest unless user explicitly revisits.

[POSTPONED] — do NOT implement yet; wait for user's green light.

[UNKNOWN] / [REQUIRES VERIFICATION] — verify with actual files first.

[DEPRECATED] — do NOT resurrect; use the replacement.

Hard Constraints:
❌ Do NOT switch to better-sqlite3 (we use async @libsql/client)

❌ Do NOT use Supabase (had DNS issues)

❌ Do NOT use middleware.ts (Next.js 16 uses proxy.ts)

❌ Do NOT remove rate limiting

❌ Do NOT use db.prepare() — use db.execute({ sql, args })

❌ Do NOT push to GitHub without explicit user permission

❌ Do NOT re-enable Google OAuth until the invalid_client error is fixed

❌ Do NOT implement Magic Link, Telegram integration, or Text-to-Infographic until user gives the green light

Must Maintain:
✅ TypeScript strict mode compatibility

✅ Async DB operations

✅ Arabic RTL UI

✅ Rate limiting on new endpoints

✅ Violet (#8470ff) + Sky blue (#67bfff) design system

✅ Better Auth as the auth solution

✅ Turso as the database

Communication Style:
Speak in Arabic (user's primary language) with English technical terms

Be direct and honest — the user explicitly asked for no flattery, no sugarcoating

Warn about security issues immediately

Provide full file contents when making changes (not snippets)

Walk through steps one at a time for the user to execute

Use Ctrl + S, Ctrl + Shift + R, F12 shortcuts the user understands

Immediate Priority:
The user was last working on:

Pushing a change to login/page.tsx (Google button hidden)

Deleting app/favicon.ico to fix the tab icon

Continue from THIS state. Do not restart the project.

FINAL PROJECT STATE SNAPSHOT
Project
CaptionBridge — كابتشن بريدج

Purpose
Real-time AI-powered lecture assistant for university students (originally for deaf students, now rebranded for all students). Transcribes speech, generates summaries, mind maps, glossaries, flashcards, action items, and classroom Q&A.

Current Stage
Hackathon/Graduation project — pre-submission phase. Features complete, minor fixes pending.

Stack
Next.js 16.3.5 (App Router + Turbopack) + TypeScript 5 + React 19 + Tailwind v4 + shadcn/ui + Motion + ReactFlow + Better Auth 1.7.5 + Turso (libSQL) + Groq Whisper + Google Gemini + Groq Llama fallback + Vercel

Architecture
RSC-first with client components for interactivity. Server Actions for mutations. API routes for AI calls. proxy.ts as middleware.

Database
Turso (libSQL, cloud). 4 Better Auth tables + 6 custom tables. All queries async via @libsql/client.

Backend
Next.js API routes (16 endpoints). All rate-limited. AI calls via lib/ai/provider.ts.

Frontend
Arabic RTL UI. 3 themes (light/dark/focus). shadcn/ui components. ReactFlow for MindMap. Motion for animations.

AI
Gemini (multi-key) primary. Groq fallback (currently failing). Groq Whisper for transcription.

Games
None — this is not a game project. (Previous template sections about games do not apply.)

Adaptive System
None — not applicable.

Authentication
Better Auth with email/password + Google OAuth (Google currently HIDDEN in UI). Admin mode via separate cookie.

Admin
Separate /admin/* routes with admin_mode cookie. Password-only login. Users management + password change.

Analytics
Basic user stats (lectures count, words, glossary, flashcards mastery).

Completed
All 12 features

All 16 API routes

Logo, rebranding, RobotIcon

Google button hidden

Clear transcript button

flashcards/keywords routes fixed

In Progress
Nothing active — awaiting user's next directive.

Planned
Delete app/favicon.ico

Fix Groq models list

Fix Mojibake in HighlightedText.tsx

Re-enable Google OAuth (after fix)

Blocked
Magic Link (needs email provider)

Google OAuth (needs correct secret)

Known Bugs
Mojibake in HighlightedText.tsx keyword patterns

All Groq models failing

React Flow nodeTypes warning

favicon.ico overriding icon.png

Magic Link is stub

Technical Debt
No unit tests

Unused SearchInTranscript.tsx

Nested repo confusion

Duplicate auth.ts/themes.ts files

Immediate Next Steps
Delete app/favicon.ico → push

Fix Groq models in lib/ai/provider.ts

Fix Mojibake in HighlightedText.tsx

END OF HANDOFF DOCUMENT