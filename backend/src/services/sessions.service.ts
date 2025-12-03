import { ObjectId } from "mongodb";
import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { getCollection } from "../services/database.service";
import type { ChatMessage } from "@common/types/chat";
import type { Session, SessionItem } from "@common/types/session";
import type { ChatSessionExport } from "@common/types/export";
import {AuthRequest} from "../middleware/auth.middleware";

const DEFAULT_CHAT_MODEL = process.env.OLLAMA_MODEL ?? "gemma3:270m";
const DEFAULT_CHAT_TEMPERATURE = 0.7;

export async function listSessions(req: AuthRequest, res: Response) {
  try {
    const sessions = getCollection<Session>("sessions");
    const docs = await sessions
      .find({
        userId: req.user!.id,
      }, { projection: { messages: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    const items: SessionItem[] = docs.map((d) => ({
      id: d._id.toString(),
      userId: d.userId,
      title: d.title,
      createdAt: d.createdAt,
    }));
    res.json({ sessions: items });
  } catch (e) {
    res.status(500).json({ error: "Failed to list sessions" });
  }
}

export async function createSession(
  req: AuthRequest,
  res: Response
) {
  try {
    const { title } = req.body as { title?: string };
    const sessions = getCollection<Session>("sessions");

    const doc: Omit<Session, "id"> = {
      title: title || "New chat",
      userId: req.user!.id,
      createdAt: new Date().toISOString(),
      messages: [] as ChatMessage[],
    };

    const r = await sessions.insertOne(doc as any);
    const resultSession: Session = {
      id: r.insertedId.toString(),
      ...doc,
    } as Session;
    res.status(201).json({ session: resultSession });
  } catch (e) {
    res.status(500).json({ error: "Failed to create session" });
  }
}

export async function getSession(req: Request, res: Response) {
  try {
    const sessions = getCollection<Session>("sessions");
    const raw = (await sessions.findOne({
      _id: new ObjectId(req.params.id),
    })) as any;

    if (!raw) return res.status(404).json({ error: "Session not found" });

    const session: Session = {
      id: raw._id.toString(),
      userId: raw.userId,
      title: raw.title,
      createdAt: raw.createdAt,
      messages: (raw.messages || []) as ChatMessage[],
    };
    res.status(200).json({ session });
  } catch (e) {
    res.status(500).json({ error: "Failed to get session" });
  }
}

export async function exportSession(req: AuthRequest, res: Response) {
  try {
    const sessions = getCollection<Session>("sessions");
    const raw = (await sessions.findOne({
      _id: new ObjectId(req.params.id),
      userId: req.user!.id,
    })) as any;

    if (!raw) return res.status(404).json({ error: "Session not found" });

    const payload: ChatSessionExport = {
      meta: {
        format: "pocketllm.chat",
        version: "1.0",
        exportedAt: new Date().toISOString(),
        sessionId: raw._id.toString(),
        title: raw.title,
        userId: raw.userId,
        model: DEFAULT_CHAT_MODEL,
        temperature: DEFAULT_CHAT_TEMPERATURE,
        createdAt: raw.createdAt,
      },
      messages: (raw.messages || []) as ChatMessage[],
    };

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(payload);
  } catch (e) {
    res.status(500).json({ error: "Failed to export session" });
  }
}

export async function importSession(req: AuthRequest, res: Response) {
  try {
    const body = req.body as ChatSessionExport;
    if (
      !body?.meta ||
      body.meta.format !== "pocketllm.chat" ||
      !Array.isArray(body.messages)
    ) {
      return res.status(400).json({ error: "Invalid import payload" });
    }

    const sessions = getCollection<Session>("sessions");
    const now = new Date().toISOString();
    const createdAt = body.meta.createdAt ?? now;
    const messages: ChatMessage[] = (body.messages || []).map((m) => ({
      id: m.id ?? randomUUID(),
      role: m.role,
      content: m.content,
      createdAt: m.createdAt ?? now,
    }));

    const title =
      body.meta.title ||
      `Imported chat ${new Date().toLocaleString()}`;

    const doc: Omit<Session, "id"> = {
      title,
      userId: req.user!.id,
      createdAt,
      messages,
    };

    const r = await sessions.insertOne(doc as any);
    const session: Session = {
      id: r.insertedId.toString(),
      ...doc,
    };

    res.status(201).json({ session });
  } catch (e) {
    res.status(500).json({ error: "Failed to import session" });
  }
}

export async function appendMessage(req: Request, res: Response) {
  try {
    const sessions = getCollection<Session>("sessions");

    const msg = req.body.message as ChatMessage | undefined;
    if (!msg || !msg.content || !msg.role) {
      return res.status(400).json({ error: "Invalid message payload" });
    }

    // ensure id and createdAt
    if (!msg.id) msg.id = randomUUID();
    if (!msg.createdAt) msg.createdAt = new Date().toISOString();

    await sessions.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $push: { messages: msg } }
    );

    res.status(200).json({ ok: true, messageId: msg.id });
  } catch (e) {
    res.status(500).json({ error: "Failed to append message" });
  }
}
