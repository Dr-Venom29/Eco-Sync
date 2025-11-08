-- Create table to track merged complaints
CREATE TABLE IF NOT EXISTS complaint_merges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  merged_complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  merged_by UUID REFERENCES auth.users(id),
  merged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  merge_reason TEXT,
  UNIQUE(merged_complaint_id)
);

-- Add merged_into field to complaints table
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS merged_into UUID REFERENCES complaints(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_merged BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE complaint_merges ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and staff can view merge history
CREATE POLICY "Admins and staff can view merges"
  ON complaint_merges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'staff')
    )
  );

-- Policy: Only admins can merge complaints
CREATE POLICY "Only admins can merge complaints"
  ON complaint_merges FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Function to find potential duplicate complaints (same location within 50m radius)
CREATE OR REPLACE FUNCTION find_duplicate_complaints(
  complaint_lat DOUBLE PRECISION,
  complaint_lng DOUBLE PRECISION,
  max_distance_meters INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.description,
    c.location,
    c.latitude,
    c.longitude,
    c.status,
    c.created_at,
    -- Calculate approximate distance in meters using Haversine formula
    (
      6371000 * acos(
        cos(radians(complaint_lat)) * 
        cos(radians(c.latitude)) * 
        cos(radians(c.longitude) - radians(complaint_lng)) + 
        sin(radians(complaint_lat)) * 
        sin(radians(c.latitude))
      )
    ) as distance_meters
  FROM complaints c
  WHERE 
    c.is_merged = false
    AND c.status != 'resolved'
    AND c.latitude IS NOT NULL 
    AND c.longitude IS NOT NULL
    -- Pre-filter using bounding box (faster than distance calculation)
    AND c.latitude BETWEEN complaint_lat - 0.0005 AND complaint_lat + 0.0005
    AND c.longitude BETWEEN complaint_lng - 0.0005 AND complaint_lng + 0.0005
  HAVING distance_meters <= max_distance_meters
  ORDER BY distance_meters ASC;
END;
$$;

-- Function to merge complaints
CREATE OR REPLACE FUNCTION merge_complaints(
  parent_id UUID,
  child_ids UUID[],
  merged_by_user UUID,
  reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  child_id UUID;
  merge_count INTEGER := 0;
  result JSON;
BEGIN
  -- Verify user is admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = merged_by_user 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can merge complaints';
  END IF;

  -- Loop through child complaints
  FOREACH child_id IN ARRAY child_ids
  LOOP
    -- Skip if already merged
    IF EXISTS (SELECT 1 FROM complaints WHERE id = child_id AND is_merged = true) THEN
      CONTINUE;
    END IF;

    -- Update child complaint
    UPDATE complaints
    SET 
      is_merged = true,
      merged_into = parent_id,
      status = 'resolved',
      resolved_at = NOW()
    WHERE id = child_id;

    -- Record merge in history
    INSERT INTO complaint_merges (
      parent_complaint_id,
      merged_complaint_id,
      merged_by,
      merge_reason
    ) VALUES (
      parent_id,
      child_id,
      merged_by_user,
      reason
    );

    merge_count := merge_count + 1;
  END LOOP;

  -- Return result
  SELECT json_build_object(
    'success', true,
    'merged_count', merge_count,
    'parent_id', parent_id
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION find_duplicate_complaints(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION merge_complaints(UUID, UUID[], UUID, TEXT) TO authenticated;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_complaints_location ON complaints(latitude, longitude) WHERE is_merged = false;
CREATE INDEX IF NOT EXISTS idx_complaints_merged ON complaints(is_merged, merged_into);
CREATE INDEX IF NOT EXISTS idx_complaint_merges_parent ON complaint_merges(parent_complaint_id);
