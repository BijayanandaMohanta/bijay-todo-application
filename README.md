# Voice Todo App 🎤

A modern React application with voice-to-text todo management, AI-powered task improvement, and smart calendar integration.

## Features ✨

- **Voice Input**: Use speech recognition to create todos hands-free
- **AI Enhancement**: Automatically improve todo descriptions using Puter.js AI
- **Cookie Storage**: All data persists locally for 20 days
- **Calendar Integration**: View and filter todos by date
- **WhatsApp Sharing**: Share todos directly to WhatsApp
- **Smart Duplicate Detection**: Warns about similar existing tasks
- **Complete Todo Management**: Add, edit, delete, mark complete, set due dates
- **Responsive UI**: Beautiful Bootstrap-based interface

## Tech Stack 🛠️

- React 18 with Vite
- JavaScript (ES6+)
- Puter.js (AI integration)
- Bootstrap 5
- React Speech Recognition
- React Calendar
- React Icons
- Cookie-based storage

## Installation 📦

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Project Structure 📁

```
src/
├── components/
│   ├── TodoList.jsx          # Main todo list with tabs
│   ├── TodoItem.jsx           # Individual todo item
│   ├── VoiceInput.jsx         # Voice recognition component
│   ├── CalendarPanel.jsx      # Calendar and summary panel
│   └── AIConfirmModal.jsx     # AI improvement confirmation
├── hooks/
│   └── useTodos.js            # Custom hook for todo management
├── utils/
│   ├── cookies.js             # Cookie helper functions
│   └── puterAI.js             # Puter.js AI integration
├── App.jsx                     # Main application
├── App.css                     # Styles
└── main.jsx                    # Entry point
```

## Usage 🚀

### Voice Input
1. Click the microphone button
2. Speak your todo task
3. AI will improve the description
4. Confirm or edit before adding

### Manual Input
- Type directly in the input field
- Press "Add Todo" button

### Todo Management
- ✅ Check to mark complete
- ✏️ Edit button to modify text
- 📅 Calendar button to set due date
- 📱 WhatsApp button to share
- 🗑️ Delete button to remove

### Calendar Features
- View all todos with due dates
- Filter todos by selected date
- See today's todos at a glance
- Visual indicators for pending/completed tasks

## Browser Compatibility 🌐

Speech recognition requires:
- Chrome (recommended)
- Edge
- Safari

## Data Storage 💾

All todos are stored in browser cookies with:
- 20-day expiration
- Automatic save on every change
- No server required

## License 📄

MIT License - feel free to use for personal or commercial projects

## Author 👨‍💻

Built with ❤️ using GitHub Copilot
