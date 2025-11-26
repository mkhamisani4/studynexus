-- ============================================
-- MAIN APPLICATION SCHEMA
-- ============================================
-- This file contains all the main tables for the application
-- Run this AFTER 01_auth_setup.sql

-- ============================================
-- STUDY MATERIALS
-- ============================================

CREATE TABLE IF NOT EXISTS public.study_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  file_type TEXT,
  file_url TEXT,
  file_size BIGINT,
  subject TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study_materials
CREATE POLICY "Users can view their own materials"
  ON public.study_materials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own materials"
  ON public.study_materials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own materials"
  ON public.study_materials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own materials"
  ON public.study_materials FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_study_materials_updated_at
  BEFORE UPDATE ON public.study_materials
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- CONCEPTS (Knowledge Graph)
-- ============================================

CREATE TABLE IF NOT EXISTS public.concepts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name, subject)
);

-- Concept Relationships
CREATE TABLE IF NOT EXISTS public.concept_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  target_concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('prerequisite', 'related', 'depends_on', 'similar_to')),
  strength INTEGER DEFAULT 50 CHECK (strength >= 0 AND strength <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, source_concept_id, target_concept_id),
  CHECK (source_concept_id != target_concept_id)
);

-- Enable RLS
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for concepts
CREATE POLICY "Users can manage their own concepts"
  ON public.concepts FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for concept_relationships
CREATE POLICY "Users can manage their own concept relationships"
  ON public.concept_relationships FOR ALL
  USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_concepts_updated_at
  BEFORE UPDATE ON public.concepts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- FLASHCARDS
-- ============================================

CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES public.concepts(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  mode TEXT NOT NULL CHECK (mode IN ('text', 'image', 'fill_blank', 'multiple_choice', 'code', 'explain')),
  options JSONB,
  image_url TEXT,
  times_correct INTEGER DEFAULT 0,
  times_incorrect INTEGER DEFAULT 0,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  next_review_date TIMESTAMP WITH TIME ZONE,
  ease_factor DECIMAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own flashcards"
  ON public.flashcards FOR ALL
  USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_flashcards_updated_at
  BEFORE UPDATE ON public.flashcards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- STUDY SESSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  activities JSONB DEFAULT '[]'::jsonb,
  performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own study sessions"
  ON public.study_sessions FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- EXAMS
-- ============================================

CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  questions JSONB NOT NULL,
  predicted_difficulty TEXT CHECK (predicted_difficulty IN ('easy', 'medium', 'hard')),
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  answers JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own exams"
  ON public.exams FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- STUDY GROUPS
-- ============================================

CREATE TABLE IF NOT EXISTS public.study_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_ids UUID[] DEFAULT '{}',
  shared_quizzes JSONB DEFAULT '[]'::jsonb,
  study_plan TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Study Group Members (junction table for better querying)
CREATE TABLE IF NOT EXISTS public.study_group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study_groups
CREATE POLICY "Users can view public groups or groups they're in"
  ON public.study_groups FOR SELECT
  USING (
    is_public = TRUE OR
    created_by = auth.uid() OR
    auth.uid() = ANY(member_ids) OR
    EXISTS (
      SELECT 1 FROM public.study_group_members
      WHERE group_id = study_groups.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON public.study_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group owners can update their groups"
  ON public.study_groups FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Group owners can delete their groups"
  ON public.study_groups FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for study_group_members
CREATE POLICY "Users can view members of groups they're in"
  ON public.study_group_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.study_groups
      WHERE id = study_group_members.group_id
      AND (created_by = auth.uid() OR auth.uid() = ANY(member_ids))
    )
  );

CREATE POLICY "Users can join groups"
  ON public.study_group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON public.study_group_members FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_study_groups_updated_at
  BEFORE UPDATE ON public.study_groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- LEARNING PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS public.learning_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  learning_style TEXT CHECK (learning_style IN ('spaced_repetition', 'slow_burn', 'burst', 'mixed')),
  weak_concepts UUID[] DEFAULT '{}',
  strong_concepts UUID[] DEFAULT '{}',
  study_streak_days INTEGER DEFAULT 0,
  last_study_date TIMESTAMP WITH TIME ZONE,
  total_study_hours DECIMAL DEFAULT 0,
  energy_levels JSONB DEFAULT '[]'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.learning_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own learning profile"
  ON public.learning_profiles FOR ALL
  USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_learning_profiles_updated_at
  BEFORE UPDATE ON public.learning_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- STUDY SCHEDULES
-- ============================================

CREATE TABLE IF NOT EXISTS public.study_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  schedule_data JSONB NOT NULL,
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, schedule_date)
);

-- Enable RLS
ALTER TABLE public.study_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own schedules"
  ON public.study_schedules FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- PROGRESS TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS public.progress_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  subject TEXT,
  metrics JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date, subject)
);

-- Enable RLS
ALTER TABLE public.progress_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own progress"
  ON public.progress_snapshots FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_study_materials_user_id ON public.study_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_subject ON public.study_materials(subject);
CREATE INDEX IF NOT EXISTS idx_study_materials_created_at ON public.study_materials(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_concepts_user_id ON public.concepts(user_id);
CREATE INDEX IF NOT EXISTS idx_concepts_subject ON public.concepts(subject);
CREATE INDEX IF NOT EXISTS idx_concepts_mastery_level ON public.concepts(mastery_level);

CREATE INDEX IF NOT EXISTS idx_concept_relationships_user_id ON public.concept_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_concept_relationships_source ON public.concept_relationships(source_concept_id);
CREATE INDEX IF NOT EXISTS idx_concept_relationships_target ON public.concept_relationships(target_concept_id);

CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_concept_id ON public.flashcards(concept_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON public.flashcards(next_review_date) WHERE next_review_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_created_at ON public.study_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_exams_user_id ON public.exams(user_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON public.exams(subject);
CREATE INDEX IF NOT EXISTS idx_exams_created_at ON public.exams(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_study_group_members_user_id ON public.study_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_group_id ON public.study_group_members(group_id);

CREATE INDEX IF NOT EXISTS idx_learning_profiles_user_id ON public.learning_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_study_schedules_user_date ON public.study_schedules(user_id, schedule_date DESC);

CREATE INDEX IF NOT EXISTS idx_progress_snapshots_user_date ON public.progress_snapshots(user_id, snapshot_date DESC);

