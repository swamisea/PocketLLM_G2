import { randomUUID } from "crypto";
import { ChatOllama } from "@langchain/ollama";
import { getCollection } from "../services/database.service";
import { ObjectId } from "mongodb";
import { Request, Response } from "express";
import type { ChatMessage } from "@common/types/chat";
import type { Session } from "@common/types/session";
import { getCachedResponse, setCachedResponse} from "../utils/cache.util";

const model = new ChatOllama({
  baseUrl: process.env.OLLAMA_URL,
  model: process.env.OLLAMA_MODEL,
  temperature: 0.7,
});

const CACHE_TTL = parseInt(process.env.CACHE_TTL || '600');

export async function handleChat(
  req: Request,
  res: Response
) {
  let { message, sessionId } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({
      success: false,
      error: "Missing message"
    });
  }

  try {
    const userId =  req.user!.id;

    let createdSession = false;
    const userMsg: ChatMessage ={
      id: randomUUID(),
      role: "user",
      content: message as string,
      createdAt: new Date().toISOString(),
    };
    const sessions = getCollection<Session>("sessions");
    if (!sessionId) {
      const doc: Omit<Session, "id"> = {
        title: (userMsg.content && userMsg.content.slice(0, 64)) || "New chat",
        createdAt: new Date().toISOString(),
        messages: [] as ChatMessage[],
      };
      sessionId = (await sessions.insertOne(doc as any)).insertedId.toString();
      createdSession = true;
    }


    const cachedResponse = await getCachedResponse(userId, sessionId, message);

    let aiResponseContent: string;
    if (cachedResponse) {
      aiResponseContent = cachedResponse;
      console.log(`Cache Hit for user ${userId} and for session ${sessionId}`);
    } else {
      console.log("Cache Miss. Invoking LLM for response")
      const response = (await model.invoke(message)) as any;
      aiResponseContent =
          typeof response.content === "string"
              ? response.content
              : Array.isArray(response.content)
              ? response.content.map((c: any) => c.text ?? "").join("")
              : JSON.stringify(response.content);
      await setCachedResponse(userId, sessionId, message, aiResponseContent, CACHE_TTL);
    }

    const reply: ChatMessage = {
      id: randomUUID(),
      role: "assistant",
      content: aiResponseContent,
      createdAt: new Date().toISOString(),
    };

    await sessions.updateOne(
      { _id: new ObjectId(sessionId) },
      { $push: { messages: { $each: [userMsg, reply] } } }
    );

    const statusCode = createdSession ? 201 : 200;
    return res.status(statusCode).json({ reply, sessionId: sessionId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Model error" });
  }
}
