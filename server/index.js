import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = "mongodb+srv://testinguser:userpass123@crud-demo.ppqam7f.mongodb.net/?retryWrites=true&w=majority&appName=crud-demo";
const dbName = "voicetodoapp";

let db;
let todosCollection;
let aiusageCollection;

// Connect to MongoDB
MongoClient.connect(uri)
  .then((client) => {
    console.log('✅ Connected to MongoDB');
    db = client.db(dbName);
    todosCollection = db.collection('todos');
    aiusageCollection = db.collection('aiusage');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Static user credentials
const STATIC_USER = {
  userId: 'bijay',
  password: '7606938822' // In production, this should be hashed
};

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { userId, password } = req.body;
  
  if (userId === STATIC_USER.userId && password === STATIC_USER.password) {
    res.json({ success: true, userId: STATIC_USER.userId });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Todo routes
app.get('/api/todos/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const todos = await todosCollection.find({ userId }).sort({ createdAt: -1 }).toArray();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/todos', async (req, res) => {
  try {
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
    res.json({ ...newTodo, _id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/todos/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;
    await todosCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { completed } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/todos/:id/text', async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    await todosCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { text } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await todosCollection.deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/todos/:id/duedate', async (req, res) => {
  try {
    const { id } = req.params;
    const { dueDate } = req.body;
    await todosCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { dueDate } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/todos/:id/share', async (req, res) => {
  try {
    const { id } = req.params;
    await todosCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { shared: true } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Usage routes
app.post('/api/ai-usage', async (req, res) => {
  try {
    const { userId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    await aiusageCollection.updateOne(
      { userId, date: today },
      { $inc: { count: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true }
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ai-usage/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    const usage = await aiusageCollection.findOne({ userId, date: today });
    res.json({ dailyUsage: usage?.count || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
