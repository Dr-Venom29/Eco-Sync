-- Allow staff to claim unassigned complaints by setting assigned_to to themselves

DROP POLICY IF EXISTS "Staff can update assigned complaints" ON public.complaints;

CREATE POLICY "Staff can update assigned complaints" ON public.complaints
  FOR UPDATE USING (
    -- allowed if you're already assigned
    auth.uid() = assigned_to
    -- or if it's unassigned and you're a staff (so you can claim it)
    OR (
      assigned_to IS NULL
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'staff'
      )
    )
    -- or if you're admin
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    -- When updating, allow setting assigned_to to yourself (claim)
    (assigned_to = auth.uid())
    -- or allow admins to set anything
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
