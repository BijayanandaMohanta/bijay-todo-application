import { MongoClient } from 'mongodb';

const uri = import.meta.env.VITE_MONGODB_URI;
const dbName = import.meta.env.VITE_DB_NAME || 'voicetodoapp';

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

// Collections: todos, aiusage
export async function getTodosCollection() {
  const { db } = await connectToDatabase();
  return db.collection('todos');
}

export async function getAIUsageCollection() {
  const { db } = await connectToDatabase();
  return db.collection('aiusage');
}
