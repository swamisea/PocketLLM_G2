# Pocket LLM Portal 
## (Docker + LangChain + Ollama + Mongo + Redis)

This is a minimal boilerplate showing:

- React + Vite + TypeScript frontend (`frontend/`)
- Node.js + TypeScript backend (`backend/`)
- MongoDB + Redis + Ollama containers (via `docker-compose.yml`)
- LangChain JS connecting to Ollama in the backend
- Simple chat flow: Frontend → Backend API → LangChain → Ollama → Response

## Quick start

```bash
docker compose up --build
```

If the above command doesn't work, please use the following:
```bash
docker compose build
docker compose up
```

**Note:** The first build might take some time to download the model files

Then open `http://localhost:5173` for the frontend.

The backend runs on `http://localhost:8080` (inside Docker, frontend uses `VITE_API_URL`).

You need an Ollama model (default: `gemma3:270m`) available. The `ollama` service will manage models
and share them through the `ollama_models` volume.
