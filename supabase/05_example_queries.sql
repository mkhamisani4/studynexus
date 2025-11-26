-- ============================================
-- EXAMPLE QUERIES
-- ============================================
-- This file contains example queries for common operations
-- Use these as reference when building your application

-- ============================================
-- AUTHENTICATION QUERIES
-- ============================================

-- Get current user profile
SELECT * FROM public.user_profiles
WHERE id = auth.uid();

-- Update user profile
UPDATE public.user_profiles
SET full_name = 'New Name', updated_at = NOW()
WHERE id = auth.uid();

-- ============================================
-- STUDY MATERIALS QUERIES
-- ============================================

-- Get all study materials for current user
SELECT * FROM public.study_materials
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- Get materials by subject
SELECT * FROM public.study_materials
WHERE user_id = auth.uid() AND subject = 'Mathematics'
ORDER BY created_at DESC;

-- Search materials (using the search function)
SELECT * FROM public.search_study_materials(
  auth.uid(),
  'linear algebra',
  NULL -- or specify subject
);

-- ============================================
-- CONCEPTS & KNOWLEDGE GRAPH QUERIES
-- ============================================

-- Get all concepts for a user
SELECT * FROM public.concepts
WHERE user_id = auth.uid()
ORDER BY mastery_level DESC, name;

-- Get concept with relationships
SELECT 
  c.*,
  json_agg(
    json_build_object(
      'target_id', cr.target_concept_id,
      'type', cr.relationship_type,
      'target_name', tc.name
    )
  ) as relationships
FROM public.concepts c
LEFT JOIN public.concept_relationships cr ON c.id = cr.source_concept_id
LEFT JOIN public.concepts tc ON cr.target_concept_id = tc.id
WHERE c.user_id = auth.uid()
GROUP BY c.id;

-- Get weak concepts (mastery < 60)
SELECT * FROM public.concepts
WHERE user_id = auth.uid() AND mastery_level < 60
ORDER BY mastery_level ASC;

-- Get strong concepts (mastery >= 80)
SELECT * FROM public.concepts
WHERE user_id = auth.uid() AND mastery_level >= 80
ORDER BY mastery_level DESC;

-- ============================================
-- FLASHCARD QUERIES
-- ============================================

-- Get due flashcards (ready for review)
SELECT * FROM public.get_due_flashcards(auth.uid(), 20);

-- Get flashcards by concept
SELECT * FROM public.flashcards
WHERE user_id = auth.uid() AND concept_id = 'concept-uuid-here'
ORDER BY next_review_date NULLS FIRST;

-- Get flashcards by difficulty
SELECT * FROM public.flashcards
WHERE user_id = auth.uid() AND difficulty = 'hard'
ORDER BY times_incorrect DESC;

-- Update flashcard after review
UPDATE public.flashcards
SET 
  times_correct = times_correct + 1,
  last_reviewed = NOW(),
  next_review_date = NOW() + (interval_days || ' days')::INTERVAL,
  updated_at = NOW()
WHERE id = 'flashcard-uuid-here' AND user_id = auth.uid();

-- ============================================
-- STUDY SESSION QUERIES
-- ============================================

-- Create a new study session
INSERT INTO public.study_sessions (user_id, subject, duration_minutes, activities, performance_score)
VALUES (
  auth.uid(),
  'Mathematics',
  45,
  '["flashcards", "quiz", "reading"]'::jsonb,
  85
);

-- Get recent study sessions
SELECT * FROM public.study_sessions
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;

-- Get total study hours
SELECT 
  SUM(duration_minutes) / 60.0 as total_hours
FROM public.study_sessions
WHERE user_id = auth.uid();

-- Get study sessions by date range
SELECT * FROM public.study_sessions
WHERE user_id = auth.uid()
AND created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC;

-- ============================================
-- EXAM QUERIES
-- ============================================

