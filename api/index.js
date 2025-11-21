import { MongoClient, ObjectId } from 'mongodb';

const uri = 'mongodb+srv://testinguser:userpass123@crud-demo.ppqam7f.mongodb.net/?retryWrites=true&w=majority&appName=crud-demo';
const dbName = 'voicetodoapp';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(uri);
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

// Static user credentials
const STATIC_USER = {
  userId: 'bijay',
  password: '7606938822'
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { db } = await connectToDatabase();
  const todosCollection = db.collection('todos');
  const aiusageCollection = db.collection('aiusage');

  const path = req.url.replace('/api', '');

  try {
    // Health check
    if (path === '/health') {
      res.status(200).json({ status: 'ok', message: 'API is running' });
      return;
    }

    // Auth routes
    if (path === '/auth/login' && req.method === 'POST') {
      const { userId, password } = req.body;
      if (userId === STATIC_USER.userId && password === STATIC_USER.password) {
        res.status(200).json({ success: true, userId: STATIC_USER.userId });
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      return;
    }

    // Get todos
    if (path.startsWith('/todos/') && !path.includes('/status') && !path.includes('/text') && !path.includes('/duedate') && !path.includes('/share') && req.method === 'GET') {
      const userId = path.split('/')[2];
      const todos = await todosCollection.find({ userId }).sort({ createdAt: -1 }).toArray();
      res.status(200).json(todos);
      return;
    }

    // Create todo
    if (path === '/todos' && req.method === 'POST') {
      const { userId, text, dueDate } = req.body;
      const newTodo = {
        userId,
        text,
        completed: false,
        dueDate: dueDate || null,
        shared: false,
        createdAt: new Date(),
      };
      const result = await todosCollection.insertOne(newTodo);
      res.status(200).json({ ...newTodo, _id: result.insertedId });
      return;
    }

    // Update todo status
    if (path.match(/\/todos\/[^/]+\/status$/) && req.method === 'PATCH') {
      const id = path.split('/')[2];
      const { completed } = req.body;
      await todosCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { completed } }
      );
      res.status(200).json({ success: true });
      return;
    }

    // Update todo text
    if (path.match(/\/todos\/[^/]+\/text$/) && req.method === 'PATCH') {
      const id = path.split('/')[2];
      const { text } = req.body;
      await todosCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { text } }
      );
      res.status(200).json({ success: true });
      return;
    }

    // Update todo due date
    if (path.match(/\/todos\/[^/]+\/duedate$/) && req.method === 'PATCH') {
      const id = path.split('/')[2];
      const { dueDate } = req.body;
      await todosCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { dueDate } }
      );
      res.status(200).json({ success: true });
      return;
    }

    // Share todo
    if (path.match(/\/todos\/[^/]+\/share$/) && req.method === 'PATCH') {
      const id = path.split('/')[2];
      await todosCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { shared: true } }
      );
      res.status(200).json({ success: true });
      return;
    }

    // Delete todo
    if (path.match(/\/todos\/[^/]+$/) && req.method === 'DELETE') {
      const id = path.split('/')[2];
      await todosCollection.deleteOne({ _id: new ObjectId(id) });
      res.status(200).json({ success: true });
      return;
    }

    // Record AI usage
    if (path === '/ai-usage' && req.method === 'POST') {
      const { userId } = req.body;
      const today = new Date().toISOString().split('T')[0];
      
      await aiusageCollection.updateOne(
        { userId, date: today },
        { $inc: { count: 1 }, $set: { updatedAt: new Date() } },
        { upsert: true }
      );
      
      res.status(200).json({ success: true });
      return;
    }

    // Get AI usage
    if (path.startsWith('/ai-usage/') && req.method === 'GET') {
      const userId = path.split('/')[2];
      const today = new Date().toISOString().split('T')[0];
      
      const usage = await aiusageCollection.findOne({ userId, date: today });
      res.status(200).json({ dailyUsage: usage?.count || 0 });
      return;
    }

    // 404
    res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
