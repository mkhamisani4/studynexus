# Quick Start Guide

## Step 1: Create Environment Variables File

Create a file named `.env.local` in the root directory of your project (same folder as `package.json`).

**File location:** `/Users/mohammedkhamisani/mkdevpost25/.env.local`

## Step 2: Add Your Credentials

Copy and paste this template into `.env.local`, then fill in your actual values:

```env
# Supabase Configuration
# Get these from: https://app.supabase.com → Your Project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI Configuration
# Get this from: https://platform.openai.com/api-keys
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-openai-key-here
```

## Step 3: Get Your Supabase Credentials

1. **Go to [app.supabase.com](https://app.supabase.com)**
2. **Create a new project** (or select existing one)
3. **Click Settings** (⚙️ icon in left sidebar)
4. **Click "API"** in the settings menu
5. **Copy these values:**
   - **Project URL** → Paste into `NEXT_PUBLIC_SUPABASE_URL`
     - Looks like: `https://abcdefghijklmnop.supabase.co`
   - **anon public** key → Paste into `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - Long string starting with `eyJ...`
   - **service_role** key → Paste into `SUPABASE_SERVICE_ROLE_KEY`
     - ⚠️ Keep this secret! Only used in server-side code.

## Step 4: Get Your OpenAI API Key

1. **Go to [platform.openai.com](https://platform.openai.com)**
2. **Sign in** or create account
3. **Click your profile** → **View API keys**
4. **Click "Create new secret key"**
5. **Copy the key** → Paste into `NEXT_PUBLIC_OPENAI_API_KEY`
   - Looks like: `sk-proj-...`

## Step 5: Set Up Database

1. In Supabase dashboard, go to **SQL Editor**
2. Run the SQL files in this order:
   - `supabase/01_auth_setup.sql`
   - `supabase/02_main_schema.sql`
   - `supabase/03_functions.sql`
   - `supabase/04_storage_setup.sql`

Or see `supabase/SETUP_GUIDE.md` for detailed instructions.

## Step 6: Start the App

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` - you should be redirected to the landing page!

## File Structure

Your `.env.local` file should look like this:

```
mkdevpost25/
├── .env.local          ← Create this file here
├── package.json
├── app/
├── components/
└── ...
```

## Important Notes

- ✅ The `.env.local` file is already in `.gitignore` (won't be committed)
- ✅ Never commit your actual API keys to git
- ✅ Restart the dev server after changing `.env.local`
- ✅ Use `NEXT_PUBLIC_` prefix for variables needed in browser
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` should NEVER be exposed to client

## Troubleshooting

**"Invalid API key" error?**
- Check you copied the entire key (they're very long)
- No extra spaces or line breaks
- Restart the dev server

**Variables not loading?**
- File must be named exactly `.env.local` (not `.env` or `.env.local.txt`)
- File must be in the root directory (same level as `package.json`)
- Restart the dev server after creating/editing the file

