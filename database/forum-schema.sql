-- Community Forum Schema

-- Create forum_topics table
CREATE TABLE IF NOT EXISTS public.forum_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('general', 'waste-management', 'recycling', 'suggestions', 'qa')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  is_pinned BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create forum_replies table
CREATE TABLE IF NOT EXISTS public.forum_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID REFERENCES public.forum_topics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_solution BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forum_topics_user_id ON public.forum_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_category ON public.forum_topics(category);
CREATE INDEX IF NOT EXISTS idx_forum_topics_created_at ON public.forum_topics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_replies_topic_id ON public.forum_replies(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_user_id ON public.forum_replies(user_id);

-- Enable Row Level Security
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forum_topics
DROP POLICY IF EXISTS "Anyone can view topics" ON public.forum_topics;
CREATE POLICY "Anyone can view topics" ON public.forum_topics
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create topics" ON public.forum_topics;
CREATE POLICY "Authenticated users can create topics" ON public.forum_topics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own topics" ON public.forum_topics;
CREATE POLICY "Users can update own topics" ON public.forum_topics
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users and admins can delete topics" ON public.forum_topics;
CREATE POLICY "Users and admins can delete topics" ON public.forum_topics
  FOR DELETE USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for forum_replies
DROP POLICY IF EXISTS "Anyone can view replies" ON public.forum_replies;
CREATE POLICY "Anyone can view replies" ON public.forum_replies
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create replies" ON public.forum_replies;
CREATE POLICY "Authenticated users can create replies" ON public.forum_replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own replies" ON public.forum_replies;
CREATE POLICY "Users can update own replies" ON public.forum_replies
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users and admins can delete replies" ON public.forum_replies;
CREATE POLICY "Users and admins can delete replies" ON public.forum_replies
  FOR DELETE USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to update topic updated_at timestamp when reply is added
CREATE OR REPLACE FUNCTION update_forum_topic_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.forum_topics
  SET updated_at = NOW()
  WHERE id = NEW.topic_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update topic timestamp
DROP TRIGGER IF EXISTS trigger_update_topic_timestamp ON public.forum_replies;
CREATE TRIGGER trigger_update_topic_timestamp
  AFTER INSERT ON public.forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_forum_topic_timestamp();
