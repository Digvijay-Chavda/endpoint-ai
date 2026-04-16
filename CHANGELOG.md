# Changelog

All notable changes to RESTless are documented here.

---

## [Quantum Sprint Update] — 2026-03-30


This release adds new features and polish built on top of the original Global Engineering Hackathon submission.

### ✨ New Features

#### AI "Improve Response" Mode (`AIGenerateModal.tsx`)

- Added a second AI interaction mode alongside "Generate from scratch"
- Users can now paste their current JSON response body and write a follow-up prompt (e.g. "make this more realistic" or "add 5 more fields")
- Gemini 2.5 Flash rewrites the JSON in context of the existing schema
- Both modes share the same response-caching pipeline

#### Postman Collection Export (`src/app/api/projects/[projectId]/export/route.ts`)

- New `GET /api/projects/[projectId]/export` endpoint returns a Postman v2.1 JSON collection
- Collection includes all endpoints with correct method, URL (pointing to the live mock base URL), and example response body
- Triggers a file download (`Content-Disposition: attachment`) from the UI
- Export button added to `EndpointList.tsx` project toolbar

#### Social-Good Hero Landing Page (`src/app/(dashboard)/page.tsx`)

- Rich `/` route with animated hero section, impact domain cards, and feature highlights
- Live call-to-action linking to the demo projects
- Designed to show judges the platform's social-good angle at-a-glance

### 🛠️ Improvements

#### AI Response Caching (`src/app/api/ai-generate/route.ts`)

- Wrapped Gemini SDK calls in Next.js `unstable_cache` with a 1-hour TTL
- Cache key is derived from the prompt string — identical requests return instantly from cache
- Eliminates redundant API calls during demos and repeated usage

#### Faker.js Safety Hardening (`src/lib/faker-engine.ts`)

- Template token parsing now validates against an allowlist of permitted `faker.*.*` namespaces
- Prevents potential arbitrary code execution from malicious `{{faker.*}}` inputs
- Unsupported tokens are replaced with `null` instead of throwing

#### SSE Keep-Alive Pings (`src/app/api/inspector/[projectId]/route.ts`)

- Inspector SSE stream now emits a `: ping` comment every 15 seconds
- Prevents Vercel edge functions and reverse proxies from closing idle connections
- Fixes inspector dropping off after ~30 seconds of no traffic on the live deployment

#### Expanded Demo Seed Data (`prisma/seed.ts`)

- All four social-good demo projects now have richer response payloads (10+ fields per resource)
- Added `latencyMs`, `errorRate`, and Faker.js template usage to showcase all simulation features

### 📚 Documentation

- Added `CHANGELOG.md` (this file) to track submission history
- Expanded `docs/API.md` with full mock engine pipeline documentation and simulation parameter examples
- README updated with dual hackathon badges, "What's New" section, and updated roadmap

---

## [Global Engineering Hackathon] — 2026-03-12

**Submitted to:** [Global Engineering Hackathon](https://global-engineering-hackathon.devpost.com/)  
**Original Devpost:** https://devpost.com/software/restless-z7mipc

### Initial Features (baseline)

- **Project management** — Create, read, update, delete projects with a scoped base URL per project
- **Endpoint CRUD** — Define endpoints by HTTP method + path with a JSON response body editor
- **AI payload generation** — Plain-English prompts → Gemini 2.5 Flash → realistic JSON response
- **Faker.js template engine** — `{{faker.person.fullName()}}` etc. interpolated server-side on every request
- **Network chaos simulation** — Per-endpoint latency (ms), error rate (%), auth enforcement, CORS toggle
- **Real-time SSE request inspector** — Live feed of every incoming mock request with method, status, latency, headers, and body
- **Mock engine pipeline** — Catch-all route handler supporting all HTTP methods, with auth gate, CORS, latency, error injection, Faker processing, and SSE publish
- **Social-good demo seed data** — Four projects: Disaster Relief API, Climate Monitor API, Open Health API, Food Bank Network API
- **Vercel deployment** — Live at `restless-five.vercel.app`

### Tech Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript
- PostgreSQL + Prisma ORM
- shadcn/ui + Tailwind CSS v4
- Google Gemini 2.5 Flash
- Faker.js
- Server-Sent Events (`ReadableStream`)
- Vercel
