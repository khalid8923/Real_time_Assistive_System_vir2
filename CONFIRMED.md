📄 CAPTIONBRIDGE — MASTER PROJECT HANDOFF
Document Version: 1.0
Generated: From full conversation history
Purpose: Complete project-memory export for handoff to another AI model

1. PROJECT IDENTITY
[CONFIRMED / IMPLEMENTED]
Project Name: CaptionBridge

Arabic Name: CaptionBridge | جسر التواصل للطلاب الصم

Purpose: Real-time assistive web application for deaf and hard-of-hearing university students in Egypt. It captures a professor's live Arabic speech, converts it to text, then uses AI to generate:

Live captions (transcript)
Interactive mind map of the topic
Glossary of academic terms with student-friendly definitions
Quick-action buttons ("I want to ask ✋" / "Re-explain 🔄") that notify the professor
Core Problem: Deaf students in Egyptian universities cannot follow live lectures because:

Sign language interpreters are scarce

Auto-captioning tools don't support Egyptian Arabic well

Google's Web Speech API is blocked/disabled on Egyptian ISPs

Target Users: Deaf/hard-of-hearing Arabic-speaking university students in Egypt

Target Platform: Web (Chrome desktop, localhost:3000 during development)

Current Stage: MVP — UI complete, mic pipeline in-progress (last error: invalid Groq API key in .env.local)

[PLANNED]
Teacher view (dashboard for professor to receive questions)

Additional accessibility features: sound alerts (doorbell, phone ringing), keyword detection

[PROPOSED — NOT CONFIRMED]
Deepgram / AssemblyAI as alternative STT providers

Groq Llama 3.3 70B for analysis (replacing Gemini)

2. DEVELOPMENT HISTORY — CHRONOLOGICAL
Phase 1: Initial Design
[CONFIRMED] User built a complete UI: multi-theme system (classic/focus/immersive), RTL Arabic layout, sidebar, top bar, mind map component using React Flow, glossary panel, notification toast system.

[CONFIRMED] Fonts: Cairo (sans) + Amiri (serif), loaded via next/font/google

Phase 2: Mic Pipeline — Attempt 1 (Web Speech API)
[REJECTED] Used webkitSpeechRecognition

Error: "تعذر الاتصال بخدمة التعرف على الصوت" (Could not connect to speech recognition service)

Cause: Google blocks/disables the service on many Egyptian ISP IP ranges

Conclusion: Unreliable for target audience

Phase 3: Mic Pipeline — Attempt 2 (Groq Whisper)
[REJECTED] Tried direct Groq API calls

Error: User's API key was malformed: gsk_gsk_... (double prefix)

Conclusion: Abandoned before testing — was a key format issue, not a Groq issue

Phase 4: Mic Pipeline — Attempt 3 (Transformers.js in browser)
[REJECTED] Used @huggingface/transformers with onnx-community/whisper-tiny

Error: EncodingError: Unable to decode audio data (repeatedly)

Cause:

whisper-tiny too small for Arabic

Browser AudioContext couldn't decode webm/opus reliably

WASM/CORS/cache complexity

Conclusion: Browser-based inference is unreliable for this project

Phase 5: LLM — Claude → Gemini
[DEPRECATED] Originally used @anthropic-ai/sdk with claude-sonnet-4-5

[CONFIRMED] Migrated to Gemini gemini-2.5-flash due to free tier

Error: 404 - models/gemini-2.5-flash is no longer available to new users

[CONFIRMED] Migrated to gemini-3.6-flash

Error: 429 Rate Limit on audio transcription requests

Phase 6: Groq (current attempt)
[CONFIRMED] User generated working Groq API key: gsk_5siw... (tested successfully against GET /v1/models)

[IN PROGRESS] Migrating app/api/transcribe/route.ts to use Groq Whisper Large v3 Turbo

Current Error: .env.local still contains GROQ_API_KEY=gsk_gsk_... → 401 Invalid API Key

3. CURRENT PROJECT STATE
Completed [CONFIRMED / IMPLEMENTED]
Next.js 16.3.5 App Router project scaffold

Full UI/UX with 3 themes and RTL Arabic

SpeechInput component with mic button, live transcript textarea, error display, chunk counter

