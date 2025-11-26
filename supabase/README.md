# Supabase Database Setup

This directory contains all SQL files needed to set up the Supabase database for StudyNexus.

## Quick Start

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Get your credentials** from Project Settings → API
3. **Run the SQL files** in the SQL Editor in this order:
   - `01_auth_setup.sql` - Authentication and user profiles
   - `02_main_schema.sql` - All application tables
   - `03_functions.sql` - Helper functions and triggers
   - `04_storage_setup.sql` - File storage buckets

Or use `00_complete_setup.sql` to run everything at once.

## File Structure

```
supabase/
├── 00_complete_setup.sql    # Run all setup files at once
├── 01_auth_setup.sql        # Authentication setup
├── 02_main_schema.sql       # Main database schema
├── 03_functions.sql         # Database functions and triggers
├── 04_storage_setup.sql     # Storage buckets and policies
├── SETUP_GUIDE.md           # Detailed setup instructions
├── MIGRATION_GUIDE.md       # Guide for migrating from localStorage
└── schema.sql               # Legacy schema (for reference)
```

## What Gets Created

### Tables
- `user_profiles` - Extended user information
- `study_materials` - Uploaded notes and documents
- `concepts` - Knowledge graph nodes
- `concept_relationships` - Concept connections
- `flashcards` - Study flashcards
- `study_sessions` - Study activity tracking
- `exams` - Practice exams
- `study_groups` - Collaborative groups
- `study_group_members` - Group membership
- `learning_profiles` - User learning data
- `study_schedules` - AI-generated schedules
- `progress_snapshots` - Progress tracking

### Security
- Row Level Security (RLS) enabled on all tables
- Policies ensure users can only access their own data
- Storage buckets with per-user access control

### Functions
- `calculate_study_streak()` - Tracks consecutive study days
- `calculate_concept_mastery()` - Determines mastery levels
- `calculate_next_review()` - Spaced repetition algorithm
- `get_due_flashcards()` - Gets flashcards ready for review
- `search_study_materials()` - Full-text search

### Storage
- `study-materials` bucket (50MB limit)
- `handwritten-notes` bucket (10MB limit)
- Private access with user-based policies

## Next Steps

After running the SQL files:

1. **Configure environment variables** (see SETUP_GUIDE.md)
2. **Test authentication** by creating a test account
3. **Verify RLS policies** by checking data access
4. **Test file uploads** to storage buckets

For detailed instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

