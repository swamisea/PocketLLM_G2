import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chat";
import sessionRoutes from "./routes/sessions";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/chat", chatRoutes);
app.use("/api/sessions", sessionRoutes);
