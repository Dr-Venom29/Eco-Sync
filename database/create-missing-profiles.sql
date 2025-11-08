-- First, let's check if you have a user profile
-- Run this to see your auth user ID
SELECT id, email, raw_user_meta_data FROM auth.users;

-- If you see your user ID but no corresponding entry in public.users, 
-- manually create it by running this (replace YOUR_USER_ID with actual ID from above):

-- INSERT INTO public.users (id, full_name, phone, role, total_points)
-- VALUES (
--   'YOUR_USER_ID',  -- Replace with your actual user ID
--   'Bob',           -- Your name
--   '1234567890',    -- Your phone
--   'citizen',       -- Role
--   0                -- Points
-- );

-- OR use this automated version that creates profile for ALL auth users who don't have one:
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