-- Get all exams for user
SELECT * FROM public.exams
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- Get completed exams
SELECT * FROM public.exams
WHERE user_id = auth.uid() AND completed = TRUE
ORDER BY completed_at DESC;

-- Get exam by ID
SELECT * FROM public.exams
WHERE id = 'exam-uuid-here' AND user_id = auth.uid();

-- Update exam with answers
UPDATE public.exams
SET 
  answers = '{"question_1": "answer_1", "question_2": "answer_2"}'::jsonb,
  completed = TRUE,
  completed_at = NOW(),
  score = 85
WHERE id = 'exam-uuid-here' AND user_id = auth.uid();

-- ============================================
-- LEARNING PROFILE QUERIES
-- ============================================

-- Get learning profile
SELECT * FROM public.learning_profiles
WHERE user_id = auth.uid();

-- Update study streak
UPDATE public.learning_profiles
SET 
  study_streak_days = public.calculate_study_streak(auth.uid()),
  last_study_date = CURRENT_DATE,
  updated_at = NOW()
WHERE user_id = auth.uid();

-- Update energy level
UPDATE public.learning_profiles
SET 
  energy_levels = jsonb_set(
    COALESCE(energy_levels, '[]'::jsonb),
    array[array_length(energy_levels, 1)::text],
    jsonb_build_object('date', CURRENT_DATE::text, 'level', 7)
  ),
  updated_at = NOW()
WHERE user_id = auth.uid();

-- ============================================
-- STUDY GROUPS QUERIES
-- ============================================

-- Get groups user is a member of
SELECT sg.*, sgm.role
FROM public.study_groups sg
JOIN public.study_group_members sgm ON sg.id = sgm.group_id
WHERE sgm.user_id = auth.uid();

-- Get public groups
SELECT * FROM public.study_groups
WHERE is_public = TRUE
ORDER BY created_at DESC;

-- Join a study group
INSERT INTO public.study_group_members (group_id, user_id, role)
VALUES ('group-uuid-here', auth.uid(), 'member')
ON CONFLICT (group_id, user_id) DO NOTHING;

-- ============================================
-- PROGRESS QUERIES
-- ============================================

-- Get progress snapshots
SELECT * FROM public.progress_snapshots
WHERE user_id = auth.uid()
ORDER BY snapshot_date DESC;

-- Get progress by subject
SELECT * FROM public.progress_snapshots
WHERE user_id = auth.uid() AND subject = 'Mathematics'
ORDER BY snapshot_date DESC;

-- ============================================
-- STATISTICS QUERIES
-- ============================================

-- Get user statistics
SELECT 
  (SELECT COUNT(*) FROM public.study_materials WHERE user_id = auth.uid()) as materials_count,
  (SELECT COUNT(*) FROM public.concepts WHERE user_id = auth.uid()) as concepts_count,
  (SELECT COUNT(*) FROM public.flashcards WHERE user_id = auth.uid()) as flashcards_count,
  (SELECT COUNT(*) FROM public.exams WHERE user_id = auth.uid() AND completed = TRUE) as exams_completed,
  (SELECT AVG(score) FROM public.exams WHERE user_id = auth.uid() AND completed = TRUE) as avg_exam_score,
  (SELECT SUM(duration_minutes) / 60.0 FROM public.study_sessions WHERE user_id = auth.uid()) as total_study_hours,
  (SELECT study_streak_days FROM public.learning_profiles WHERE user_id = auth.uid()) as study_streak;

-- Get weekly study activity
SELECT 
  DATE(created_at) as study_date,
  COUNT(*) as sessions_count,
  SUM(duration_minutes) as total_minutes
FROM public.study_sessions
WHERE user_id = auth.uid()
AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY study_date DESC;

-- Get subject breakdown
SELECT 
  subject,
  COUNT(*) as materials_count,
  SUM(duration_minutes) / 60.0 as study_hours
FROM public.study_sessions
WHERE user_id = auth.uid()
GROUP BY subject
ORDER BY study_hours DESC;

