// Configuration file for deployment
export const config = {
  MONGODB_URI: 'mongodb+srv://testinguser:userpass123@crud-demo.ppqam7f.mongodb.net/?retryWrites=true&w=majority&appName=crud-demo',
  DB_NAME: 'voicetodoapp',
  API_BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://bijay-todo-application.vercel.app/api' 
    : 'http://localhost:5000/api'
};
