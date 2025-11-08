-- Quick diagnostic to see what's wrong

-- 1. Check ALL users and their roles
SELECT 
  u.id,
  u.full_name,
  u.role,
  a.email
FROM public.users u
LEFT JOIN auth.users a ON a.id = u.id
ORDER BY u.created_at DESC;

-- 2. Check complaints and who they're assigned to
SELECT 
  c.id,
  c.title,
  c.status,
  c.assigned_to,
  u.full_name as assigned_staff_name,
  u.role as assigned_staff_role
FROM complaints c
LEFT JOIN users u ON u.id = c.assigned_to
ORDER BY c.created_at DESC;

-- 3. Check if the assigned_to user exists in users table
SELECT 
  c.assigned_to,
  CASE 
    WHEN u.id IS NULL THEN 'User NOT in public.users table'
    ELSE 'User exists'
  END as status,
  u.full_name,
  u.role
FROM complaints c
LEFT JOIN users u ON u.id = c.assigned_to
WHERE c.assigned_to IS NOT NULL;
