import { getTodosCollection, getAIUsageCollection } from './mongodb';
import { getCurrentUserId } from './auth';
import { ObjectId } from 'mongodb';

// Todos operations
export async function fetchTodos() {
  try {
    const collection = await getTodosCollection();
    const userId = getCurrentUserId();
    const todos = await collection.find({ userId }).sort({ createdAt: -1 }).toArray();
    return todos;
  } catch (error) {
    console.error('Error fetching todos:', error);
    return [];
  }
}

export async function addTodo(text, dueDate = null) {
  try {
    const collection = await getTodosCollection();
    const userId = getCurrentUserId();
    
    const newTodo = {
      userId,
      text,
      status: 'pending',
      dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      shared: false,
    };
    
    const result = await collection.insertOne(newTodo);
    return { ...newTodo, _id: result.insertedId, id: result.insertedId.toString() };
  } catch (error) {
    console.error('Error adding todo:', error);
    throw error;
  }
}

export async function updateTodoStatus(id, status) {
  try {
    const collection = await getTodosCollection();
    const userId = getCurrentUserId();
    
    await collection.updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { status, updatedAt: new Date() } }
    );
  } catch (error) {
    console.error('Error updating todo status:', error);
    throw error;
  }
}

export async function updateTodoText(id, text) {
  try {
    const collection = await getTodosCollection();
    const userId = getCurrentUserId();
    
    await collection.updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { text, updatedAt: new Date() } }
    );
  } catch (error) {
    console.error('Error updating todo text:', error);
    throw error;
  }
}

export async function deleteTodo(id) {
  try {
    const collection = await getTodosCollection();
    const userId = getCurrentUserId();
    
    await collection.deleteOne({ _id: new ObjectId(id), userId });
  } catch (error) {
    console.error('Error deleting todo:', error);
    throw error;
  }
}

export async function updateTodoDueDate(id, dueDate) {
  try {
    const collection = await getTodosCollection();
    const userId = getCurrentUserId();
    
    await collection.updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { dueDate, updatedAt: new Date() } }
    );
  } catch (error) {
    console.error('Error updating due date:', error);
    throw error;
  }
}

export async function markTodoAsShared(id) {
  try {
    const collection = await getTodosCollection();
    const userId = getCurrentUserId();
    
    await collection.updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { shared: true, updatedAt: new Date() } }
    );
  } catch (error) {
    console.error('Error marking as shared:', error);
    throw error;
  }
}

// AI Usage tracking
export async function recordAIUsage() {
  try {
    const collection = await getAIUsageCollection();
    const userId = getCurrentUserId();
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Increment daily count
    await collection.updateOne(
      { userId, date: today },
      { 
        $inc: { count: 1 },
        $set: { updatedAt: now }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error recording AI usage:', error);
  }
}

export async function getAIUsageStats() {
  try {
    const collection = await getAIUsageCollection();
    const userId = getCurrentUserId();
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    // Get today's total
    const todayUsage = await collection.findOne({ userId, date: today });
    const dailyCount = todayUsage?.count || 0;
    
    // Get last minute count (we'll need to track timestamps separately for this)
    // For now, we'll use a simple counter in localStorage
    const minuteCount = getMinuteUsageCount();
    
    return {
      minuteUsage: `${minuteCount}/10`,
      dailyUsage: `${dailyCount}/1000`
    };
  } catch (error) {
    console.error('Error getting AI usage stats:', error);
    return { minuteUsage: '0/10', dailyUsage: '0/1000' };
  }
}

// Helper for minute-based rate limiting (in-memory/localStorage)
function getMinuteUsageCount() {
  const key = 'aiUsageMinute';
  const data = localStorage.getItem(key);
  
  if (!data) return 0;
  
  const { count, timestamp } = JSON.parse(data);
  const now = Date.now();
  
  // Reset if more than a minute has passed
  if (now - timestamp > 60000) {
    return 0;
  }
  
  return count;
}

export function incrementMinuteUsage() {
  const key = 'aiUsageMinute';
  const data = localStorage.getItem(key);
  const now = Date.now();
  
  if (!data) {
    localStorage.setItem(key, JSON.stringify({ count: 1, timestamp: now }));
    return 1;
  }
  
  const { count, timestamp } = JSON.parse(data);
  
  // Reset if more than a minute has passed
  if (now - timestamp > 60000) {
    localStorage.setItem(key, JSON.stringify({ count: 1, timestamp: now }));
    return 1;
  }
  
  const newCount = count + 1;
  localStorage.setItem(key, JSON.stringify({ count: newCount, timestamp }));
  return newCount;
}
