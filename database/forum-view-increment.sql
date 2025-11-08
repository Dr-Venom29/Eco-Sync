-- Create table to track unique topic views per user
CREATE TABLE IF NOT EXISTS forum_topic_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES forum_topics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(topic_id, user_id)
);

-- Enable RLS on forum_topic_views
ALTER TABLE forum_topic_views ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view the views table
CREATE POLICY "Anyone can view topic views"
  ON forum_topic_views FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own views
CREATE POLICY "Users can record their own views"
  ON forum_topic_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to increment topic view count (unique per user)
CREATE OR REPLACE FUNCTION increment_topic_views(topic_id UUID, user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_view BOOLEAN;
  current_count INTEGER;
BEGIN
  -- Try to insert a new view record (will fail silently if already exists due to UNIQUE constraint)
  INSERT INTO forum_topic_views (topic_id, user_id)
  VALUES (topic_id, user_id)
  ON CONFLICT (topic_id, user_id) DO NOTHING
  RETURNING true INTO new_view;
  
  -- If this is a new view, increment the counter
  IF new_view THEN
    UPDATE forum_topics
    SET views_count = views_count + 1
    WHERE id = topic_id
    RETURNING views_count INTO current_count;
    
    RETURN current_count;
  ELSE
    -- Return current count without incrementing
    SELECT views_count INTO current_count
    FROM forum_topics
    WHERE id = topic_id;
    
    RETURN current_count;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_topic_views(UUID, UUID) TO authenticated;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_forum_topic_views_topic ON forum_topic_views(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_topic_views_user ON forum_topic_views(topic_id, user_id);
