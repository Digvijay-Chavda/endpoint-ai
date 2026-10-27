# Endpoint — API Reference

Base URL (development): `http://localhost:3000`  
Base URL (production): `https://your-deployment.com`

---

## Ownership

There are no accounts. Each browser gets a random id in an `httpOnly` cookie (`endpoint_owner`) and every project you create is owned by it. All `/api/projects`, `/api/endpoints` and `/api/inspector` routes only list or modify projects owned by the calling browser. Anything else returns `404`.

- Clearing cookies loses access to your projects (export them first if that matters).
- Projects created before ownership existed (`ownerId = null`) stay visible and editable to everyone.
- Mock URLs under `/mock/...` are always public, so they can be shared.

---

## Projects API

### `GET /api/projects`

Returns the projects visible to the caller, newest first, each with `_count.endpoints`.

**Response `200`**

```json
[
  {
    "id": "cm1a2b3c4",
    "name": "Checkout API",
    "description": null,
    "createdAt": "2025-03-11T12:00:00.000Z",
    "updatedAt": "2025-03-11T12:00:00.000Z",
    "_count": { "endpoints": 3 }
  }
]
```

---

### `POST /api/projects`

Create a new project.

**Request body**

```json
{ "name": "My Project", "description": "Optional" }
```

`name` is required (max 100 chars, unique per owner, case-insensitive). `description` max 500 chars.

**Response `201`** — returns the created project. **`409`** if the name is taken.

---

### `GET /api/projects/[id]`

Returns one project, or `404`.

### `PATCH /api/projects/[id]`

Rename or re-describe a project. Body: `{ "name"?: string, "description"?: string }`. Same validation and `409` rule as create.

### `DELETE /api/projects/[id]`

Delete a project, all its endpoints and its stored request logs (cascade).

**Response `204`** — no body. `404` if it does not exist or is not yours.

---

### `GET /api/projects/[id]/export`

Downloads the project as an Endpoint JSON file (`format: "endpoint-ai/project"`) containing every endpoint and its settings.

### `POST /api/projects/import`

Creates a new project from a file. Body: `{ "content": <object | JSON string>, "name"?: string }`.

Accepted formats (detected automatically):

- an Endpoint export (from the route above)
- **OpenAPI 3.x / Swagger 2** JSON — one endpoint per operation; the response body comes from the 2xx response `example`/`examples`, or a sample generated from its schema; the status code is taken from the chosen response
- **Postman collection v2.x** JSON — folders are flattened; the first saved example response with a body is used

Limits: 500 endpoints. Duplicate `(method, path)` pairs are skipped. If the project name is taken a ` (2)` suffix is added.

**Response `201`** — the new project plus `importedEndpoints` and `source`. **`400`** with a message for unreadable or empty files.

---

## Endpoints API

### `GET /api/endpoints?projectId=[id]`

Returns all endpoints for a given project.

---

### `POST /api/endpoints`

Create a new mock endpoint.

**Request body**

```json
{
  "projectId": "cm1a2b3c4",
  "path": "/api/users",
  "method": "GET",
  "responseBody": "{\"users\": []}",
  "statusCode": 200,
  "responseHeaders": { "X-Total-Count": "42" },
  "latencyMs": 200,
  "errorRate": 0.05,
  "errorStatusCode": null,
  "requireAuth": false,
  "customAuthHeader": null,
  "enableCors": true
}
```

| Field | Rules |
|---|---|
| `path`, `method`, `responseBody` | required; method is `GET`/`POST`/`PUT`/`PATCH`/`DELETE` |
| `statusCode` | integer 200–599, default `200` (`204`, `205`, `304` send no body) |
| `responseHeaders` | optional JSON object (or JSON string) of extra response headers |
| `latencyMs` | integer 0–10000 |
| `errorRate` | 0–1 |
| `errorStatusCode` | optional 400–599; when set, simulated errors use it instead of a random 5xx |

**Response `201`** — returns the created endpoint. **`400`** for invalid fields, **`409`** if `method + path` already exists in the project.

