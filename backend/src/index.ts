import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { json } from "express";
import { ChatOllama } from "@langchain/ollama";
import { randomUUID } from "crypto";
import { accountService } from "./services/account.service";
import { databaseService } from "./services/database.service";

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
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
//const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || "mistral";

const chatModel = new ChatOllama({
  baseUrl: OLLAMA_URL,
  model: MISTRAL_MODEL,
  temperature: 0.7
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

interface ChatRequestBody {
  message: string;
  history?: ChatMessage[];
}



app.post("/api/create-user", async (req, res) => {
  try {
    const now: Date = new Date();
    const payload = {
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      createdAt: now.toISOString()
    }
    const validation = accountService.validatePayload(payload);
    if (!validation.valid) {
      console.log("Validation failed:", validation); // Add this
      return res.status(400).json({
        success: false,
        errors: {
          username: validation.usernameErrors,
          email: validation.emailErrors,
          password: validation.passwordErrors
        }
      });
    }
    const response = await accountService.addUserToDatabase(payload)
    console.log("Insert result:", response); // Add this
    res.json({ success: true, message: "User Created Successfully"})
  }catch(error: any){
    console.log("Account creation failed:", error.message); // Add this
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
})

app.post("/api/login", async(req, res) => {
   try {
      const payload = {
      email: req.body.email,
      password: req.body.password,
    }
    const response = await accountService.verifyUser(payload)
    console.log("Verify user result:", response); // Add this
    res.json({ valid: true, message: response.message})
   }catch(error: any){
    console.log("Account login failed:", error.message); // Add this
    res.status(403).json({
      valid: false,
      message: error.message
    });
  }
})

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

async function startServer() {
  try {
    // Initialize database connection
    await databaseService.initialize();
    
    // Connect to collections
    await databaseService.connectToCollections();
    
    // Start the server after database is ready
    app.listen(PORT, () => {
      console.log(`Backend listening on port ${PORT}`);
      console.log(`Using Ollama at ${OLLAMA_URL} with model ${MISTRAL_MODEL}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
