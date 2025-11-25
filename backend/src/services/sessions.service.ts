import { ObjectId } from "mongodb";
import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { getCollection } from "../db";
import type { ChatMessage } from "../../../common/src/types/chat";

export async function listSessions(req: Request, res: Response) {
  try {
    const sessions = getCollection("sessions");
    const docs = await sessions
      .find({}, { projection: { messages: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      sessions: docs.map((d) => ({
        id: d._id.toString(),
        title: d.title,
        createdAt: d.createdAt,
      })),
    });
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
    const sessions = getCollection("sessions");

    const doc = {
      title: title || "New chat",
      createdAt: new Date().toISOString(),
      messages: [] as ChatMessage[],
    };

    const r = await sessions.insertOne(doc);
    res.status(201).json({ session: { id: r.insertedId.toString(), ...doc } });
  } catch (e) {
    res.status(500).json({ error: "Failed to create session" });
  }
}

export async function getSession(req: Request, res: Response) {
  try {
    const sessions = getCollection("sessions");
    const doc = await sessions.findOne({ _id: new ObjectId(req.params.id) });

    if (!doc) return res.status(404).json({ error: "Session not found" });

    doc.id = doc._id.toString();
    res.status(200).json({ session: doc });
  } catch (e) {
    res.status(500).json({ error: "Failed to get session" });
  }
}

export async function appendMessage(req: Request, res: Response) {
  try {
    const sessions = getCollection("sessions");

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
