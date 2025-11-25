import dotenv from "dotenv";
import * as mongoDB from "mongodb";

dotenv.config()

const DB_CONN = process.env.DB_CONN_STRING || ""
const POCKETLLM_DB = process.env.DB_NAME || ""
//console.log("DB_CONN: ",DB_CONN)
//console.log("POCKETLLM_DB: ",POCKETLLM_DB)
//console.log("USER_DETAILS_COLLECTION_NAME: ",process.env.USER_DETAILS_COLLECTION_NAME)
export const collections: Record<string, mongoDB.Collection> = {}
const collectionNames: string[] = [
    process.env.USER_DETAILS_COLLECTION_NAME || ""
]

export class DatabaseService {
    private client: mongoDB.MongoClient | null = null;
    private db: mongoDB.Db | null = null;
    private dbConnected: boolean = false;

    constructor() {
        this.client = new mongoDB.MongoClient(DB_CONN);

        this.db = this.client.db(POCKETLLM_DB);
    }

    async initialize() {
        if (!this.dbConnected) {
            if (this.client) {
                try {
                    await this.client.connect();
                    this.db = this.client.db(POCKETLLM_DB);
                    this.dbConnected = true;
                    console.log(`Successfully connected to database: ${this.db.databaseName}`);
                }
                catch (e: unknown) {
                    if (e instanceof Error) {
                        console.error("Error sonnecting to MongoDB client: ", e.message);
                    }
                }

            }
        }
    }

    async connectToCollections() {
        if (!this.dbConnected) {
            await this.initialize()
        }
        if (!this.db) {
            throw new Error("Database not initialized")
        }
        else {
            const db = this.db
            collectionNames.forEach(name => {
                const collection = db.collection(name);
                collections[name] = collection;
                console.log(`Successfully connected to collection: ${name}`);
            })
            await this.setupIndexes();
        }
    }

    private async setupIndexes() {
        try {
            const userDetailsCollectionName = process.env.USER_DETAILS_COLLECTION_NAME || "";

            if (collections[userDetailsCollectionName]) {
                // Create unique index on email field
                await collections[userDetailsCollectionName].createIndex(
                    { email: 1 },
                    { unique: true }
                );
                console.log(`Created unique index on email for ${userDetailsCollectionName}`);
            }
        } catch (e: unknown) {
            if (e instanceof Error) {
                console.error("Error setting up indexes:", e.message);
            }
        }
    }
}

export const databaseService = new DatabaseService();