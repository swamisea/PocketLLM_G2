import { randomUUID } from "crypto";
import { ChatOllama } from "@langchain/ollama";
import { getCollection } from "../db";
import { ObjectId } from "mongodb";
import { Request, Response } from "express";
import { ChatMessage } from "../../../common/src/types/chat";

const model = new ChatOllama({
  baseUrl: process.env.OLLAMA_URL,
  model: process.env.OLLAMA_MODEL,
  temperature: 0.7,
});

export async function handleChat(
  req: Request<
    {},
    {},
    { message?: string; messageObj?: ChatMessage; sessionId?: string }
  >,
  res: Response
) {
  const { message, messageObj, sessionId } = req.body;

  if ((!message || typeof message !== "string") && !messageObj) {
    return res.status(400).json({ error: "Missing message" });
  }

  try {
    const prompt = message ?? (messageObj && messageObj.content) ?? "";
    const response = (await model.invoke(prompt)) as any;

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
      createdAt: new Date().toISOString(),
    };

    const sessions = getCollection("sessions");

    let sid = sessionId;
    let createdSession = false;

    // Determine user message: either provided full ChatMessage or compose one
    const userMsg: ChatMessage = messageObj
      ? { ...messageObj }
      : {
          id: randomUUID(),
          role: "user",
          content: message as string,
          createdAt: new Date().toISOString(),
        };

    if (!sid) {
      const doc = {
        title: (userMsg.content && userMsg.content.slice(0, 64)) || "New chat",
        createdAt: new Date().toISOString(),
        messages: [] as ChatMessage[],
      };
      sid = (await sessions.insertOne(doc)).insertedId.toString();
      createdSession = true;
    }

    await sessions.updateOne(
      { _id: new ObjectId(sid) },
      { $push: { messages: { $each: [userMsg, reply] } } }
    );

    const statusCode = createdSession ? 201 : 200;
    return res.status(statusCode).json({ reply, sessionId: sid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Model error" });
  }
}
