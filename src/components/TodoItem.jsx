import React, { useState } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { cn } from '../lib/utils';

const TodoItem = ({ todo, onToggle, onDelete, onEdit, onShare, onSetDueDate, showCheckbox = true }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = () => {
    if (editText.trim()) {
      onEdit(todo.id, editText);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(todo.text);
    setIsEditing(false);
  };

  const handleShare = () => {
    const text = encodeURIComponent(todo.text);
    const url = `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
    onShare(todo.id);
  };

  const handleAddToGoogleCalendar = () => {
    const text = encodeURIComponent(todo.text);
    const startDate = todo.dueDate ? new Date(todo.dueDate) : new Date();
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later
    
    const formatCalendarDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${formatCalendarDate(startDate)}/${formatCalendarDate(endDate)}`;
    window.open(calendarUrl, '_blank');
  };

  const handleDateChange = (e) => {
    onSetDueDate(todo.id, e.target.value);
    setShowDatePicker(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const isOverdue = () => {
    if (!todo.dueDate || todo.completed) return false;
    return new Date(todo.dueDate) < new Date();
  };

  return (
    <div className={cn(
      "group border-b border-border last:border-0 p-4 hover:bg-muted/50 transition-all hover:shadow-sm",
      todo.completed && "bg-muted/30",
      isOverdue() && "bg-destructive/10"
    )}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 rounded border-input ring-offset-background focus:ring-2 focus:ring-ring cursor-pointer"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
        />
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-background"
                rows="3"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>
                  <i className="bi bi-check-lg"></i>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <i className="bi bi-x-lg"></i>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className={cn(
                "text-sm font-medium leading-relaxed break-words",
                todo.completed && "line-through text-muted-foreground"
              )}>
                {todo.text}
              </p>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <i className="bi bi-clock"></i>
                  {new Date(todo.createdAt).toLocaleString()}
                </span>
                {todo.dueDate && (
                  <span className={cn(
                    "flex items-center gap-1 font-medium",
                    isOverdue() && "text-destructive"
                  )}>
                    <i className="bi bi-calendar-event"></i>
                    Due: {formatDate(todo.dueDate)}
                    {isOverdue() && <i className="bi bi-exclamation-circle-fill"></i>}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {!isEditing && (
          <div className={cn(
            "flex gap-1 flex-shrink-0 transition-opacity",
            "opacity-100 md:opacity-0 md:group-hover:opacity-100"
          )}>
            {!todo.completed && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={handleAddToGoogleCalendar}
                  title="Add to Google Calendar"
                >
                  <i className="bi bi-calendar-plus"></i>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  title="Set Due Date"
                >
                  <i className="bi bi-calendar3"></i>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setIsEditing(true)}
                  title="Edit"
                >
                  <i className="bi bi-pencil"></i>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-green-600 hover:text-green-700"
                  onClick={handleShare}
                  title="Share on WhatsApp"
                >
                  <i className="bi bi-whatsapp"></i>
                </Button>
              </>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(todo.id)}
              title="Delete"
            >
              <i className="bi bi-trash"></i>
            </Button>
          </div>
        )}
      </div>

      {showDatePicker && (
        <div className="mt-3 pl-8">
          <input
            type="datetime-local"
            className="w-full sm:w-auto px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            value={todo.dueDate || ''}
            onChange={handleDateChange}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
      )}
    </div>
  );
};

export default TodoItem;
