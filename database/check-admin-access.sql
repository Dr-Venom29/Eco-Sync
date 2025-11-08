-- Check current user's role
SELECT 
  au.id,
  au.email,
  pu.role,
  pu.full_name
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE au.id = auth.uid();

-- Test if current user can see complaints
SELECT 
  c.id,
  c.title,
  c.status,
  c.created_at,
  u.full_name as reporter
FROM complaints c
LEFT JOIN users u ON u.id = c.user_id
ORDER BY c.created_at DESC
LIMIT 10;

-- Check RLS policies on complaints table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'complaints';
