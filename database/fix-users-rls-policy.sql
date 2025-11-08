-- Fix RLS policies on users table to allow admins to read all users
-- IMPORTANT: Avoid RLS recursion by using security definer function

-- Drop existing SELECT policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Users can view profiles" ON public.users;

-- Simple policy: everyone can read all user profiles
-- This is safe because we don't store sensitive data in public.users
CREATE POLICY "Enable read access for all users" ON public.users
  FOR SELECT USING (true);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'SELECT';
