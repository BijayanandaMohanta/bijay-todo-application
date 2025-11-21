import React, { useState } from 'react';
import TodoItem from './TodoItem';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const TodoList = ({ 
  todos, 
  onToggle, 
  onDelete, 
  onEdit, 
  onShare, 
  onSetDueDate 
}) => {
  const [filterDate, setFilterDate] = useState('');

  const pendingTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  const getFilteredTodos = (isCompleted) => {
    let filtered = todos.filter(todo => todo.completed === isCompleted);
    
    if (filterDate) {
      const targetDate = new Date(filterDate).toISOString().split('T')[0];
      filtered = filtered.filter(todo => {
        if (!todo.dueDate) return false;
        const todoDate = new Date(todo.dueDate).toISOString().split('T')[0];
        return todoDate === targetDate;
      });
    }
    
    return filtered;
  };

  return (
    <div className="h-full">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <i className="bi bi-list-task text-primary"></i>
          My Todos
        </h2>
        
        {/* Date Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <i className="bi bi-funnel"></i>
            Filter by Due Date
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              className="flex-1 px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            {filterDate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFilterDate('')}
              >
                <i className="bi bi-x-lg"></i>
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <div className="px-6 pt-4 border-b border-border">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="pending" className="flex-1 sm:flex-none gap-2">
              <i className="bi bi-hourglass-split"></i>
              Pending
              <Badge variant="secondary" className="ml-2">
                {getFilteredTodos(false).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 sm:flex-none gap-2">
              <i className="bi bi-check-circle"></i>
              Completed
              <Badge variant="secondary" className="ml-2">
                {getFilteredTodos(true).length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending" className="mt-0">
          {getFilteredTodos(false).length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <i className="bi bi-inbox text-3xl text-muted-foreground"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">No pending todos</h3>
              <p className="text-sm text-muted-foreground">
                {filterDate ? 'No todos found for this date' : 'Add a new todo to get started'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {getFilteredTodos(false).map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onShare={onShare}
                  onSetDueDate={onSetDueDate}
                  showCheckbox={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          {getFilteredTodos(true).length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <i className="bi bi-check-circle text-3xl text-muted-foreground"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">No completed todos</h3>
              <p className="text-sm text-muted-foreground">
                {filterDate ? 'No completed todos for this date' : 'Complete some todos to see them here'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {getFilteredTodos(true).map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onShare={onShare}
                  onSetDueDate={onSetDueDate}
                  showCheckbox={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TodoList;
