-- Add staff_feedback column to complaints table
-- This stores citizen feedback on staff performance after complaint resolution

ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS staff_feedback JSONB;

-- Add comment explaining the column structure
COMMENT ON COLUMN complaints.staff_feedback IS 'Citizen feedback on staff performance. Structure: {rating: number (1-5), comment: string, submitted_at: timestamp}';

-- Create index for faster queries on complaints with feedback
CREATE INDEX IF NOT EXISTS idx_complaints_staff_feedback 
ON complaints ((staff_feedback IS NOT NULL));
