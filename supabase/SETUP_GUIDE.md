# Supabase Setup Guide for StudyNexus

This guide will walk you through setting up Supabase for the StudyNexus application.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. A new Supabase project created

## Step-by-Step Setup

### Step 1: Create a Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: StudyNexus (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development

### Step 2: Get Your Project Credentials

1. Go to **Project Settings** → **API**
2. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Step 3: Set Up Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (enabled by default)
3. (Optional) Enable other providers like Google, GitHub, etc.
4. Configure email templates if needed

### Step 4: Run Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the SQL files in this order:

   **Option A: Run Complete Setup (Recommended)**
   - Copy and paste the contents of `00_complete_setup.sql`
   - Click "Run"

   **Option B: Run Individual Files**
   - Run `01_auth_setup.sql` first
   - Then `02_main_schema.sql`
   - Then `03_functions.sql`
   - Finally `04_storage_setup.sql`

3. Verify the setup by running the verification queries at the end of `00_complete_setup.sql`

### Step 5: Set Up Storage Buckets

The storage buckets are created automatically by `04_storage_setup.sql`, but you can verify:

1. Go to **Storage** in your Supabase dashboard
2. You should see two buckets:
   - `study-materials` (for PDFs, documents, etc.)
   - `handwritten-notes` (for image uploads)

### Step 6: Configure Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key_here
```

### Step 7: Test Authentication

1. Start your Next.js app: `npm run dev`
2. Navigate to `/signup`
3. Create a test account
4. Check **Authentication** → **Users** in Supabase to see the new user

## Database Schema Overview

### Core Tables

- **user_profiles**: Extended user information
- **study_materials**: Uploaded notes, PDFs, documents
- **concepts**: Knowledge graph nodes
- **concept_relationships**: Relationships between concepts
- **flashcards**: AI-generated flashcards
- **study_sessions**: Study activity tracking
- **exams**: Generated practice exams
- **study_groups**: Collaborative study groups
- **learning_profiles**: User learning preferences and stats
- **study_schedules**: AI-generated study schedules
- **progress_snapshots**: Progress tracking data

### Security (RLS Policies)

All tables have Row Level Security (RLS) enabled:
- Users can only access their own data
- Study groups have special policies for sharing
- Storage buckets are private per user

### Functions

- `calculate_study_streak()`: Calculates consecutive study days
- `calculate_concept_mastery()`: Determines concept mastery level
- `calculate_next_review()`: Spaced repetition algorithm
- `get_due_flashcards()`: Gets flashcards ready for review
- `search_study_materials()`: Full-text search for materials

## Troubleshooting

### Issue: "relation does not exist"
- Make sure you ran the SQL files in order
- Check that all tables were created successfully

### Issue: "permission denied"
- Verify RLS policies are set up correctly
- Check that the user is authenticated
- Ensure the anon key is being used (not service_role key) in the client

### Issue: Storage upload fails
- Verify storage buckets exist
- Check storage policies are set up
- Ensure file size is within limits (50MB for materials, 10MB for notes)

### Issue: Authentication not working
- Check that email provider is enabled
- Verify environment variables are set correctly
- Check browser console for errors

## Production Considerations

1. **Enable Email Confirmation**: In Authentication → Settings, enable email confirmation
2. **Set Up Custom SMTP**: For production, configure custom SMTP in Project Settings
3. **Backup Strategy**: Set up automated backups in Project Settings
4. **Monitor Usage**: Keep an eye on database size and API usage
5. **Rate Limiting**: Configure rate limits in Project Settings → API
6. **CORS**: Configure allowed origins in Project Settings → API

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

## Support

If you encounter issues:
1. Check the Supabase dashboard logs
2. Review the SQL Editor for any errors
3. Check the Next.js console for client-side errors
4. Refer to Supabase documentation

