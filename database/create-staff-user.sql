-- Create or update a staff user
-- This will set the role to 'staff' for the user who has been taking tasks

-- STEP 1: Check which user has been assigned to complaints
SELECT DISTINCT
  c.assigned_to,
  u.full_name,
  u.role,
  a.email
FROM complaints c
LEFT JOIN users u ON u.id = c.assigned_to
LEFT JOIN auth.users a ON a.id = c.assigned_to
WHERE c.assigned_to IS NOT NULL;

-- STEP 2: Update that user's role to 'staff'
-- Copy the ID from STEP 1 result and run this:

UPDATE public.users
SET role = 'staff'
WHERE id IN (
  SELECT DISTINCT assigned_to 
  FROM complaints 
  WHERE assigned_to IS NOT NULL
);

-- STEP 3: Verify the staff user was created
SELECT 
  u.id,
  u.full_name,
  u.role,
  a.email
FROM public.users u
LEFT JOIN auth.users a ON a.id = u.id
WHERE u.role = 'staff';

-- Create or update a staff user
-- First, you need to register a new account via the app (e.g., staff@example.com)
-- Then run this to change their role to staff:

UPDATE public.users
SET role = 'staff'
WHERE id = (SELECT id FROM auth.users WHERE email = 'staff@example.com');

-- Or update your existing account to staff:
UPDATE public.users
SET role = 'staff'
WHERE id = (SELECT id FROM auth.users WHERE email = 'motupatlume477@gmail.com');

-- To switch back to admin:
UPDATE public.users
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'motupatlume477@gmail.com');

-- View all users with their roles:
SELECT 
  au.email,
  pu.full_name,
  pu.role
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id;
