-- ============================================
-- HELPER FUNCTIONS AND TRIGGERS
-- ============================================
-- This file contains utility functions for the application

-- ============================================
-- STREAK CALCULATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_study_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  streak_days INTEGER := 0;
  current_date DATE := CURRENT_DATE;
  last_study_date DATE;
BEGIN
  -- Get the last study date from learning profile
  SELECT last_study_date INTO last_study_date
  FROM public.learning_profiles
  WHERE user_id = p_user_id;

  -- If no last study date, return 0
  IF last_study_date IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate streak by checking consecutive days with study sessions
  WHILE EXISTS (
    SELECT 1
    FROM public.study_sessions
    WHERE user_id = p_user_id
    AND DATE(created_at) = current_date - streak_days
  ) LOOP
    streak_days := streak_days + 1;
  END LOOP;

  -- If today has a session, include it
  IF EXISTS (
    SELECT 1
    FROM public.study_sessions
    WHERE user_id = p_user_id
    AND DATE(created_at) = current_date
  ) THEN
    RETURN streak_days;
  ELSE
    RETURN streak_days - 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE STUDY STREAK TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.update_study_streak()
RETURNS TRIGGER AS $$
BEGIN
  -- Update learning profile with new streak and last study date
  INSERT INTO public.learning_profiles (user_id, study_streak_days, last_study_date)
  VALUES (NEW.user_id, public.calculate_study_streak(NEW.user_id), CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE
  SET
    study_streak_days = public.calculate_study_streak(NEW.user_id),
    last_study_date = CURRENT_DATE,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update streak after study session
DROP TRIGGER IF EXISTS update_streak_on_session ON public.study_sessions;
CREATE TRIGGER update_streak_on_session
  AFTER INSERT ON public.study_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_study_streak();

-- ============================================
-- CALCULATE MASTERY LEVEL FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_concept_mastery(p_concept_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  mastery_score INTEGER := 0;
  total_flashcards INTEGER;
  correct_flashcards INTEGER;
  exam_performance DECIMAL;
BEGIN
  -- Calculate based on flashcard performance
  SELECT
    COUNT(*)::INTEGER,
    SUM(CASE WHEN times_correct > times_incorrect THEN 1 ELSE 0 END)::INTEGER
  INTO total_flashcards, correct_flashcards
  FROM public.flashcards
  WHERE concept_id = p_concept_id AND user_id = p_user_id;

  IF total_flashcards > 0 THEN
    mastery_score := mastery_score + (correct_flashcards::DECIMAL / total_flashcards::DECIMAL * 50)::INTEGER;
  END IF;

  -- Calculate based on exam performance (if concept appears in exams)
  -- This is a simplified version - you can expand this
  SELECT AVG(score) INTO exam_performance
  FROM public.exams
  WHERE user_id = p_user_id
  AND completed = TRUE
  AND questions::text LIKE '%' || (SELECT name FROM public.concepts WHERE id = p_concept_id) || '%';

  IF exam_performance IS NOT NULL THEN
    mastery_score := mastery_score + (exam_performance * 0.5)::INTEGER;
  END IF;

  -- Cap at 100
  IF mastery_score > 100 THEN
    mastery_score := 100;
  END IF;

  RETURN mastery_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE CONCEPT MASTERY TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.update_concept_mastery()
RETURNS TRIGGER AS $$
BEGIN
  -- Update mastery level when flashcard performance changes
  IF NEW.concept_id IS NOT NULL THEN
    UPDATE public.concepts
    SET mastery_level = public.calculate_concept_mastery(NEW.concept_id, NEW.user_id)
    WHERE id = NEW.concept_id AND user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update mastery after flashcard review
DROP TRIGGER IF EXISTS update_mastery_on_flashcard ON public.flashcards;
CREATE TRIGGER update_mastery_on_flashcard
  AFTER UPDATE OF times_correct, times_incorrect ON public.flashcards
  FOR EACH ROW EXECUTE FUNCTION public.update_concept_mastery();

-- ============================================
-- SPACED REPETITION CALCULATION
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_next_review(
  p_ease_factor DECIMAL,
  p_interval_days INTEGER,
  p_quality INTEGER -- 0-5 scale
)
RETURNS TABLE(next_interval INTEGER, next_ease DECIMAL) AS $$
DECLARE
  new_ease DECIMAL;
  new_interval INTEGER;
BEGIN
  -- Update ease factor based on quality
  new_ease := p_ease_factor + (0.1 - (5 - p_quality) * (0.08 + (5 - p_quality) * 0.02));
  
  -- Minimum ease factor
  IF new_ease < 1.3 THEN
    new_ease := 1.3;
  END IF;

  -- Calculate new interval
  IF p_quality < 3 THEN
    -- Failed - restart
    new_interval := 1;
  ELSE
    -- Success - increase interval
    new_interval := (p_interval_days * new_ease)::INTEGER;
  END IF;

  RETURN QUERY SELECT new_interval, new_ease;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GET DUE FLASHCARDS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.get_due_flashcards(p_user_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE(
  id UUID,
  question TEXT,
  answer TEXT,
  difficulty TEXT,
  mode TEXT,
  concept_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.question,
    f.answer,
    f.difficulty,
    f.mode,
    f.concept_id
  FROM public.flashcards f
  WHERE f.user_id = p_user_id
  AND (f.next_review_date IS NULL OR f.next_review_date <= NOW())
  ORDER BY f.next_review_date NULLS FIRST, f.created_at
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEARCH STUDY MATERIALS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.search_study_materials(
  p_user_id UUID,
  p_search_term TEXT,
  p_subject TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  subject TEXT,
  content_preview TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sm.id,
    sm.title,
    sm.subject,
    LEFT(sm.content, 200) as content_preview,
    sm.created_at
  FROM public.study_materials sm
  WHERE sm.user_id = p_user_id
  AND (
    sm.title ILIKE '%' || p_search_term || '%' OR
    sm.content ILIKE '%' || p_search_term || '%'
  )
  AND (p_subject IS NULL OR sm.subject = p_subject)
  ORDER BY sm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

