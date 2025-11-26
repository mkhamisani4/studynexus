# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_OPENAI_API_KEY=
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

3. **Set Up Supabase Database**
   
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase/schema.sql`
   - Run the SQL script to create all tables

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Getting API Keys

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new secret key
5. Copy and paste into `.env.local`

### Supabase Setup
1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Go to Project Settings > API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

## Database Setup

The database schema includes tables for:
- Study materials
- Concepts and relationships
- Flashcards
- Study sessions
- Exams
- Study groups
- Learning profiles

All tables are created automatically when you run the SQL script from `supabase/schema.sql`.

## Troubleshooting

### Common Issues

1. **OpenAI API Errors**
   - Ensure your API key is correct
   - Check your OpenAI account has credits
   - Verify the key has proper permissions

2. **Supabase Connection Issues**
   - Verify your Supabase URL and keys are correct
   - Check that the database tables were created
   - Ensure Row Level Security (RLS) policies are configured if needed

3. **Build Errors**
   - Delete `node_modules` and `.next` folder
   - Run `npm install` again
   - Clear npm cache: `npm cache clean --force`

4. **Type Errors**
   - Run `npm run build` to check for TypeScript errors
   - Ensure all dependencies are installed

## Next Steps

After setup:
1. Upload your first study material
2. Generate a knowledge graph
3. Create flashcards from your notes
4. Take a practice exam
5. Explore all the AI-powered features!

