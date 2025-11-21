import { getCurrentUserId } from './auth';

const API_BASE = 'http://localhost:5000/api';

// Todos operations
export async function fetchTodos() {
  try {
    const userId = getCurrentUserId();
    console.log('Fetching todos for user:', userId);
    const response = await fetch(`${API_BASE}/todos/${userId}`);
    console.log('Response status:', response.status);
    if (!response.ok) throw new Error('Failed to fetch todos');
    const todos = await response.json();
    console.log('Fetched todos:', todos);
    // Transform MongoDB _id to id for frontend compatibility
    return todos.map(todo => ({ ...todo, id: todo._id }));
  } catch (error) {
    console.error('Error fetching todos:', error);
    return [];
  }
}

export async function addTodo(text, dueDate = null) {
  try {
    const userId = getCurrentUserId();
    const response = await fetch(`${API_BASE}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, text, dueDate }),
    });
    if (!response.ok) throw new Error('Failed to add todo');
    const newTodo = await response.json();
    return { ...newTodo, id: newTodo._id };
  } catch (error) {
    console.error('Error adding todo:', error);
    throw error;
  }
}

export async function updateTodoStatus(id, completed) {
  try {
    const response = await fetch(`${API_BASE}/todos/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    if (!response.ok) throw new Error('Failed to update todo status');
  } catch (error) {
    console.error('Error updating todo status:', error);
    throw error;
  }
}

export async function updateTodoText(id, text) {
  try {
    const response = await fetch(`${API_BASE}/todos/${id}/text`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error('Failed to update todo text');
  } catch (error) {
    console.error('Error updating todo text:', error);
    throw error;
  }
}

export async function deleteTodoDb(id) {
  try {
    const response = await fetch(`${API_BASE}/todos/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete todo');
  } catch (error) {
    console.error('Error deleting todo:', error);
    throw error;
  }
}

export async function updateTodoDueDate(id, dueDate) {
  try {
    const response = await fetch(`${API_BASE}/todos/${id}/duedate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dueDate }),
    });
    if (!response.ok) throw new Error('Failed to update due date');
  } catch (error) {
    console.error('Error updating due date:', error);
    throw error;
  }
}

export async function markTodoAsShared(id) {
  try {
    const response = await fetch(`${API_BASE}/todos/${id}/share`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error('Failed to mark as shared');
  } catch (error) {
    console.error('Error marking as shared:', error);
    throw error;
  }
}

// AI Usage tracking
export async function recordAIUsage() {
  try {
    const userId = getCurrentUserId();
    const response = await fetch(`${API_BASE}/ai-usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) throw new Error('Failed to record AI usage');
  } catch (error) {
    console.error('Error recording AI usage:', error);
  }
}

export async function getAIUsageStats() {
  try {
    const userId = getCurrentUserId();
    const response = await fetch(`${API_BASE}/ai-usage/${userId}`);
    if (!response.ok) throw new Error('Failed to get AI usage stats');
    const stats = await response.json();
    return {
      dailyUsage: stats.dailyUsage,
      minuteUsage: getMinuteUsage(),
    };
  } catch (error) {
    console.error('Error getting AI usage stats:', error);
    return { dailyUsage: 0, minuteUsage: 0 };
  }
}

// Minute-based rate limiting (client-side)
const MINUTE_LIMIT = 15;

export function incrementMinuteUsage() {
  const now = Date.now();
  const currentMinute = Math.floor(now / 60000);
  
  const stored = localStorage.getItem('aiUsageMinute');
  const data = stored ? JSON.parse(stored) : { minute: currentMinute, count: 0 };
  
  // Reset if new minute
  if (data.minute !== currentMinute) {
    data.minute = currentMinute;
    data.count = 0;
  }
  
  data.count++;
  localStorage.setItem('aiUsageMinute', JSON.stringify(data));
  
  if (data.count > MINUTE_LIMIT) {
    throw new Error(`Rate limit exceeded. Maximum ${MINUTE_LIMIT} requests per minute.`);
  }
  
  return data.count;
}

export function getMinuteUsage() {
  const now = Date.now();
  const currentMinute = Math.floor(now / 60000);
  
  const stored = localStorage.getItem('aiUsageMinute');
  if (!stored) return 0;
  
  const data = JSON.parse(stored);
  
  // Return 0 if it's a new minute
  if (data.minute !== currentMinute) {
    return 0;
  }
  
  return data.count || 0;
}
