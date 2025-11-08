-- Create test data for staff workflow
-- Run this AFTER you've created a staff user account via the app

-- Step 1: Ensure we have a zone (complaints need a zone_id)
INSERT INTO zones (name, description)
VALUES ('Test Zone A', 'Test zone for staff workflow')
ON CONFLICT DO NOTHING
RETURNING id;

-- Step 2: Create some test complaints that will be available in the staff pool
-- Replace 'YOUR_CITIZEN_USER_ID' with an actual user ID from your database
-- You can find a user ID by running: SELECT id, email FROM auth.users LIMIT 1;

-- Example: Create complaints available to all staff (unassigned pool)
INSERT INTO complaints (
  title,
  description,
  category,
  location,
  status,
  user_id,
  zone_id,
  assigned_to
)
SELECT 
  'Test Complaint - ' || generate_series,
  'This is a test complaint available to all staff members',
  CASE (generate_series % 4)
    WHEN 0 THEN 'garbage'
    WHEN 1 THEN 'recycling'
    WHEN 2 THEN 'hazardous'
    ELSE 'other'
  END,
  'Test Location ' || generate_series,
  'assigned', -- This status makes it available to staff
  (SELECT id FROM users WHERE role = 'citizen' LIMIT 1), -- Pick first citizen
  (SELECT id FROM zones LIMIT 1), -- Pick first zone
  NULL -- NULL assigned_to means it's in the pool
FROM generate_series(1, 5);

-- Verify the complaints were created
SELECT 
  id,
  title,
  status,
  category,
  assigned_to,
  created_at
FROM complaints
WHERE status = 'assigned' AND assigned_to IS NULL
ORDER BY created_at DESC;
