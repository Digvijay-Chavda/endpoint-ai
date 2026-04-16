# Endpoint — API Reference

Base URL (development): `http://localhost:3000`  
Base URL (production): `https://your-deployment.com`

---

## Projects API

### `GET /api/projects`

Returns all projects.

**Response `200`**

```json
[
  {
    "id": "cm1a2b3c4",
    "name": "Checkout API",
    "description": null,
    "createdAt": "2025-03-11T12:00:00.000Z",
    "updatedAt": "2025-03-11T12:00:00.000Z"
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

**Response `201`** — returns the created project object.

---

### `DELETE /api/projects/[id]`

Delete a project and all its endpoints (cascade).

**Response `204`** — no body.

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
  "latencyMs": 200,
  "errorRate": 0.05,
  "requireAuth": false,
  "customAuthHeader": null,
  "enableCors": true
}
```

**Response `201`** — returns the created endpoint.

---

### `PATCH /api/endpoints/[id]`

Update an existing endpoint. All fields optional (partial update).

**Response `200`** — returns the updated endpoint.

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
4. Error rate simulation (`errorRate`)
5. Faker template interpolation
6. SSE publish to Request Inspector
7. Return JSON response

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

: ping  (every 25s, keeps connection alive)
```

---

## AI Payload Generator

### `POST /api/ai-generate`

Generate a realistic JSON payload from a natural language prompt using Google Gemini 2.5 Flash.

**Responses are cached by Next.js `unstable_cache` for 1 hour** — repeated prompts are instant.

**Request body**

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
| `503` | `GEMINI_API_KEY` not configured |
| `500` | Gemini API error or invalid JSON output |
