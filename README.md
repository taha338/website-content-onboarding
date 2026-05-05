# Website Content — Operation 1776

Vercel app that collects rich biographical, narrative, issue, and media
content for a candidate or party / movement website. Form 3 of three in
the Operation 1776 onboarding pipeline.

Reads pre-fill from Form 1 (Campaign Intake) and Form 2 (Brand Discovery)
matching tasks via Client ID.

## Stack
- Vite 8 + React 19
- Tailwind 4
- Framer Motion
- Supabase JS
- ClickUp REST API (server-side proxy)

## Local dev
```
npm install
npm run dev
# open http://localhost:5175/?client_id=CI-0184
```

## Required Vercel env vars

| Var | Purpose |
|---|---|
| `CLICKUP_API_TOKEN` | ClickUp personal API token (server-side only) |
| `CLICKUP_ACTIVE_CLIENTS_LIST_ID` | Master Active Clients list ID |
| `CLICKUP_WEBSITE_CONTENT_LIST_ID` | Website Content Form list ID (default 901113630895) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Used by `/api/submit` to write to the secrets table |
| `SHEETS_WEBHOOK_URL` | Apps Script web endpoint |

## Status

v0 scaffold — brand shell + prefill loading state. Sections 1–25 land
incrementally in following commits.
