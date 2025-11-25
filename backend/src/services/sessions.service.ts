import { ObjectId } from "mongodb";
import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { getCollection } from "../db";
import type { ChatMessage } from "@common/types/chat";
import type { Session, SessionItem } from "@common/types/session";

export async function listSessions(req: Request, res: Response) {
  try {
    const sessions = getCollection<Session>("sessions");
    const docs = await sessions
      .find({}, { projection: { messages: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    const items: SessionItem[] = docs.map((d) => ({
      id: d._id.toString(),
      title: d.title,
      createdAt: d.createdAt,
    }));
    res.json({ sessions: items });
  } catch (e) {
    res.status(500).json({ error: "Failed to list sessions" });
  }
}

export async function createSession(
  req: Request<{}, {}, { title?: string }>,
  res: Response
) {
  try {
    const { title } = req.body;
    const sessions = getCollection<Session>("sessions");

    const doc: Omit<Session, "id"> = {
      title: title || "New chat",
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
      title: raw.title,
      createdAt: raw.createdAt,
      messages: (raw.messages || []) as ChatMessage[],
    };
    res.status(200).json({ session });
  } catch (e) {
    res.status(500).json({ error: "Failed to get session" });
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
