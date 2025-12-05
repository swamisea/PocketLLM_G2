import { randomUUID } from "crypto";
import { ChatOllama } from "@langchain/ollama";
import { getCollection } from "./database.service";
import { ObjectId } from "mongodb";
import { Response } from "express";
import type {ChatMessage, ChatRequest} from "@common/types/chat";
import type { Session } from "@common/types/session";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getCachedResponse, setCachedResponse} from "../utils/cache.util";
import {AuthRequest} from "../middleware/auth.middleware";
import { logTelemetry } from "./telemetry.service";

// --------------------------
// Config / constants
// --------------------------

const OLLAMA_BASE_URL = process.env.OLLAMA_URL;
const DEFAULT_CHAT_MODEL = process.env.OLLAMA_MODEL ?? "gemma3:270m";
const DEFAULT_CHAT_TEMPERATURE = 0.7;

const CACHE_TTL = parseInt(process.env.CACHE_TTL || '600');

// Title generation uses a fixed model + temperature
const TITLE_MODEL_NAME = DEFAULT_CHAT_MODEL;
const TITLE_TEMPERATURE = 0.5;

const CONTEXT_MESSAGES_LIMIT = 20;
const BASE_SYSTEM_PROMPT = "You are a helpful assistant.";

// --------------------------
// Model helpers
// --------------------------

function createChatModel(options?: { model?: string; temperature?: number }) {
  return new ChatOllama({
    baseUrl: OLLAMA_BASE_URL,
    model: options?.model ?? DEFAULT_CHAT_MODEL,
    temperature: options?.temperature ?? DEFAULT_CHAT_TEMPERATURE,
  });
}

// Single shared instance for title generation (uses default model)
const titleModel = new ChatOllama({
  baseUrl: OLLAMA_BASE_URL,
  model: TITLE_MODEL_NAME,
  temperature: TITLE_TEMPERATURE,
});

// --------------------------
// Utility helpers
// --------------------------

function extractContent(response: any): string {
  if (typeof response?.content === "string") return response.content;
  if (Array.isArray(response?.content)) {
    return response.content.map((c: any) => c.text ?? "").join("");
  }
  return JSON.stringify(response?.content ?? "");
}

function lcFromChatMessage(msg: ChatMessage) {
  if (msg.role === "assistant") return new AIMessage(msg.content);
  // Treat everything else as "user" for now
  return new HumanMessage(msg.content);
}

/**
 * Build the LangChain messages array:
 * - Base system prompt
 * - Optional custom systemPrompt from request
 * - Prior chat history
 * - Current user message
 */
function buildChatMessages(params: {
  priorMessages: ChatMessage[];
  userMsg: ChatMessage;
  systemPrompt?: string;
}) {
  const { priorMessages, userMsg, systemPrompt } = params;

  const messages: (SystemMessage | HumanMessage | AIMessage)[] = [];

  // Base system behavior
  messages.push(new SystemMessage(BASE_SYSTEM_PROMPT));

  // User-provided system prompt (if any)
  if (systemPrompt && systemPrompt.trim().length > 0) {
    messages.push(new SystemMessage(systemPrompt.trim()));
  }

  // History
  for (const m of priorMessages) {
    messages.push(lcFromChatMessage(m));
  }

  // Current user message
  messages.push(new HumanMessage(userMsg.content));

  return messages;
}

/**
 * Generate a short title for a new conversation from the first user message.
 * Uses the dedicated titleModel and ignores per-request overrides.
 */
async function generateTitleFromMessage(firstMessage: string): Promise<string> {
  if (!firstMessage) return "New chat";

  const resp = await titleModel.invoke([
    new SystemMessage(
      "Generate a concise conversation title (max 8 words). Return only the title text."
    ),
    new HumanMessage(firstMessage),
  ]);

  const raw = extractContent(resp);
  const firstLine = raw.split("\n")[0].trim();
  return firstLine || firstMessage.slice(0, 64) || "New chat";
}

/**
 * Fetch the previous messages for a session (limited) for context.
 */
async function getSessionHistory(
  sessionsCollection: ReturnType<typeof getCollection<Session>>,
  sessionId: string
): Promise<ChatMessage[]> {
  const existing = await sessionsCollection.findOne(
    { _id: new ObjectId(sessionId) },
    {
      projection: {
        messages: { $slice: -CONTEXT_MESSAGES_LIMIT },
      },
    }
  );

  if (existing?.messages && Array.isArray(existing.messages)) {
    return existing.messages as ChatMessage[];
  }

  return [];
}

