# RESTless — AI-Powered API Mocking Platform

> **Hackathon Submissions:**
>
> - 🏆 [Global Engineering Hackathon](https://global-engineering-hackathon.devpost.com/) — _Original submission (March 2026)_
> - 🚀 [Quantum Sprint: For Social Good](https://quantum-sprint.devpost.com/) — _Updated submission with new features (March 30, 2026)_
>
> Tracks entered: **Best AI Innovation** · **Best SaaS Product**
>
> An AI-powered API mocking platform that lets developers instantly generate realistic mock endpoints, simulate network conditions, and prototype impactful applications — **no backend required.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-restless--five.vercel.app-blue?style=for-the-badge&logo=vercel)](https://restless-five.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-sanjaysah101%2Frestless-181717?style=for-the-badge&logo=github)](https://github.com/sanjaysah101/restless)
[![Global Engineering Hackathon](https://img.shields.io/badge/Submitted-Global%20Engineering%20Hackathon-orange?style=for-the-badge)](https://global-engineering-hackathon.devpost.com/)
[![Quantum Sprint](https://img.shields.io/badge/Submitted-Quantum%20Sprint%202026-purple?style=for-the-badge)](https://quantum-sprint.devpost.com/)

---

## 🆕 What's New — Quantum Sprint Update (March 30, 2026)

> This section documents all **improvements made after the original Global Engineering Hackathon submission**, satisfying Quantum Sprint's requirement that re-submitted projects include clear updates.

The original submission had the core mock engine, AI generation, and SSE inspector. Here is what was **added or improved** for the Quantum Sprint submission:

### ✨ New Features

| Feature                           | Description                                                                                                                                                                                     | Files Changed                                      |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **AI "Improve Response" Mode**    | The AI modal now supports two modes: _Generate from scratch_ and _Improve existing response_. You can refine an existing JSON payload with a follow-up prompt — Gemini rewrites it in context.  | `AIGenerateModal.tsx`                              |
| **Export as Postman Collection**  | A new export button on every project generates a ready-to-import Postman v2.1 JSON collection of all endpoints with their mock URLs.                                                            | `src/app/api/projects/[projectId]/export/route.ts` |
| **Social-Good Hero Landing Page** | Added a rich hero page (`/`) with impact metrics, feature highlights, and a live call-to-action — scoped to the four social-good domains (Disaster Relief, Climate, Healthcare, Food Security). | `src/app/(dashboard)/page.tsx`                     |
| **Improved SEO Metadata**         | Added full OpenGraph, Twitter card meta, and keywords across all pages for better shareability and search visibility.                                                                           | `src/app/layout.tsx`                               |

### 🛠️ Improvements & Polish

| Improvement                   | Description                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **AI response caching**       | Gemini responses are now memoized with `unstable_cache` (1-hour TTL), so identical prompts return instantly without burning API quota. |
| **Faker.js safety hardening** | Template token parsing now validates against an allowlist of `faker.*.*` paths, preventing arbitrary code execution.                   |
| **SSE keep-alive pings**      | Added 15-second keep-alive pings to SSE streams to prevent Vercel edge from closing idle inspector connections.                        |
| **Demo seed data expanded**   | The `pnpm db:seed` now populates richer endpoint responses (10+ fields per resource) aligned to the four social-impact domains.        |

### 📚 Documentation

| Doc            | Description                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------- |
| `CHANGELOG.md` | New changelog documenting both hackathon submission milestones and all changes between them. |
| `docs/API.md`  | Expanded mock engine pipeline documentation with examples for all simulation parameters.     |

---

## 🚨 The Problem

Developers building apps for **social good** — healthcare systems, disaster relief coordination, climate monitoring, food bank networks — face a critical bottleneck: **they can't prototype fast without a real backend.**

Setting up mock APIs by hand is tedious, static, and never realistic. This slows down innovation exactly where speed matters most.

## ✅ The Solution

**RESTless** lets you:

1. **Create a project** (e.g. "Disaster Relief API")
2. **Define endpoints** with method, path, and response body
3. **Generate realistic JSON payloads with AI** — describe it in plain English, Gemini 2.5 Flash generates it
4. **Improve existing payloads with AI** — paste your current JSON and ask Gemini to refine it _(new)_
5. **Simulate real network conditions** — latency, error rates, auth, CORS
6. **Hit the live URL immediately** — no deployment, no server
7. **Export a Postman Collection** for your whole project in one click _(new)_

```
https://restless-five.vercel.app/mock/[projectId]/your/path
```

---

## 🌍 Impact & Social Good Angle

RESTless directly accelerates development of apps that matter:

| Domain             | How RESTless Helps                                         |
| ------------------ | ---------------------------------------------------------- |
| 🆘 Disaster Relief | Mock incident APIs for volunteer coordination apps         |
| 🌿 Climate Tech    | Generate sensor data APIs for environmental monitoring     |
| 🏥 Healthcare      | Prototype patient record systems without real data         |
| 🍞 Food Security   | Build food bank directory apps with instant mock endpoints |

The built-in demo seed data includes all four of these social-impact domains — judges can explore them immediately.

---

## ✨ Features

| Feature                       | Description                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------- |
| **Project Organisation**      | Group endpoints into projects, each with a scoped base URL                    |
| **Full CRUD Endpoints**       | Create, edit, and delete endpoints by method + path                           |
| **AI Payload Generation**     | Describe a response in plain English; Gemini 2.5 Flash generates it instantly |
| **AI Response Refinement** ⭐ | Paste existing JSON and let Gemini improve it with a follow-up prompt         |
| **Faker.js Templates**        | Use `{{faker.person.fullName()}}` syntax for fresh data on every request      |
| **Network Simulation**        | Per-endpoint latency (ms), error rate (%), auth enforcement, and CORS toggle  |
| **Real-Time Inspector**       | Live SSE feed of every incoming request with headers, params, and body        |
| **Postman Export** ⭐         | Download a Postman v2.1 collection for all endpoints in a project             |

> ⭐ = added in the Quantum Sprint update

### Faker.js Template Example

```json
{
  "patientId": "{{faker.string.uuid()}}",
  "name": "{{faker.person.fullName()}}",
  "email": "{{faker.internet.email()}}",
  "location": "{{faker.location.city()}}, {{faker.location.country()}}"
}
```

---

## 🏗️ Architecture

```mermaid
graph LR
    A[Client Request] --> B[/mock/projectId/path]
    B --> C{Route Match}
    C --> D[Auth Gate]
    D --> E[CORS Headers]
    E --> F[Latency Delay]
    F --> G[Error Simulation]
    G --> H[Faker Processing]
    H --> I[SSE Inspector]
    I --> J[JSON Response]
```

### Mock Engine Pipeline

When a request hits `GET /mock/[projectId]/[path]`:

1. **Route Match** — Looks up endpoint by `[projectId, method, path]`
2. **Auth Gate** — Returns `401` if auth is required and header is missing/invalid
3. **CORS** — Appends wildcard CORS headers if enabled
4. **Latency** — Delays the response by the configured `latencyMs`
5. **Error Simulation** — Randomly returns a 5xx error at the configured error rate
6. **Faker Processing** — Interpolates any `{{faker.*}}` template tokens
7. **Inspector Publish** — Emits the request log to the SSE bus
8. **Response** — Returns the JSON payload

---

## 🛠️ Tech Stack

| Layer        | Technology                                   |
| ------------ | -------------------------------------------- |
| Framework    | Next.js 16 (App Router, Turbopack)           |
| Language     | TypeScript                                   |
| Database     | PostgreSQL + Prisma ORM                      |
| UI           | shadcn/ui + Tailwind CSS v4                  |
| AI           | Google Gemini 2.5 Flash                      |
| Dynamic Data | Faker.js                                     |
| Real-time    | Server-Sent Events (native `ReadableStream`) |
| Deployment   | Vercel                                       |

---

## 🚀 Local Setup

**Prerequisites:** Node.js 18+, PostgreSQL, [Gemini API key](https://aistudio.google.com/apikey)

```bash
# 1. Clone and install
git clone https://github.com/sanjaysah101/restless.git
cd restless
pnpm install

# 2. Configure environment
cp .env.example .env
# Set DATABASE_URL and GEMINI_API_KEY in .env

# 3. Push database schema
npx prisma db push

# 4. (Optional) Seed with social-good demo data
pnpm db:seed

# 5. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📦 Demo Seed Data

Running `pnpm db:seed` creates four social-impact demo projects:

| Project                  | Domain             | Endpoints                                           |
| ------------------------ | ------------------ | --------------------------------------------------- |
| 🆘 Disaster Relief API   | Aid & Coordination | `/incidents`, `/shelters`, `/volunteers`            |
| 🌿 Climate Monitor API   | Climate Tech       | `/sensors/stations`, `/emissions/trends`, `/alerts` |
| 🏥 Open Health API       | Healthcare         | `/patients`, `/appointments`, `/medications/:id`    |
| 🍞 Food Bank Network API | Food Security      | `/locations`, `/inventory`, `/donations`            |

---

## 🌐 Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sanjaysah101/restless)

Set `DATABASE_URL` and `GEMINI_API_KEY` in your Vercel project settings, then run:

```bash
npx prisma db push
```

> **Note:** The SSE-based Inspector requires a platform that supports streaming responses. Vercel Fluid Compute supports this natively.

---

## 🗺️ Roadmap

- [x] ~~Import from OpenAPI / Swagger spec~~ — _in progress_
- [x] AI response refinement ("Improve existing response" mode) — _added in Quantum Sprint update_
- [x] Postman Collection export — _added in Quantum Sprint update_
- [ ] Webhook simulation (outbound POST to a user-defined URL)
- [ ] Persistent request history (stored in DB)
- [ ] GraphQL mock support
- [ ] Team workspaces & shared projects

---

## 📋 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a full history of changes between hackathon submissions.

---

## 📄 License

MIT — see [LICENSE](LICENSE).
