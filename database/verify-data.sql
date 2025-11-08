-- Verify complaints in database
SELECT 
  c.id,
  c.title,
  c.status,
  c.category,
  c.location,
  c.created_at,
  u.full_name as user_name,
  z.name as zone_name
FROM complaints c
LEFT JOIN users u ON u.id = c.user_id
LEFT JOIN zones z ON z.id = c.zone_id
ORDER BY c.created_at DESC
LIMIT 20;

-- Count complaints by status
SELECT status, COUNT(*) as count
FROM complaints
GROUP BY status;

-- Check if there are any zones
SELECT * FROM zones;

-- If no zones exist, create a default one
INSERT INTO zones (name, description)
VALUES ('Default Zone', 'Default zone for complaints')
ON CONFLICT DO NOTHING;
