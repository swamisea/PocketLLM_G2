# Pocket LLM Boilerplate (Docker + LangChain + Ollama + Mongo)

This is a minimal boilerplate showing:

- React + Vite + TypeScript frontend (`frontend/`)
- Node.js + TypeScript backend (`backend/`)
- MongoDB + Ollama containers (via `docker-compose.yml`)
- LangChain JS connecting to Ollama in the backend
- Simple chat flow: Frontend → Backend API → LangChain → Ollama → Response

## Quick start (dev-ish)

```bash
docker compose up --build
```

Then open `http://localhost:5173` for the frontend.

The backend runs on `http://localhost:8080` (inside Docker, frontend uses `VITE_API_URL`).

You need an Ollama model (default: `llama3.1:8b`) available. The `ollama` service will manage models
and share them through the `ollama_models` volume.
```