MindMap component with radial layout (React Flow)

GlossaryPanel with term cards + quick actions

AppShell, AppSidebar, AppTopBar

ThemeProvider + ThemeSwitcher with localStorage persistence

/api/analyze route using Gemini (working after model name fix)

/api/transcribe route — currently broken (401 from Groq)

useSpeechTranscription hook using MediaRecorder (chunks every 15s)

In Progress
Fixing Groq API key in .env.local

Verifying end-to-end pipeline: mic → transcribe → analyze → UI

Planned [PLANNED]
Teacher view notifications to work end-to-end

Sound alerts feature

Keyword detection feature (exam/homework warnings)

Blocked
End-to-end test blocked by Groq API key error

Unknown [REQUIRES VERIFICATION]
Whether Groq Whisper works reliably from Egyptian ISP (curl test confirmed GET /models works, but audio transcription not yet verified from within app)

Gemini free tier quota behavior on gemini-3.6-flash for audio

4. PROJECT ARCHITECTURE
Data Flow
text
┌─────────────────────────────────────────────────────────────┐
│  Browser (Chrome)                                            │
│                                                              │
│  ┌──────────────┐   getUserMedia()   ┌─────────────────┐    │
│  │  Mic Button  │ ─────────────────→ │ MediaRecorder   │    │
│  │  (SpeechInput)│                    │ 15s chunks      │    │
│  └──────┬───────┘                     └────────┬────────┘    │
│         │                                       │             │
│         │                          FormData (webm/opus blob) │
│         │                                       │             │
│         ↓                                       ↓             │
│  ┌─────────────────────────────────────────────────┐          │
│  │  useSpeechTranscription Hook                     │          │
│  └────────────────────┬────────────────────────────┘          │
└────────────────────────┼──────────────────────────────────────┘
                         │ fetch POST /api/transcribe
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  Next.js API Route (Node runtime)                            │
│                                                              │
│  app/api/transcribe/route.ts                                 │
│     ↓ FormData → Groq Whisper Large v3 Turbo                 │
│     ↓ Returns { text: "..." }                                │
│                                                              │
│  app/api/analyze/route.ts                                    │
│     ↓ JSON { chunk } → Gemini 3.6-flash                      │
│     ↓ Returns { topic, children[], terms[] }                 │
└──────────────────────────────────────────────────────────────┘
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  External Services                                            │
│                                                              │
│  Groq API (whisper-large-v3-turbo)  → Arabic STT             │
│  Google Gemini API (gemini-3.6-flash) → Analysis             │
└──────────────────────────────────────────────────────────────┘
AI Decision Flow
User speaks → 15s chunk recorded

Chunk → /api/transcribe → Groq Whisper → Arabic text

Text appended to finalChunks[] state

SpeechInput useEffect detects new chunk → /api/analyze → Gemini → JSON

JSON mapped to AnalysisData → onAnalyze() → page.tsx state

MindMap and GlossaryPanel re-render with new data