// --------------------------
// Main handler
// --------------------------

export async function handleChat(
  req: AuthRequest,
  res: Response
) {
  const startedAt = Date.now();
  const { message, messageObj, sessionId, systemPrompt, model, temperature } =
    req.body as ChatRequest;

  if ((!message || typeof message !== "string") && !messageObj) {
    return res.status(400).json({
      success: false,
      error: "Missing message"
    });
  }

  // Normalize user message into a ChatMessage object
  const userMsg: ChatMessage =
    messageObj ??
    ({
      id: randomUUID(),
      role: "user",
      content: message!,
      createdAt: new Date().toISOString(),
    } as ChatMessage);

  try {
    const sessions = getCollection<Session>("sessions");
    const userId = req.user!.id

    let sid = sessionId;
    let isNewSession = false;

    // 1. Load previous messages (context) if session exists
    let priorMessages: ChatMessage[] = [];
    if (sid) {
      priorMessages = await getSessionHistory(sessions, sid);
    } else { // 2. If no sessionId -> create new session, generate title using default model
      const title = await generateTitleFromMessage(userMsg.content);
      const newSession: Omit<Session, "id"> = {
        title,
        userId,
        createdAt: new Date().toISOString(),
        messages: [],
      };
      const result = await sessions.insertOne(newSession as any);
      sid = result.insertedId.toString();
      isNewSession = true;
    }

    let assistantText
    const cachedResponse = await getCachedResponse(userId, sid, userMsg.content);
    if (cachedResponse) {
      assistantText = cachedResponse;
      console.log(`Cache Hit for user ${userId} and for session ${sessionId}`);
      await logTelemetry({
        eventType: "cache_hit",
        userId,
        sessionId: sid,
        model: model ?? DEFAULT_CHAT_MODEL,
        temperature: temperature ?? DEFAULT_CHAT_TEMPERATURE,
        cacheHit: true,
        durationMs: Date.now() - startedAt,
        promptChars: userMsg.content.length,
        responseChars: cachedResponse.length,
      });
    } else {
      await logTelemetry({
        eventType: "cache_miss",
        userId,
        sessionId: sid,
        model: model ?? DEFAULT_CHAT_MODEL,
        temperature: temperature ?? DEFAULT_CHAT_TEMPERATURE,
        cacheHit: false,
        promptChars: userMsg.content.length,
      });
      console.log("Cache Miss. Invoking LLM for response")
      // 2. Build LangChain messages with systemPrompt + history + current message
      const chatMessages = buildChatMessages({
        priorMessages,
        userMsg,
        systemPrompt,
      });

      // 3. Create per-request chat model (overrides model/temp if provided)
      const chatModel = createChatModel({ model, temperature });

      const response = await chatModel.invoke(chatMessages);
      assistantText = extractContent(response);
      await setCachedResponse(userId, sid, userMsg.content, assistantText, CACHE_TTL);
      await logTelemetry({
        eventType: "chat_response",
        userId,
        sessionId: sid,
        model: model ?? DEFAULT_CHAT_MODEL,
        temperature: temperature ?? DEFAULT_CHAT_TEMPERATURE,
        cacheHit: false,
        durationMs: Date.now() - startedAt,
        promptChars: userMsg.content.length,
        responseChars: assistantText.length,
      });
    }

    const reply: ChatMessage = {
      id: randomUUID(),
      role: "assistant",
      content: assistantText,
      createdAt: new Date().toISOString(),
    };

    // 5. Persist both user + assistant messages
    await sessions.updateOne(
      { _id: new ObjectId(sid) },
      {
        $push: {
          messages: { $each: [userMsg, reply] },
        },
      }
    );

    return res.status(isNewSession ? 201 : 200).json({
      sessionId: sid,
      reply,
    });
  } catch (err) {
    console.error("Chat error:", err);
    await logTelemetry({
      eventType: "chat_error",
      userId: req.user?.id,
      sessionId,
      model: model ?? DEFAULT_CHAT_MODEL,
      temperature: temperature ?? DEFAULT_CHAT_TEMPERATURE,
      cacheHit: false,
      durationMs: Date.now() - startedAt,
      promptChars: message?.length,
      errorMessage: (err as Error)?.message || "Model error",
    });
    res.status(500).json({ error: "Model error" });
  }
}
