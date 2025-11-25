import { MongoClient, Db, Collection, Document } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToMongo(uri: string) {
  if (db) return db;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  console.log("Connected to MongoDB");
  return db;
}

export function getDb(): Db {
  if (!db) throw new Error("MongoDB not connected");
  return db;
}

export function getCollection<T extends Document>(name: string): Collection<T> {
  return getDb().collection<T>(name);
}

export async function closeMongo() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
