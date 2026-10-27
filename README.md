# endpoint-ai — AI-Powered API Mocking Platform

## 🚨 The Problem

Developers building apps for **social good** — healthcare systems, disaster relief coordination, climate monitoring, food bank networks — face a critical bottleneck: **they can't prototype fast without a real backend.**

Setting up mock APIs by hand is tedious, static, and never realistic. This slows down innovation exactly where speed matters most.

## ✅ The Solution

**endpoint-ai** lets you:

1. **Create a project** (e.g. "Disaster Relief API")
2. **Define endpoints** with method, path, and response body
3. **Generate realistic JSON payloads with AI** — describe it in plain English, Google Gemini generates it
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

Every new account starts with one ready-made sample API (users, auth, latency and flaky-error examples) so you can see what the app does straight away.

---

## ✨ Features

| Feature                       | Description                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------- |
| **Project Organisation**      | Group endpoints into projects, each with a scoped base URL                    |
| **Full CRUD Endpoints**       | Create, edit, and delete endpoints by method + path                           |
| **AI Payload Generation**     | Describe a response in plain English; Google Gemini generates it instantly |
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
| AI           | Google Gemini                                |
| Dynamic Data | Faker.js                                     |
| Real-time    | Server-Sent Events (native `ReadableStream`) |
| Deployment   | Vercel                                       |

---

## 🚀 Local Setup

**Prerequisites:** Node.js 18+, PostgreSQL, a Google OAuth client (for sign-in, see below), optionally a [Gemini API key](https://aistudio.google.com/apikey)

```bash
# 1. Clone and install
git clone https://github.com/Digvijay-Chavda/endpoint-ai.git
cd endpoint-ai
pnpm install

# 2. Configure environment
cp .env.example .env
# Set DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in .env
# (GEMINI_API_KEY is optional — users can paste their own key in the AI generator)

# 3. Push database schema
npx prisma db push

# 4. Start the dev server
pnpm dev
```

### Google sign-in setup

1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) create an **OAuth client ID** of type *Web application* (configure the OAuth consent screen first if prompted).
2. Add these **Authorised redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<your-domain>/api/auth/callback/google`
3. Put the client ID and secret in `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.
4. Generate a session secret and put it in `AUTH_SECRET`: `openssl rand -base64 32`

The first time someone signs in they get a private workspace with one sample project. Projects are only visible to the account that created them; the `/mock/...` URLs they serve stay public so they can be shared.

Open [http://localhost:3000](http://localhost:3000).

---

## 🌐 Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Digvijay-Chavda/endpoint-ai)

Set `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in your Vercel project settings (`GEMINI_API_KEY` is optional — users can enter their own key in the AI generator), add your production redirect URI in Google Cloud (see above), then run:

```bash
npx prisma db push
```

> **Upgrading an existing database:** this release adds a `User` table, `Project.ownerId`, three `Endpoint` columns (`statusCode`, `responseHeaders`, `errorStatusCode`) and a `RequestLog` table. The changes are additive. Run `npx prisma db push` (or `npx prisma migrate deploy`) against your database **before** deploying this version, otherwise the API will error on the missing tables/columns.

> **Removing the old global projects:** projects created before accounts existed have no owner and are invisible to everyone once this version is live, but their `/mock/...` URLs keep working until they are deleted. Preview with `npm run db:delete-projects`, then delete with `npm run db:delete-projects -- --yes` (add `--all` to wipe every project, including users' own). It runs against whatever `DATABASE_URL` points at.

> **Note:** The Inspector stores requests in the database and streams them over SSE by polling, so it works across serverless instances. It still needs a platform that supports streaming responses; Vercel Fluid Compute supports this natively.

--

## 📄 License

MIT — see [LICENSE](LICENSE).
