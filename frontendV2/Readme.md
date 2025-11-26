# Frontend — PocketLLM

This folder contains the React/TypeScript frontend using Vite. The UI shows sessions in a sidebar and a chat page that interacts with the backend conversation API.

## Quick Start

1. Install dependencies
```bash
cd frontend
npm install
```
2. Run dev server
```bash
npm run dev
```
3. Build for production
```bash
npm run build
npm run preview
```

## Notable UI Behaviors
- Clicking `+ New chat` creates a client-only (temporary) session shown in the UI only (no server request is made). Temporary sessions are prefixed with `local-`.
- The first message sent for a `local-*` session causes the backend to create a persisted session; the server returns a `sessionId` and the UI swaps the temporary id for the persisted id.
- The app no longer creates sessions in the backend on initial page load; server sessions are only created when the first message for a session is sent.
- Clicking the `+ New chat` button will select and clear an existing empty local draft if one exists, rather than creating another empty draft.

## Adding features (guidelines)

When adding a new interface or page, follow these patterns:

1. New pages: add files under `src/pages/` and import them into `App.tsx` as needed.
2. New components: put them under `src/components/`. Keep components small and presentational where possible; handle state in `App`, `pages`, or `hooks`.
3. Styling: `src/styles.css` is used across the app — add classes there or create a new file if appropriate.
4. State & data: If your feature needs to talk to the backend, follow the existing pattern of using `fetch` and the API base URL from `VITE_API_URL` in `services`.
5. Types: Add new types to `common/src/types` when introducing new API shapes to ensure frontend/backend compatibility.
