-- Temporarily disable RLS to create user profiles
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Create profiles for all auth users who don't have one
INSERT INTO public.users (id, full_name, phone, role, total_points)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
  COALESCE(au.raw_user_meta_data->>'phone', ''),
  COALESCE(au.raw_user_meta_data->>'role', 'citizen'),
  0
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Verify - this should show all users now
SELECT id, full_name, role, total_points FROM public.users;
