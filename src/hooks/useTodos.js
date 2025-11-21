import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getTodosFromCookie, saveTodosToCookie } from '../utils/cookies';

/**
 * Custom hook for managing todos with cookie storage
 * @returns {Object} - Todo state and actions
 */
export const useTodos = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load todos from cookies on mount
  useEffect(() => {
    const loadedTodos = getTodosFromCookie();
    setTodos(loadedTodos);
    setLoading(false);
  }, []);

  // Save todos to cookies whenever they change
  useEffect(() => {
    if (!loading) {
      saveTodosToCookie(todos);
    }
  }, [todos, loading]);

  /**
   * Add a new todo
   * @param {string} text - Todo text
   * @param {string} dueDate - Optional due date
   */
  const addTodo = (text, dueDate = null) => {
    const newTodo = {
      id: uuidv4(),
      text: text.trim(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      dueDate: dueDate,
      shared: false
    };
    setTodos(prev => [newTodo, ...prev]);
    return newTodo;
  };

  /**
   * Update an existing todo
   * @param {string} id - Todo ID
   * @param {Object} updates - Fields to update
   */
  const updateTodo = (id, updates) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, ...updates } : todo
    ));
  };

  /**
   * Toggle todo completion status
   * @param {string} id - Todo ID
   */
  const toggleTodo = (id) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id 
        ? { ...todo, status: todo.status === 'pending' ? 'completed' : 'pending' }
        : todo
    ));
  };

  /**
   * Delete a todo
   * @param {string} id - Todo ID
   */
  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  /**
   * Edit todo text
   * @param {string} id - Todo ID
   * @param {string} newText - New todo text
   */
  const editTodo = (id, newText) => {
    updateTodo(id, { text: newText.trim() });
  };

  /**
   * Set due date for a todo
   * @param {string} id - Todo ID
   * @param {string} date - Due date
   */
  const setDueDate = (id, date) => {
    updateTodo(id, { dueDate: date });
  };

  /**
   * Mark todo as shared
   * @param {string} id - Todo ID
   */
  const markAsShared = (id) => {
    updateTodo(id, { shared: true });
  };

  /**
   * Check if a similar todo exists
   * @param {string} text - Todo text to check
   * @returns {boolean} - True if similar todo exists
   */
  const hasSimilarTodo = (text) => {
    const normalizedText = text.toLowerCase().trim();
    return todos.some(todo => 
      todo.text.toLowerCase().trim() === normalizedText ||
      todo.text.toLowerCase().includes(normalizedText) ||
      normalizedText.includes(todo.text.toLowerCase())
    );
  };

  /**
   * Get todos by status
   * @param {string} status - 'pending' or 'completed'
   * @returns {Array} - Filtered todos
   */
  const getTodosByStatus = (status) => {
    return todos.filter(todo => todo.status === status);
  };

  /**
   * Get todos by date
   * @param {string} date - Date in ISO format
   * @returns {Array} - Filtered todos
   */
  const getTodosByDate = (date) => {
    const targetDate = new Date(date).toISOString().split('T')[0];
    return todos.filter(todo => {
      if (!todo.dueDate) return false;
      const todoDate = new Date(todo.dueDate).toISOString().split('T')[0];
      return todoDate === targetDate;
    });
  };

  /**
   * Get today's todos
   * @returns {Array} - Today's todos
   */
  const getTodaysOdos = () => {
    const today = new Date().toISOString().split('T')[0];
    return getTodosByDate(today);
  };

  /**
   * Get statistics
   * @returns {Object} - Todo statistics
   */
  const getStats = () => {
    return {
      total: todos.length,
      pending: todos.filter(t => t.status === 'pending').length,
      completed: todos.filter(t => t.status === 'completed').length,
      todayTotal: getTodaysTodos().length
    };
  };

  /**
   * Get today's todos
   * @returns {Array} - Today's todos
   */
  const getTodaysTodos = () => {
    const today = new Date().toISOString().split('T')[0];
    return todos.filter(todo => {
      if (!todo.dueDate) return false;
      const todoDate = new Date(todo.dueDate).toISOString().split('T')[0];
      return todoDate === today;
    });
  };

  return {
    todos,
    loading,
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    setDueDate,
    markAsShared,
    hasSimilarTodo,
    getTodosByStatus,
    getTodosByDate,
    getTodaysTodos,
    getStats
  };
};
