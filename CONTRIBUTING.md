# Contributing

Thanks for considering a contribution. This is a student project, but it's
maintained with care — pull requests are welcome.

## Before you start

- Open an issue first if you're planning anything larger than a bug fix.
  Not bureaucracy — just so we don't both write the same code twice.
- Keep pull requests focused. One concern per PR.

## Development setup

```bash
git clone https://github.com/khalid8923/Real_time_Assistive_System_vir2.git
cd Real_time_Assistive_System_vir2
npm install
cp .env.example .env.local
# fill in your keys
npm run dev
```

## Coding guidelines

- **TypeScript everywhere.** No `any`. If you need it, comment why.
- **Server Components by default.** Add `"use client"` only when needed.
- **Async database calls.** Use `db.execute({ sql, args })`. Never `prepare()`.
- **Rate limit every API route.** Pass a unique scope string.
- **Error messages are user-facing.** Write them in Arabic, in plain language.
- **No new dependencies** without a good reason. Check if the standard library
  or an existing dependency covers it.

## Commits

Small, focused commits with a clear message. The body explains *why*, not *what*.

```
feat: add time-lapse playback to mind map

Rewinds the tree to a specific moment during the lecture.
Useful for reviewing which topics came up in which order.
```

## Pull requests

- Test locally first. `npx tsc --noEmit` should return zero errors.
- If your change touches a UI component, include a screenshot.
- If your change touches an API route, include a sample request and response.

## What I'm not looking for

- Rewrites of working code for style preference.
- Adding analytics, ads, or tracking.
- Features that require paid APIs.

---

Questions? Open an issue. I read everything.