5. FILE / FOLDER STRUCTURE
text
my-web/
├── app/
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.ts          ← Gemini text analysis endpoint
│   │   └── transcribe/
│   │       └── route.ts          ← Groq Whisper STT (currently broken: 401)
│   ├── layout.tsx                ← Root layout, RTL, Cairo+Amiri fonts
│   ├── page.tsx                  ← Main page, orchestrates features
│   └── globals.css               ← Tailwind v4 + 3 theme definitions
├── components/
│   ├── AppShell.tsx              ← Top bar + sidebar + main canvas
│   ├── AppSidebar.tsx            ← Feature navigation (desktop)
│   ├── GlossaryPanel.tsx         ← Terms grid + quick actions
│   ├── MainLayout.tsx            ← [LEGACY?] Alternate layout
│   ├── MindMap.tsx               ← React Flow radial mind map
│   ├── Navbar.tsx                ← [LEGACY?] Alternate navbar
│   ├── SpeechInput.tsx           ← Mic button + transcript + analysis trigger
│   ├── ThemeProvider.tsx         ← Context provider for themes
│   ├── ThemeSwitcher.tsx         ← Dropdown to switch themes
│   └── ui/
│       ├── badge.tsx             ← shadcn-style badge
│       ├── button.tsx            ← shadcn-style button
│       ├── card.tsx              ← shadcn-style card
│       └── switch.tsx            ← Toggle switch (has typo bug)
├── hooks/
│   └── useSpeechTranscription.ts ← MediaRecorder + chunk upload loop
├── lib/
│   ├── features.ts               ← Feature definitions (id, label, icon)
│   ├── themes.ts                 ← Theme IDs, storage key
│   └── utils.ts                  ← cn() classname merger
├── public/
│   ├── file.svg, globe.svg, next.svg, vercel.svg, window.svg
├── .env.local                    ← API keys [CONTAINS: GEMINI_API_KEY, GROQ_API_KEY]
├── .vscode/launch.json           ← [UNNECESSARY] User-created by mistake
├── AGENTS.md                     ← Next.js auto-generated rules
├── CLAUDE.md                     ← References AGENTS.md
├── components.json               ← shadcn/ui config
├── eslint.config.mjs
├── next.config.ts
├── next-env.d.ts
├── package.json / package-lock.json
├── postcss.config.mjs
├── README.md
├── settings.json                 ← VSCode settings
└── tsconfig.json
6. TECHNOLOGY STACK
Category	Technology	Version	Status
Runtime	Node.js	24.20.0	[CONFIRMED]
Framework	Next.js	16.3.5 (Turbopack)	[CONFIRMED]
UI Lib	React	19.2.8	[CONFIRMED]
Language	TypeScript	5.x	[CONFIRMED]
Styling	Tailwind CSS	v4	[CONFIRMED]
Icons	lucide-react	^1.46.0	[CONFIRMED]
Animation	motion (framer-motion)	^11.18.2	[CONFIRMED]
Mind Map	reactflow	^11.11.4	[CONFIRMED]
UI primitives	Base UI / hand-rolled	—	[CONFIRMED]
LLM	Google Gemini	gemini-3.6-flash	[CONFIRMED]
STT	Groq Whisper	whisper-large-v3-turbo	[IN PROGRESS]
Testing	[UNKNOWN — NOT AVAILABLE]	—	—
Database	[NONE — not used in current MVP]	—	—
Auth	[NONE — not implemented]	—	—
Unused dependencies (still in package.json)
@anthropic-ai/sdk — [DEPRECATED] migrated away from Claude

@huggingface/transformers — [DEPRECATED] browser Whisper failed

7. ENVIRONMENT VARIABLES
.env.local (root of my-web/):

env
# [CONFIRMED] Gemini for text analysis
GEMINI_API_KEY=[REDACTED SECRET]

# [IN PROGRESS] Groq for audio transcription
GROQ_API_KEY=[REDACTED SECRET]
WARNINGS:

User MUST restart npm run dev after editing .env.local (Next.js caches env vars)

User MUST ensure no Arabic characters get pasted into keys (caused a ByteString error)

User MUST ensure no double prefix like gsk_gsk_

8. API ENDPOINTS
POST /api/transcribe
Purpose: Convert Arabic audio chunk to text via Groq Whisper.

Request: multipart/form-data

audio: Blob (webm/opus, ~240 KB per 15s chunk)

Response (success):

json
{ "text": "النص العربي هنا" }
Response (error):

json
{ "error": "message" }
Status codes:

200 success

400 bad form data

413 file too large (>20 MB)

429 rate limit

500 server misconfiguration (missing/invalid key)

502 upstream failure

Implementation: app/api/transcribe/route.ts
Provider: https://api.groq.com/openai/v1/audio/transcriptions
Model: whisper-large-v3-turbo
Auth: Authorization: Bearer ${GROQ_API_KEY}

POST /api/analyze
Purpose: Extract topic, sub-topics, key terms from Arabic text.

Request: application/json

json
{ "chunk": "النص العربي" }
Response:

json
{
  "topic": "المعادلات التفاضلية",
  "children": ["الدرجة الأولى", "طرق الحل"],
  "terms": [
    { "term": "معادلة تفاضلية", "definition": "معادلة تحتوي على مشتقات" }
  ]
}
Implementation: app/api/analyze/route.ts
Provider: https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent
Auth: ?key=${GEMINI_API_KEY}

