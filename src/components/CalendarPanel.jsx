import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

const CalendarPanel = ({ todos, onDateSelect }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [modalTodos, setModalTodos] = useState([]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    onDateSelect(date);
  };

  const getTodosForDate = (date) => {
    const targetDate = date.toISOString().split('T')[0];
    return todos.filter(todo => {
      if (!todo.dueDate) return false;
      const todoDate = new Date(todo.dueDate).toISOString().split('T')[0];
      return todoDate === targetDate;
    });
  };

  const handleTileClick = (date) => {
    const todosForDate = getTodosForDate(date);
    if (todosForDate.length > 0) {
      setModalDate(date);
      setModalTodos(todosForDate);
      setShowDateModal(true);
    }
  };

  const getTodaysTodos = () => {
    return getTodosForDate(new Date());
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const todosForDate = getTodosForDate(date);
      if (todosForDate.length > 0) {
        const pendingCount = todosForDate.filter(t => !t.completed).length;
        const completedCount = todosForDate.filter(t => t.completed).length;
        return (
          <div className="flex items-center justify-center gap-1 mt-1">
            {pendingCount > 0 && (
              <Badge variant="default" className="h-5 px-1.5 text-xs">
                {pendingCount}
              </Badge>
            )}
            {completedCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {completedCount}
              </Badge>
            )}
          </div>
        );
      }
    }
    return null;
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const todosForDate = getTodosForDate(date);
      if (todosForDate.length > 0) {
        return 'has-todos cursor-pointer hover:bg-accent/50';
      }
    }
    return null;
  };

  const todaysTodos = getTodaysTodos();
  const stats = {
    total: todos.length,
    pending: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
  };

  return (
    <>
      <div className="space-y-6">
        {/* Calendar Card */}
        <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg shadow-md hover:shadow-lg transition-shadow border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <i className="bi bi-calendar3 text-primary"></i>
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="calendar-wrapper">
              <Calendar
                onChange={handleDateChange}
                value={selectedDate}
                tileClassName={tileClassName}
                tileContent={tileContent}
                onClickDay={handleTileClick}
                className="rounded-lg border-0 w-full"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
              <i className="bi bi-info-circle"></i>
              Click on dates with badges to view todos
            </p>
          </CardContent>
        </Card>

        {/* Today's Todos Card */}
        <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg shadow-md hover:shadow-lg transition-shadow border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <i className="bi bi-sun text-amber-500"></i>
                Today's Todos
              </span>
              <Badge variant="secondary">{todaysTodos.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaysTodos.length === 0 ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                  <i className="bi bi-check-circle text-2xl text-muted-foreground"></i>
                </div>
                <p className="text-sm text-muted-foreground">No todos for today</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {todaysTodos.map(todo => (
                  <div
                    key={todo.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all shadow-sm hover:shadow-md",
                      todo.completed 
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                        : "border-border hover:border-primary/50 bg-white dark:bg-gray-700"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <i className={cn(
                        "text-sm mt-0.5",
                        todo.completed ? "bi bi-check-circle-fill text-green-600 dark:text-green-400" : "bi bi-circle text-muted-foreground"
                      )}></i>
                      <p className={cn(
                        "text-sm",
                        todo.completed && "line-through text-muted-foreground"
                      )}>
                        {todo.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <i className="bi bi-graph-up text-primary"></i>
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-sm font-medium flex items-center gap-2">
                  <i className="bi bi-list-ul text-primary"></i>
                  Total
                </span>
                <Badge variant="outline" className="text-base font-bold">
                  {stats.total}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-sm font-medium flex items-center gap-2">
                  <i className="bi bi-hourglass-split text-amber-600 dark:text-amber-400"></i>
                  Pending
                </span>
                <Badge className="bg-amber-500 hover:bg-amber-600 text-base font-bold">
                  {stats.pending}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/30 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-sm font-medium flex items-center gap-2">
                  <i className="bi bi-check-circle-fill text-green-600 dark:text-green-400"></i>
                  Completed
                </span>
                <Badge className="bg-green-600 hover:bg-green-700 text-base font-bold">
                  {stats.completed}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Modal */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDateModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-border/30 max-w-md w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <i className="bi bi-calendar-day text-primary"></i>
                  {modalDate?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {modalTodos.length} {modalTodos.length === 1 ? 'todo' : 'todos'}
                </p>
              </div>
              <button
                onClick={() => setShowDateModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <i className="bi bi-x-lg text-xl"></i>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              <div className="space-y-3">
                {modalTodos.map(todo => (
                  <div
                    key={todo.id}
                    className={cn(
                      "p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow",
                      todo.completed ? "bg-green-50/50 border-green-200" : "bg-white border-border"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <i className={cn(
                        "text-lg mt-0.5",
                        todo.completed ? "bi bi-check-circle-fill text-green-600" : "bi bi-circle text-amber-600"
                      )}></i>
                      <div className="flex-1">
                        <p className={cn(
                          "text-sm font-medium",
                          todo.completed && "line-through text-muted-foreground"
                        )}>
                          {todo.text}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={todo.completed ? 'secondary' : 'default'} className="text-xs">
                            {todo.completed ? 'completed' : 'pending'}
                          </Badge>
                          {todo.dueDate && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <i className="bi bi-clock"></i>
                              {new Date(todo.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .calendar-wrapper :global(.react-calendar) {
          border: none;
          font-family: inherit;
          background: transparent;
        }
        .calendar-wrapper :global(.react-calendar__month-view__days) {
          gap: 4px;
        }
        .calendar-wrapper :global(.react-calendar__tile) {
          padding: 0.75rem 0.5rem;
          position: relative;
          height: auto;
          min-height: 60px;
          border-radius: 0.5rem;
          margin: 2px;
          transition: all 0.2s ease;
        }
        .calendar-wrapper :global(.react-calendar__tile:hover) {
          background: hsl(var(--accent));
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }
        .calendar-wrapper :global(.react-calendar__tile--active) {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border: 2px solid hsl(var(--primary));
        }
        .calendar-wrapper :global(.react-calendar__tile--now) {
          background: hsl(var(--accent));
          border: 2px solid hsl(var(--primary));
          box-shadow: 0 0 0 2px hsl(var(--primary) / 0.1);
          font-weight: 600;
        }
        .calendar-wrapper :global(.react-calendar__navigation button) {
          font-size: 1rem;
          font-weight: 600;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }
        .calendar-wrapper :global(.react-calendar__navigation button:hover) {
          background: hsl(var(--accent));
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .calendar-wrapper :global(.react-calendar__month-view__days__day--weekend) {
          color: hsl(var(--destructive));
        }
      `}</style>
    </>
  );
};

export default CalendarPanel;
