# Pocket LLM Portal 

Course Project for CSCI: 578 - Software Architectures \
Group No. 2 \
Team members: \
Chandan Manjunath, Swaminathan Chellappa, Rithvik Vasishta, Harsha Salim,
Ryuya Hasegawa, Norbert Sunn, Yutian Yang

## Demo
https://github.com/user-attachments/assets/e06c1099-82d2-4fab-a77e-ebbb7c02f18a


## Overview

(Docker + LangChain + Ollama + Mongo + Redis)


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