9. AI SYSTEM
STT — Groq Whisper Large v3 Turbo
Provider: Groq

Free tier: ~7200 seconds/day (~2 hours)

Speed: Fastest in world (LPU chips)

Prompt:

text
The speaker is a university professor explaining an academic topic in Arabic 
(Egyptian or Modern Standard Arabic). Preserve technical terms in their 
original language if spoken in English (e.g., 'Linear Algebra').
Parameters: model, language=ar, response_format=json, temperature=0

Analysis — Gemini 3.6 Flash
Provider: Google

Free tier: ~15 requests/minute (or stricter for audio)

Structured output: Uses responseSchema + responseMimeType: application/json

System prompt enforces strict JSON with topic, children[], terms[]

Handles: Empty/vague chunks → returns empty topic

Rate Limit Handling
/api/analyze: returns 429 with Arabic message

/api/transcribe: currently no retry logic

10. ERROR HISTORY & DEBUGGING KNOWLEDGE
Error #1: Web Speech API "Could not connect to speech recognition service"
Cause: Google blocks service on Egyptian ISPs

Fix: None — abandoned approach

Do NOT retry: This is a geographic restriction, not a code issue

Error #2: gsk_gsk_ double prefix in Groq key
Cause: User pasted key twice

Fix: Use single gsk_ prefix

Warning: Groq keys are 56 chars starting with gsk_

Error #3: EncodingError: Unable to decode audio data (Transformers.js)
Cause: Browser AudioContext couldn't handle webm/opus reliably

Fix: Abandoned browser-based inference entirely

Do NOT retry: Server-side STT is the only reliable approach

Error #4: Gemini 404 — models/gemini-2.5-flash is no longer available to new users
Fix: Changed to gemini-3.6-flash

Warning: Google deprecates model names aggressively

Error #5: Gemini 429 Rate Limit
Cause: Free tier audio quota is tight; 15s chunks → 4 req/min

Fix: Switched to Groq (better free tier)

Error #6: Groq 401 Invalid API Key
Cause: .env.local contained gsk_gsk_...

Fix: [IN PROGRESS] Replace with single-prefix key + restart server

Error #7: Cannot convert argument to a ByteString because the character at index 11 has a value of 1575
Cause: Arabic character (1575 = ا) got into the API key in .env.local

Fix: Copy key via copy button only; never retype

Error #8: [whisper] Transcription error in server logs
Cause: This came from an OLD version of the hook that used Transformers.js

Fix: Hook has been replaced with MediaRecorder + Groq

Warning: If this error still appears, user is running stale browser tab — needs hard refresh

Error #9: switch.tsx Tailwind typo
Bug: data-[size=sm]:h-3.5data-[size=sm]:h-[14px] — missing space

Fix: Change to data-[size=sm]:h-3.5 data-[size=sm]:w-6

11. USER PREFERENCES & DEVELOPMENT STYLE
Language: Arabic (Egyptian dialect for explanations, technical terms in English)

Tone: Direct, no fluff, blunt honesty

Format: File-by-file edits, code blocks ready to copy-paste

Prefers: Complete file replacements over scattered snippets

Dislikes:

Vague suggestions

Repeating failed approaches

Long summaries

Wasting time

Constraints repeatedly emphasized:

Must work in Egypt without VPN

Must be free or near-free (student budget)

Must work on Chrome

No NEXT_PUBLIC_ secrets

One-shot definitive solutions preferred over experiments

12. IMMEDIATE NEXT STEPS
Must do immediately
User must ensure .env.local contains:

text
GROQ_API_KEY=gsk_[single prefix, no Arabic, no spaces]
Restart dev server (Ctrl+C → npm run dev)

Hard refresh Chrome (Ctrl+Shift+R)

Test mic with 30+ seconds of Arabic speech

Verify in Terminal:

text
[transcribe] ✓ XXXms | text=N chars
POST /api/transcribe 200
Should do next
Fix switch.tsx typo

Delete .vscode/launch.json

Remove unused deps from package.json (@anthropic-ai/sdk, @huggingface/transformers)

Fix MindMap to accumulate topics instead of replacing

