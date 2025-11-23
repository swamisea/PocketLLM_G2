import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { json } from "express";
import { ChatOllama } from "@langchain/ollama";
import { randomUUID } from "crypto";

export type Role = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: string; // ISO string
}

dotenv.config();

const app = express();
app.use(cors());
app.use(json());

const PORT = process.env.PORT || 8080;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://ollama:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";

const chatModel = new ChatOllama({
  baseUrl: OLLAMA_URL,
  model: OLLAMA_MODEL,
  temperature: 0.7
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

interface ChatRequestBody {
  message: string;
  history?: ChatMessage[];
}

app.post("/api/chat", async (req, res) => {
  const body = req.body as ChatRequestBody;

  if (!body?.message || (typeof body.message as any !== "string")) {
    return res.status(400).json({ error: "Missing 'message' in body" });
  }

  try {
    // Very basic: ignore history for now, just send last user message
    const userInput = body.message;

    const response = await chatModel.invoke(userInput);

    const content =
      typeof response.content === "string"
        ? response.content
        : Array.isArray(response.content)
        ? response.content.map((c: any) => c.text ?? "").join("")
        : JSON.stringify(response.content);

    const reply: ChatMessage = {
      id: randomUUID(),
      role: "assistant",
      content,
      createdAt: new Date().toISOString()
    };

    res.json({ reply });
  } catch (err: any) {
    console.error("Error in /api/chat:", err);
    res.status(500).json({ error: "Failed to get response from model" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
  console.log(`Using Ollama at ${OLLAMA_URL} with model ${OLLAMA_MODEL}`);
});
