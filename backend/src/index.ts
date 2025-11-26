import dotenv from "dotenv";
import { app } from "./app";
import { connectToMongo, closeMongo } from "./services/database.service";

dotenv.config();

const PORT = process.env.PORT || 8080;

async function start() {
  if (process.env.DB_CONN_STRING) {
    await connectToMongo();
  }

  const server = app.listen(PORT, () => {
    console.log(`Backend listening on ${PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down...`);
    server.close(() => {
      console.log("HTTP server closed");
    });
    try {
      await closeMongo();
      console.log("Mongo connection closed");
    } catch (err) {
      console.error("Error closing Mongo connection:", err);
    }
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start();