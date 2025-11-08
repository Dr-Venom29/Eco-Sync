-- Fix infinite recursion in RLS policies
-- Drop the problematic policies and recreate them correctly

-- Drop existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;

-- Recreate policies without recursion
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile (for trigger)
CREATE POLICY "Enable insert for authenticated users only" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all users (use raw_user_meta_data from auth.users instead of public.users)
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Fix zones policy - same issue
DROP POLICY IF EXISTS "Only admins can manage zones" ON public.zones;

CREATE POLICY "Only admins can manage zones" ON public.zones
  FOR ALL USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Fix complaints policies
DROP POLICY IF EXISTS "Staff can view assigned complaints" ON public.complaints;
DROP POLICY IF EXISTS "Staff can update assigned complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can manage all complaints" ON public.complaints;

CREATE POLICY "Staff can view assigned complaints" ON public.complaints
  FOR SELECT USING (
    auth.uid() = assigned_to OR
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) IN ('admin', 'staff')
  );

CREATE POLICY "Staff can update assigned complaints" ON public.complaints
  FOR UPDATE USING (
    auth.uid() = assigned_to OR
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can manage all complaints" ON public.complaints
  FOR ALL USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Fix feedback policy
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;

CREATE POLICY "Admins can view all feedback" ON public.feedback
  FOR SELECT USING (
    auth.uid() = user_id OR
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );
