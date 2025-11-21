import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import { isAuthenticated, logout, getCurrentUserId } from './utils/auth';
import { fetchTodos, addTodo as addTodoDb, updateTodoStatus, updateTodoText, deleteTodoDb, updateTodoDueDate, markTodoAsShared, recordAIUsage, getAIUsageStats, incrementMinuteUsage } from './utils/todoService';
import VoiceInput from './components/VoiceInput';
import TodoList from './components/TodoList';
import CalendarPanel from './components/CalendarPanel';
import { improveTodoWithAI } from './utils/puterAI';
import { parseDateTimeFromText, formatDateForInput, formatTimeForInput, getCurrentDateTime } from './utils/dateParser';
import { cn } from './lib/utils';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [pendingTodoText, setPendingTodoText] = useState('');
  const [apiUsage, setApiUsage] = useState({ minuteUsage: '0/10', dailyUsage: '0/1000' });
  const [todoDate, setTodoDate] = useState('');
  const [todoTime, setTodoTime] = useState('');
  const [detectedDateTime, setDetectedDateTime] = useState(null);
  const [showContextModal, setShowContextModal] = useState(false);
  const [contextQuestion, setContextQuestion] = useState('');
  const [contextAnswer, setContextAnswer] = useState('');
  const [originalTextForContext, setOriginalTextForContext] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      console.log('Checking authentication...');
      if (isAuthenticated()) {
        console.log('User is authenticated');
        setAuthenticated(true);
        await loadTodos();
        await updateAPIUsage();
      } else {
        console.log('User is not authenticated');
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Initialize with current date and time
  useEffect(() => {
    const current = getCurrentDateTime();
    setTodoDate(current.date);
    setTodoTime(current.time);
  }, []);

  // Apply dark mode to document root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const loadTodos = async () => {
    try {
      const fetchedTodos = await fetchTodos();
      setTodos(fetchedTodos.map(t => ({
        ...t,
        id: t.id || t._id,
      })));
    } catch (error) {
      console.error('Error loading todos:', error);
      toast.error('Failed to load todos. Check if backend server is running.', {
        duration: 5000,
        position: 'bottom-center',
      });
    }
  };

  const updateAPIUsage = async () => {
    const usage = await getAIUsageStats();
    setApiUsage(usage);
  };

  const handleLogin = async (userId) => {
    console.log('Login successful, userId:', userId);
    setAuthenticated(true);
    await loadTodos();
    await updateAPIUsage();
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setTodos([]);
  };

  const addTodo = async (text, dueDateTime = null) => {
    console.log('addTodo called with:', { text, dueDateTime });
    try {
      const newTodo = await addTodoDb(text, dueDateTime);
      console.log('New todo created:', newTodo);
      setTodos(prev => {
        const updated = [newTodo, ...prev];
        console.log('Updated todos:', updated);
        return updated;
      });
      toast.success('Todo added successfully!', {
        duration: 2000,
        position: 'bottom-center',
      });
    } catch (error) {
      console.error('Error adding todo:', error);
      toast.error('Failed to add todo: ' + error.message, {
        duration: 4000,
        position: 'bottom-center',
      });
    }
  };

  const toggleTodo = async (id) => {
    const todo = todos.find(t => t.id === id);
    const newCompleted = !todo.completed;
    try {
      await updateTodoStatus(id, newCompleted);
      setTodos(prev => prev.map(t => 
        t.id === id ? { ...t, completed: newCompleted } : t
      ));
      toast.success(newCompleted ? 'Todo completed!' : 'Todo reopened', {
        duration: 1500,
        position: 'bottom-center',
      });
    } catch (error) {
      console.error('Error toggling todo:', error);
      toast.error('Failed to update todo', {
        duration: 3000,
        position: 'bottom-center',
      });
    }
  };

  const deleteTodoHandler = async (id) => {
    try {
      await deleteTodoDb(id);
      setTodos(prev => prev.filter(t => t.id !== id));
      toast.success('Todo deleted', {
        duration: 2000,
        position: 'bottom-center',
      });
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast.error('Failed to delete todo', {
        duration: 3000,
        position: 'bottom-center',
      });
    }
  };

  const editTodo = async (id, newText) => {
    try {
      await updateTodoText(id, newText);
      setTodos(prev => prev.map(t => 
        t.id === id ? { ...t, text: newText } : t
      ));
    } catch (error) {
      console.error('Error editing todo:', error);
    }
  };

  const setDueDate = async (id, dueDateTime) => {
    try {
      await updateTodoDueDate(id, dueDateTime);
      setTodos(prev => prev.map(t => 
        t.id === id ? { ...t, dueDate: dueDateTime } : t
      ));
    } catch (error) {
      console.error('Error setting due date:', error);
    }
  };

  const markAsShared = async (id) => {
    try {
      await markTodoAsShared(id);
      setTodos(prev => prev.map(t => 
        t.id === id ? { ...t, shared: true } : t
      ));
    } catch (error) {
      console.error('Error marking as shared:', error);
    }
  };

  const hasSimilarTodo = (text) => {
    return todos.some(todo => 
      todo.text.toLowerCase().includes(text.toLowerCase().substring(0, 20)) ||
      text.toLowerCase().includes(todo.text.toLowerCase().substring(0, 20))
    );
  };

  const handleTranscriptComplete = async (transcribedText) => {
    console.log('Transcript received:', transcribedText);
    
    const textarea = document.getElementById('manualTodoInput');
    
    // Show loading state
    if (textarea) {
      textarea.value = 'Processing voice input...';
      textarea.disabled = true;
    }

    try {
      console.log('Refining transcribed text with Gemini...');
      incrementMinuteUsage();
      await recordAIUsage();
      
      // Refine the transcribed text: remove duplicates, fix grammar, make it clear
      const refinedPrompt = `Clean up this voice transcription by removing duplicates, fixing grammar, and making it a clear todo task. Remove any meaningless repetitions or filler words. Keep it concise (1-2 sentences): "${transcribedText}"`;
      
      const refinedText = await improveTodoWithAI(refinedPrompt);
      console.log('Refined text:', refinedText);
      
      if (textarea) {
        textarea.value = refinedText;
        textarea.disabled = false;
        textarea.focus();
        
        // Visual feedback
        textarea.style.backgroundColor = '#dbeafe';
        setTimeout(() => {
          textarea.style.backgroundColor = '';
        }, 1500);
      }
      
      // Parse date/time from refined text
      const parsed = parseDateTimeFromText(refinedText);
      if (parsed.date) {
        setTodoDate(formatDateForInput(parsed.date));
      }
      if (parsed.time) {
        setTodoTime(parsed.time);
      }
      if (parsed.foundKeywords.length > 0) {
        setDetectedDateTime({
          keywords: parsed.foundKeywords,
          date: parsed.date,
          time: parsed.time
        });
      }
      
      await updateAPIUsage();
    } catch (error) {
      console.error('Error refining text:', error);
      // Fallback to original transcription
      if (textarea) {
        textarea.value = transcribedText;
        textarea.disabled = false;
        textarea.focus();
      }
      
      if (error.message.includes('Rate limit') || error.message.includes('Daily limit')) {
        toast.error(error.message);
      }
    }
  };

  const handleDateSelect = (date) => {
    setTodoDate(formatDateForInput(date));
  };

  const handleImproveTodo = async () => {
    const input = document.getElementById('manualTodoInput');
    const text = input.value.trim();
    
    if (text) {
      // Show context modal to ask user for more details
      setOriginalTextForContext(text);
      setContextQuestion('What is this about? (e.g., meeting location, task details, etc.)');
      setContextAnswer('');
      setShowContextModal(true);
    }
  };

  const handleContextSubmit = async () => {
    setShowContextModal(false);
    const textarea = document.getElementById('manualTodoInput');
    
    if (!textarea) return;
    
    try {
      incrementMinuteUsage();
      await recordAIUsage();
      
      const improved = await improveTodoWithAI(originalTextForContext, contextAnswer);
      console.log('AI improved with context:', improved);
      
      textarea.value = improved;
      
      // Parse date/time from improved text
      const parsed = parseDateTimeFromText(improved);
      if (parsed.date) setTodoDate(formatDateForInput(parsed.date));
      if (parsed.time) setTodoTime(parsed.time);
      if (parsed.foundKeywords.length > 0) {
        setDetectedDateTime({ keywords: parsed.foundKeywords, date: parsed.date, time: parsed.time });
      }
      
      await updateAPIUsage();
      
      // Visual feedback
      textarea.style.backgroundColor = '#dbeafe';
      setTimeout(() => {
        textarea.style.backgroundColor = '';
      }, 1500);
      
    } catch (error) {
      console.error('Error improving text:', error);
      if (error.message.includes('Rate limit') || error.message.includes('Daily limit')) {
        alert(error.message);
      }
    } finally {
      setOriginalTextForContext('');
      setContextAnswer('');
    }
  };

  const handleAddManualTodo = (e) => {
    e.preventDefault();
    console.log('handleAddManualTodo triggered');
    const input = e.target.elements.manualTodo;
    const text = input.value.trim();
    console.log('Input text:', text);
    
    if (text) {
      // Combine date and time
      const dueDateTime = todoDate && todoTime ? `${todoDate}T${todoTime}` : (todoDate || null);
      console.log('Due date time:', dueDateTime);
      
      if (hasSimilarTodo(text)) {
        if (window.confirm('A similar todo already exists. Add anyway?')) {
          addTodo(text, dueDateTime);
          input.value = '';
          // Reset to current date/time
          const current = getCurrentDateTime();
          setTodoDate(current.date);
          setTodoTime(current.time);
          setDetectedDateTime(null);
        }
      } else {
        addTodo(text, dueDateTime);
        input.value = '';
        // Reset to current date/time
        const current = getCurrentDateTime();
        setTodoDate(current.date);
        setTodoTime(current.time);
        setDetectedDateTime(null);
      }
    } else {
      console.log('No text to add');
    }
  };

  // Show login screen if not authenticated
  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Toaster />
      {/* Header */}
      <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-b border-border/50 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4 max-w-7xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="bg-primary text-primary-foreground w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="bi bi-mic-fill text-lg sm:text-xl"></i>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">Voice Todo App</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Powered by Google Gemini AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm flex-shrink-0">
              <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
                <i className="bi bi-bar-chart-fill"></i>
                <span>{apiUsage.dailyUsage}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <i className="bi bi-clock-fill"></i>
                <span className="hidden sm:inline">/min: </span>
                <span>{apiUsage.minuteUsage}</span>
              </div>
              
              {/* Dark Mode Toggle Switch */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                style={{ backgroundColor: darkMode ? 'hsl(221.2 83.2% 53.3%)' : 'hsl(214.3 31.8% 91.4%)' }}
                aria-label="Toggle dark mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                >
                  {darkMode ? (
                    <i className="bi bi-moon-fill text-xs text-primary flex items-center justify-center h-full"></i>
                  ) : (
                    <i className="bi bi-sun-fill text-xs text-amber-500 flex items-center justify-center h-full"></i>
                  )}
                </span>
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              >
                <i className="bi bi-box-arrow-right"></i>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Todo Input & List */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Voice Input Card */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-border/50 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <i className="bi bi-mic text-primary"></i>
                Voice Input
              </h2>
              <VoiceInput onTranscriptComplete={handleTranscriptComplete} />
            </div>

            {/* Manual Input Card */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-border/50 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <i className="bi bi-keyboard text-primary"></i>
                Add Todo
              </h2>
              
              <form onSubmit={handleAddManualTodo} className="space-y-3 sm:space-y-4">
                <textarea
                  id="manualTodoInput"
                  name="manualTodo"
                  rows="3"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-background transition-colors"
                  placeholder="Type your todo or use voice above..."
                  onChange={(e) => {
                    const parsed = parseDateTimeFromText(e.target.value);
                    if (parsed.date) setTodoDate(formatDateForInput(parsed.date));
                    if (parsed.time) setTodoTime(parsed.time);
                    if (parsed.foundKeywords.length > 0) {
                      setDetectedDateTime({ keywords: parsed.foundKeywords, date: parsed.date, time: parsed.time });
                    } else {
                      setDetectedDateTime(null);
                    }
                  }}
                />

                {/* Date Time Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <i className="bi bi-calendar3"></i>
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={todoDate}
                      onChange={(e) => setTodoDate(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <i className="bi bi-clock"></i>
                      Due Time
                    </label>
                    <input
                      type="time"
                      value={todoTime}
                      onChange={(e) => setTodoTime(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                    />
                  </div>
                </div>

                {/* Detection Alert */}
                {detectedDateTime && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <i className="bi bi-lightbulb-fill text-blue-600 dark:text-blue-400 text-lg mt-0.5 flex-shrink-0"></i>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Auto-detected date/time</p>
                        <div className="space-y-1">
                          <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                            <i className="bi bi-tags-fill flex-shrink-0"></i>
                            <span className="truncate">Keywords: {detectedDateTime.keywords.join(', ')}</span>
                          </p>
                          {detectedDateTime.date && (
                            <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                              <i className="bi bi-calendar-event flex-shrink-0"></i>
                              <span>{detectedDateTime.date.toLocaleDateString()}</span>
                            </p>
                          )}
                          {detectedDateTime.time && (
                            <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                              <i className="bi bi-clock flex-shrink-0"></i>
                              <span>{detectedDateTime.time}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirmation Alert */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <i className="bi bi-check-circle-fill text-amber-600 dark:text-amber-400 text-lg mt-0.5 flex-shrink-0"></i>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">Scheduled for</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                        <i className="bi bi-calendar-check flex-shrink-0"></i>
                        <span>{todoDate} at {todoTime}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  type="submit"
                  className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <i className="bi bi-plus-lg"></i>
                  Add Todo
                </button>
              </form>
            </div>

            {/* Todo List Card */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-border/50 overflow-hidden">
              <TodoList
                todos={todos}
                onToggle={toggleTodo}
                onDelete={deleteTodoHandler}
                onEdit={editTodo}
                onShare={markAsShared}
                onSetDueDate={setDueDate}
              />
            </div>
          </div>

          {/* Right Column - Calendar & Stats */}
          <div className="space-y-4 sm:space-y-6">
            <CalendarPanel
              todos={todos}
              onDateSelect={handleDateSelect}
            />
          </div>
        </div>
      </div>

      {/* Context Modal */}
      {showContextModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <i className="bi bi-stars text-primary"></i>
                AI Context
              </h3>
              <button
                onClick={() => setShowContextModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Your todo:</strong> {originalTextForContext}
            </p>
            <label className="block text-sm font-medium mb-2">{contextQuestion}</label>
            <textarea
              value={contextAnswer}
              onChange={(e) => setContextAnswer(e.target.value)}
              rows="3"
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-4"
              placeholder="e.g., 'Client meeting at downtown office'"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowContextModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleContextSubmit}
                disabled={!contextAnswer.trim()}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Improve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
