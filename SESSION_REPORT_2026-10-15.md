CaptionBridge — Session Report
**Date:** 2026-10-15
**Session:** F9/F8 fixes + Rate limit scope fix + Load test v2

---

## Summary

| # | Action | Before | After | Status |
|---|--------|--------|-------|--------|
| 1 | F9 Argument Map | 502 Bad Gateway | 200 + 1 argument | ✅ |
| 2 | F8 Causal Loop | 0 loops (always) | 1 loop | ✅ |
| 3 | Rate limit scope | Shared counter (1 per IP) | Per-route scope | ✅ |
| 4 | Backup folders | 19 folders inside project | Moved outside | ✅ |
| 5 | TypeScript | 6 errors | 0 errors | ✅ |
| 6 | Load test method | PowerShell (misleading) | curl.exe (accurate) | ✅ |

---

## 1. F9 Argument Map — 502 → 200

### Root cause
The `SYSTEM_PROMPT` in `app/api/visualize-argument/route.ts` showed a **single argument object** as the example output, but the validator expected a wrapped array:

```typescript
// Validator expected:
{ "arguments": [ { ... } ] }

// LLM was returning (following the example literally):
{ "title": "...", "thesis": "...", "nodes": [...], "links": [...] }
Result: isValid() returned false → 502.

Fix
Rewrote the example in SYSTEM_PROMPT to be wrapped in { "arguments": [...] }

Added explicit rule: "MINIMUM 3 nodes, MAXIMUM 12 nodes per argument"

Added normalizeArguments() helper that handles both shapes (wrapped + unwrapped)

Added ?? [] fallback after the normalizer call

Verification
text
POST /api/visualize-argument
HTTP: 200 | Time: 6.08s | Count: 1
2. F8 Causal Loop — Passive Failure → Working
Root cause
Same bug pattern: the SYSTEM_PROMPT example in app/api/visualize-causal/route.ts contained "loops": [] inside a single-object shape. The LLM learned that the correct output was { loops: [] } — so it always returned empty loops, even when cycles existed in the text.

Fix
Rewrote the example to { "loops": [ { ... } ] }

Added normalizeLoops() defensive helper

Relaxed the filter: nodes >= 2 && edges >= 1 (was >= 3 && >= 2)

Added ?? [] fallback

Verification
text
POST /api/visualize-causal
HTTP: 200 | Time: 9.50s | Count: 1
3. Rate Limit Scope Bug
Root cause
lib/rate-limit.ts used a single cache key per IP:

typescript
const cache = new Map<string, { count: number; resetAt: number }>();
// key = client IP only
Meaning all 21 API routes shared one counter. A single 10/min limit was effectively a 10/min global limit for the entire app.

Fix
Added scope parameter (default: "global")

Full key = ${scope}:${key}

Each route now passes its own scope (e.g., "visualize-this", "analyze", "chat")

Routes updated (21 total)
text
action-items, admin/change-password, admin/users,
analyze, chat, classroom-questions, flashcards,
keywords, smart, summarize, transcribe, translate,
visualize-analogy, visualize-argument, visualize-causal,
visualize-comparison, visualize-equations, visualize-flow,
visualize-infographic, visualize-system, visualize-this
Verification
text
Fire 6 requests to /api/visualize-this        -> 6/6 OK
Fire 6 requests to /api/visualize-comparison  -> 6/6 OK

PASS - Rate limit scope is working
Before the fix, the second batch would have hit 429 after only 4 requests (shared counter reaching 10).

4. Backups Cleanup
19 backup folders moved from inside the project to:
D:\Real_time_Assistive_System\_backups_from_chat\

Reason: tsc --noEmit was scanning them and reporting duplicate errors.

5. Load Test v2 (concurrent curl.exe)
Method: Start-Process curl.exe with all requests fired simultaneously.

Test 1 — /api/health (no rate limit)
Level	Success	Avg	Max	RPS	SR
5	5/5	0.372s	0.456s	8.62	100%
15	15/15	0.362s	0.578s	20.19	100%
30	30/30	0.541s	0.794s	26.81	100%
50	50/50	0.709s	1.046s	30.43	100%
Conclusion: Server handles 50 concurrent easily. Bottleneck is external providers, not the app.

Test 2 — /api/visualize-this (before scope fix)
Level	Success	429	Notes
3	3/3	0	OK
8	7/8	—	Shared counter caused 1 failure
Note: The invalid 429: column was a PowerShell format string bug, not a server issue.

6. Files Changed
File	Change
lib/ai/provider.ts	Added ensureArray<T>() helper
lib/rate-limit.ts	Added scope parameter
app/api/visualize-argument/route.ts	Full rewrite
app/api/visualize-causal/route.ts	Full rewrite
app/api/*/route.ts (21 files)	Added unique scope to rateLimit call
7. Known Issues Remaining
⚠️ Groq 429 on sustained load

⚠️ HF_TOKEN blocked by Egyptian ISP

⚠️ Google OAuth (invalid_client — hidden in UI)

⚠️ No unit tests

⚠️ No retry logic for 429 in some endpoints

⚠️ Large component files (>400 lines)

8. Next Steps (Suggested)
Update TEST_REPORT.md with corrected numbers

Update HANDOFF.md with the new state

Git commit (no push yet)

Implement Feature #10 (Time-lapse MindMap) or Practice Quiz

Consider adding Cerebras as LLM fallback ($0 tier)

9. Backup Locations
Backup	Path
F9/F8 pre-fix	D:\Real_time_Assistive_System\_backups_from_chat\_backup_f9_f8_*
Rate-limit pre-fix	D:\Real_time_Assistive_System\_backups_from_chat\_backup_ratelimit_*
Old backups	D:\Real_time_Assistive_System\_backups_from_chat\_backup_*