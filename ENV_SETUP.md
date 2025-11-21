# Environment Variables Setup

## Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your MongoDB credentials:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   DB_NAME=voicetodoapp
   ```

## Vercel Deployment

Add environment variables in your Vercel project:

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on **Settings** → **Environment Variables**
3. Add the following variables:

   | Name | Value |
   |------|-------|
   | `MONGODB_URI` | Your MongoDB connection string |
   | `DB_NAME` | `voicetodoapp` |

4. Select environments: **Production**, **Preview**, and **Development**
5. Click **Save**

## Security Notes

- ✅ `.env` is in `.gitignore` - credentials won't be committed
- ✅ MongoDB credentials are now only in environment variables
- ✅ `config.js` no longer contains sensitive data
- ✅ Both API (`api/index.js`) and Server (`server/index.js`) use `process.env`

## Testing

After setup, test locally:
```bash
npm run dev        # Frontend
npm run server     # Backend (in another terminal)
```
