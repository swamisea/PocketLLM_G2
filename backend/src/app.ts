import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chat";
import sessionRoutes from "./routes/sessions";
import accountRoutes from "./routes/account";
import telemetryRoutes from "./routes/telemetry";
import adminRoutes from "./routes/admin";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/chat", chatRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/admin", adminRoutes)
