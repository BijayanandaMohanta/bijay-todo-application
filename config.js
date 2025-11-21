// Configuration file for deployment
export const config = {
  MONGODB_URI: 'mongodb+srv://testinguser:userpass123@crud-demo.ppqam7f.mongodb.net/?retryWrites=true&w=majority&appName=crud-demo',
  DB_NAME: 'voicetodoapp',
  // Detect if running on localhost or production
  API_BASE_URL: typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://bijay-todo-application.vercel.app/api'
};
