# endpoint-ai — AI-Powered API Mocking Platform

## 🚨 The Problem

Developers building apps for **social good** — healthcare systems, disaster relief coordination, climate monitoring, food bank networks — face a critical bottleneck: **they can't prototype fast without a real backend.**

Setting up mock APIs by hand is tedious, static, and never realistic. This slows down innovation exactly where speed matters most.

## ✅ The Solution

**endpoint-ai** lets you:

1. **Create a project** (e.g. "Disaster Relief API")
2. **Define endpoints** with method, path, and response body
3. **Generate realistic JSON payloads with AI** — describe it in plain English, Gemini 2.5 Flash generates it
4. **Improve existing payloads with AI** — paste your current JSON and ask Gemini to refine it _(new)_
5. **Simulate real network conditions** — latency, error rates, auth, CORS
6. **Hit the live URL immediately** — no deployment, no server
7. **Export a Postman Collection** for your whole project in one click _(new)_

```
https://endpoint-ai.vercel.app/mock/[projectId]/your/path
```

---

## 🌍 Impact & Social Good Angle

**endpoint-ai** directly accelerates development of apps that matter:

| Domain             | How It Helps                                               |
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
| **Real-Time Inspector**       | Live SSE feed plus stored history of every request with headers, params, and body |
| **Project Management**        | Rename, delete, search, export, and import (Endpoint JSON, OpenAPI, Postman) projects |
| **Response Shaping**          | Per-endpoint status code, custom response headers, and custom error status    |
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

### Mock Engine Pipeline

When a request hits `GET /mock/[projectId]/[path]`:

1. **Route Match** — Looks up endpoint by `[projectId, method, path]`
2. **Auth Gate** — Returns `401` if auth is required and header is missing/invalid
3. **CORS** — Appends wildcard CORS headers if enabled
4. **Latency** — Delays the response by the configured `latencyMs`
5. **Error Simulation** — Randomly returns a 5xx error at the configured error rate
6. **Faker Processing** — Interpolates any `{{faker.*}}` template tokens
7. **Inspector Log** — Stores the request log in the database for the Inspector
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
git clone https://github.com/Digvijay-Chavda/endpoint-ai.git
cd endpoint-ai
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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Digvijay-Chavda/endpoint-ai)

Set `DATABASE_URL` in your Vercel project settings (`GEMINI_API_KEY` is optional — users can enter their own key in the AI generator), then run:

```bash
npx prisma db push
```

> **Upgrading an existing database:** this release adds `Project.ownerId`, three `Endpoint` columns (`statusCode`, `responseHeaders`, `errorStatusCode`) and a `RequestLog` table. The changes are additive and existing rows keep working. Run `npx prisma db push` (or `npx prisma migrate deploy`) against your database **before** deploying this version, otherwise the API will error on the missing columns.

> **Access model:** there are no accounts. Each browser owns the projects it creates (via an `httpOnly` cookie); other browsers cannot see or change them. Projects created before this change stay visible to everyone. Mock URLs are always public.

> **Note:** The Inspector stores requests in the database and streams them over SSE by polling, so it works across serverless instances. It still needs a platform that supports streaming responses; Vercel Fluid Compute supports this natively.

--

## 📄 License

MIT — see [LICENSE](LICENSE).