---

### `PATCH /api/endpoints/[id]`

Update an existing endpoint. All fields optional (partial update); unknown fields such as `projectId` are ignored. Same validation as create; **`409`** if the new `method + path` collides.

**Response `200`** — returns the updated endpoint.

---

### `POST /api/endpoints/[id]/duplicate`

Copies an endpoint to `<path>-copy` (then `-copy-2`, …) in the same project. **Response `201`**.

---

### `DELETE /api/endpoints/[id]`

Delete an endpoint.

**Response `204`** — no body.

---

## Mock Engine

### `[METHOD] /mock/[projectId]/[...path]`

The live mock URL. Supports `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.

**Example:** `GET /mock/cm1a2b3c4/api/users`

**Pipeline (in order):**

1. Lookup endpoint by `[projectId, method, path]`
2. Auth validation (if `requireAuth=true`)
3. Latency simulation (`latencyMs`)
4. Error rate simulation (`errorRate`; status is `errorStatusCode` if set, else a random 5xx)
5. Faker template interpolation
6. Request logged to the database for the Request Inspector
7. Return the response with the configured `statusCode` and custom `responseHeaders`

**CORS preflight (`OPTIONS`):** the headers named in `Access-Control-Request-Headers` are echoed back, so custom request headers pass the preflight.

**Faker template syntax in `responseBody`:**

```
{{faker.module.method()}}
```

Examples:

- `{{faker.string.uuid()}}`
- `{{faker.person.fullName()}}`
- `{{faker.internet.email()}}`
- `{{faker.image.avatar()}}`
- `{{faker.commerce.price()}}`
- `{{faker.date.recent()}}`

Full list: [Faker.js API docs](https://fakerjs.dev/api/)

---

## Request Inspector (SSE)

### `GET /api/inspector/[projectId]`

Opens a Server-Sent Events stream. Connect with `EventSource` in the browser.

Requests are stored in the `RequestLog` table (last 500 per project; `Authorization` values are truncated and cookies redacted; bodies are clipped at 10 KB), so the stream works across serverless instances and history survives reloads. The stream polls the table about once a second and closes itself after ~55 s; `EventSource` reconnects and resumes from the `Last-Event-ID` header. Pass `?since=<ISO timestamp>` to start from a point in time.

**Events:**

```
data: {"type":"connected","projectId":"cm1..."}

data: {"type":"log","entry":{
  "id": "uuid",
  "timestamp": "ISO-8601",
  "method": "GET",
  "path": "/api/users",
  "statusCode": 200,
  "latencyMs": 143,
  "requestHeaders": {},
  "queryParams": {},
  "requestBody": null,
  "responseBody": "...",
  "endpointId": "cm1..."
}}

: ping  (every 15s, keeps connection alive)
```

### `GET /api/inspector/[projectId]/logs`

Returns the latest 200 stored requests (newest first) in the same entry shape as above.

### `DELETE /api/inspector/[projectId]/logs`

Clears the project's stored request history. **Response `204`.**

---

## AI Payload Generator

### `POST /api/ai-generate`

Generate a realistic JSON payload from a natural language prompt using Google Gemini 2.5 Flash.

**Responses are cached by Next.js `unstable_cache` for 1 hour** — repeated prompts are instant.

**API key:** send your own key in the `x-gemini-api-key` header. If the header is omitted, the server's `GEMINI_API_KEY` is used.

### `GET /api/ai-generate`

Returns `{ "serverKeyConfigured": true | false }` so clients know whether the user must supply a key.

**`POST` request body**

```json
{ "prompt": "10 e-commerce products with title, price, imageUrl, and rating" }
```

**Response `200`**

```json
{ "result": "[{\"id\": 1, \"title\": \"...\", ...}]" }
```

**Error responses:**
| Status | Reason |
|---|---|
| `400` | Missing `prompt` |
| `401` | `NO_API_KEY` (no header key and no server key) or `INVALID_API_KEY` (Gemini rejected the key) |
| `500` | Gemini API error or invalid JSON output |
