-- Fix RLS policies for complaints table to allow admin access via auth metadata

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Users can create complaints" ON public.complaints;
DROP POLICY IF EXISTS "Staff can view assigned complaints" ON public.complaints;
DROP POLICY IF EXISTS "Staff can update assigned complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can manage all complaints" ON public.complaints;

-- Recreate policies with proper admin checks using auth.users metadata
CREATE POLICY "Users can view own complaints" ON public.complaints
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create complaints" ON public.complaints
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin can view all complaints (check role from auth.users metadata)
CREATE POLICY "Admins can view all complaints" ON public.complaints
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update all complaints
CREATE POLICY "Admins can update all complaints" ON public.complaints
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can delete all complaints
CREATE POLICY "Admins can delete all complaints" ON public.complaints
  FOR DELETE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Staff can view assigned complaints
CREATE POLICY "Staff can view assigned complaints" ON public.complaints
  FOR SELECT USING (
    auth.uid() = assigned_to 
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Staff can update assigned complaints
CREATE POLICY "Staff can update assigned complaints" ON public.complaints
  FOR UPDATE USING (
    auth.uid() = assigned_to 
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