Should verify
Groq Whisper Arabic accuracy with real lecture audio

Whether Gemini free tier can handle load from /api/analyze

Whether the 15s chunk duration feels responsive enough

Future work
Teacher view notification system

Sound alerts (doorbell, phone, bell detection)

Keyword detection (exam/homework warnings)

Export lecture summary as PDF

Session history

13. REJECTED IDEAS
Idea	Why Rejected
Web Speech API	Google blocks Egyptian ISPs
Transformers.js in browser	Decoding errors, model too small
n8n workflow for STT	Just a proxy, adds complexity, no actual STT
Anthropic Claude API	No free tier; user can't pay
Gemini 2.5-flash	Model deprecated for new users
Gemini for audio	Rate limit too strict
14. TECHNICAL DEBT
switch.tsx has typo (h-3.5data-)

.vscode/launch.json is unnecessary

@anthropic-ai/sdk and @huggingface/transformers are unused

MainLayout.tsx and Navbar.tsx appear to be legacy alternates (unverified)

MindMap replaces topics instead of accumulating

No tests exist

No retry logic in /api/transcribe for 429

isModelLoading in hook is hardcoded to false (leftover from Transformers.js era)

15. OPEN QUESTIONS
[UNKNOWN] Does Groq Whisper work for real Arabic lecture audio at scale?

[UNKNOWN] What's the exact free tier quota for gemini-3.6-flash audio?

[UNKNOWN] Should MainLayout.tsx and Navbar.tsx be deleted?

[UNKNOWN] Is there a plan for user authentication?

[UNKNOWN] Is there a database plan, or is this stateless?

16. INSTRUCTIONS FOR THE NEXT AI
READ THIS ENTIRE DOCUMENT before making architectural decisions.

Current blocker: Groq API key in .env.local. This is a 30-second fix, not a code problem.

Do NOT retry: Web Speech API, Transformers.js, browser Whisper, Claude API, or Gemini 2.5-flash.

CONFIRMED stack: Next.js 16 App Router, Tailwind v4, React 19, Gemini 3.6-flash (analysis), Groq Whisper Large v3 Turbo (STT).

User is exhausted. They've spent ~6 hours on this. Be direct, no filler, no generic advice.

Arabic responses with code in English identifiers.

One file at a time — user prefers full file replacements.

Never invent file names or APIs — check the actual repo.

Preserve the RTL Arabic UI — it's a core product feature.

Verify the 401 fix works before suggesting further changes.

17. FINAL PROJECT STATE SNAPSHOT
Project
CaptionBridge — جسر التواصل للطلاب الصم

Purpose
Real-time Arabic speech-to-text + AI mind map for deaf university students in Egypt

Current Stage
MVP — UI complete, mic pipeline 95% complete (blocked on Groq API key format)

Stack
Next.js 16.3.5 (Turbopack) · React 19.2.8 · TypeScript 5 · Tailwind v4 · motion · reactflow · lucide-react

Architecture
App Router → API Routes (Node runtime) → External AI services (Groq + Gemini)

Database
None

Backend
/api/transcribe → Groq Whisper Large v3 Turbo

/api/analyze → Gemini 3.6-flash (structured JSON)

Frontend
RTL Arabic · 3 themes (classic/focus/immersive) · Cairo+Amiri fonts · SpeechInput · MindMap · GlossaryPanel · ThemeSwitcher

AI
Groq (STT) + Gemini (analysis)

Games
N/A

Adaptive System
N/A

Authentication
None

Admin
None

Analytics
None

Completed
UI, themes, layout, mind map, glossary, hooks, both API routes (code-ready)

In Progress
Groq API key fix in .env.local

Planned
Teacher view, sound alerts, keyword detection, session history

Blocked
End-to-end test (waiting on Groq 401 fix)

Known Bugs
switch.tsx typo · MindMap overwrites topics instead of accumulating

Technical Debt
Unused deps · .vscode/launch.json · legacy MainLayout.tsx/Navbar.tsx

Immediate Next Steps
Fix GROQ_API_KEY in .env.local (single gsk_, no Arabic, no spaces)

Restart npm run dev

Hard refresh browser

Test mic

Verify 200 response in Terminal