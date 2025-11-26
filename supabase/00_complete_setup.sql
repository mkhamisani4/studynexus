-- ============================================
-- COMPLETE SUPABASE SETUP SCRIPT
-- ============================================
-- This file combines all setup files into one
-- Run this in the Supabase SQL Editor
-- 
-- Alternatively, you can run the files individually:
-- 1. 01_auth_setup.sql
-- 2. 02_main_schema.sql
-- 3. 03_functions.sql
-- 4. 04_storage_setup.sql

-- ============================================
-- PART 1: AUTHENTICATION SETUP
-- ============================================

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify everything is set up correctly

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check if RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

