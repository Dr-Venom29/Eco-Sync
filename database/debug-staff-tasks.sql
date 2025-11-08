-- Debug script to check why staff page shows no tasks

-- 1. Check if there are ANY complaints in the database
SELECT 
  'Total complaints' as check_type,
  COUNT(*) as count
FROM complaints;

-- 2. Check complaints by status
SELECT 
  'Complaints by status' as check_type,
  status,
  COUNT(*) as count
FROM complaints
GROUP BY status;

-- 3. Check if there are complaints that SHOULD show in staff pool (unassigned, status='assigned')
SELECT 
  'Available pool tasks' as check_type,
  id,
  title,
  status,
  assigned_to,
  created_at
FROM complaints
WHERE assigned_to IS NULL 
  AND status = 'assigned'
ORDER BY created_at DESC;

-- 4. Check if there are complaints assigned to any staff
SELECT 
  'Assigned to staff' as check_type,
  c.id,
  c.title,
  c.status,
  c.assigned_to,
  u.full_name as staff_name,
  u.role
FROM complaints c
LEFT JOIN users u ON u.id = c.assigned_to
WHERE c.assigned_to IS NOT NULL
ORDER BY c.created_at DESC;

-- 5. Check all staff users
SELECT 
  'Staff users' as check_type,
  u.id,
  u.full_name,
  a.email,
  u.role
FROM users u
LEFT JOIN auth.users a ON a.id = u.id
WHERE u.role = 'staff';

-- 6. Check all complaints with full details
SELECT 
  c.id,
  c.title,
  c.description,
  c.status,
  c.category,
  c.location,
  c.assigned_to,
  c.zone_id,
  c.created_at,
  reporter.full_name as reporter_name,
  staff.full_name as assigned_staff_name,
  z.name as zone_name
FROM complaints c
LEFT JOIN users reporter ON reporter.id = c.user_id
LEFT JOIN users staff ON staff.id = c.assigned_to
LEFT JOIN zones z ON z.id = c.zone_id
ORDER BY c.created_at DESC
LIMIT 20;

-- 7. If no complaints exist, let's check if zones exist (needed for creating complaints)
SELECT 
  'Zones' as check_type,
  id,
  name,
  description
FROM zones;
