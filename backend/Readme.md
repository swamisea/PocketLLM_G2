# Backend — PocketLLM

This folder contains the Express/TypeScript backend for PocketLLM. It exposes the HTTP API used by the frontend and handles data persistence (MongoDB).

## Quick Start

1. Install dependencies
```bash
cd backend
npm install
```
2. Run in dev mode (auto-reloads on change)
```bash
npm run dev
```
3. Build for production
```bash
npm run build
npm start
```

## Environment variables

Place environment variables in a `.env` file or in your environment when running:
- `PORT` — port to run the server on (default 8080)
- `DB_CONN_STRING` — MongoDB connection URI
- `OLLAMA_URL` — Ollama endpoint
- `OLLAMA_MODEL` — Ollama model name

## Endpoints (overview)
- GET `/health` — returns a simple status
- GET `/api/sessions` — list sessions (does not include messages)
- POST `/api/sessions` — create a session (rarely used by UI; added for completeness)
- GET `/api/sessions/:id` — fetch a session with messages
- POST `/api/sessions/:id/messages` — append a message to an existing session
- POST `/api/chat` — send a message to the model and receive a reply; if no `sessionId` is provided, this will create a session and persist both messages in that new session

Example `POST /api/chat` request format:
```json
{
	"message": "Hello",
	"sessionId": "<optional session id>"
}
```

When `sessionId` is omitted or `null`, the server will create a new session and return `sessionId` in the response; the HTTP status code for created sessions is `201` (otherwise `200`).

## Adding a new backend feature (guidelines)

When adding a new route or server feature, follow this pattern:

1. Create a route in `src/routes` (e.g., `src/routes/myFeature.ts`) where you define Express routes and import your service.
2. Implement business logic in `src/services` (e.g., `src/services/myFeature.service.ts`). Keep controller code (Express request/response handling) separate from service logic.
3. Add database interactions using `getCollection('<collectionName>')` from `src/db.ts`. Avoid directly instantiating DB clients.
4. Register the route with an endpoint in `src/app.ts` (e.g., `app.use('/api/my-feature', myFeatureRoutes);`).
5. If your API changes require new data shapes, consider adding TypeScript types to `common/src/types` and update both frontend and backend types.
6. Add input validation and error handling: validate request payloads and return appropriate HTTP status codes (400 for bad requests, 404 for not found, 500 for server errors).

## Database & schema

- The application uses MongoDB through the `mongodb` driver.
- `getCollection(name)` provides a joined access point; store collections in `src/db.ts`.
- Use lightweight objects and arrays to store messages — no migration framework is provided by default. If you must change the storage schema, add migration steps and document them in this README.
