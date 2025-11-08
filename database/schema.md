# Supabase Database Schema for EcoSync

This document outlines the database schema for the Local Waste Management Tracker.

## Tables

### 1. users (extends Supabase auth.users)
Stores additional user profile information beyond authentication.

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  zone_id UUID REFERENCES zones(id),
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'staff', 'admin')),
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 2. zones
Represents geographical zones or districts within the city.

```sql
CREATE TABLE public.zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  boundaries JSONB, -- GeoJSON format for zone boundaries
  assigned_staff UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view zones" ON public.zones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can manage zones" ON public.zones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 3. complaints
Stores all waste management complaints reported by citizens.

```sql
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'missed-pickup',
    'overflowing-bin',
    'illegal-dumping',
    'damaged-bin',
    'unclean-area',
    'other'
  )),
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  zone_id UUID REFERENCES zones(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'assigned',
    'in-progress',
    'resolved',
    'rejected'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.users(id),
  media_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own complaints" ON public.complaints
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create complaints" ON public.complaints
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view assigned complaints" ON public.complaints
  FOR SELECT USING (
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Staff can update assigned complaints" ON public.complaints
  FOR UPDATE USING (
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all complaints" ON public.complaints
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 4. rewards
Tracks point transactions for user rewards.

```sql
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  complaint_id UUID REFERENCES complaints(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards" ON public.rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create rewards" ON public.rewards
  FOR INSERT WITH CHECK (true);
```

### 5. user_badges
Tracks badges earned by users.

```sql
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);
```

### 6. feedback
Stores citizen feedback and ratings.

```sql
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  complaint_id UUID REFERENCES complaints(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback" ON public.feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## Storage Buckets

### complaint-media
Stores images and videos uploaded with complaints.

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-media', 'complaint-media', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'complaint-media');

CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'complaint-media');

CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'complaint-media' AND auth.uid() = owner);
```

## Functions

### add_user_points
Function to add points to a user and create a reward transaction.

```sql
CREATE OR REPLACE FUNCTION add_user_points(
  user_id UUID,
  points INTEGER,
  reason TEXT DEFAULT 'Complaint submitted',
  complaint_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Update user's total points
  UPDATE public.users
  SET total_points = total_points + points
  WHERE id = user_id;
  
  -- Create reward transaction
  INSERT INTO public.rewards (user_id, points, reason, complaint_id)
  VALUES (user_id, points, reason, complaint_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Indexes

```sql
-- Improve query performance
CREATE INDEX idx_complaints_user_id ON complaints(user_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_zone_id ON complaints(zone_id);
CREATE INDEX idx_complaints_assigned_to ON complaints(assigned_to);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);
CREATE INDEX idx_rewards_user_id ON rewards(user_id);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
```

## Triggers

### Update updated_at timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zones_updated_at
  BEFORE UPDATE ON zones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Setup Instructions

1. Create a new Supabase project
2. Go to the SQL Editor in Supabase Dashboard
3. Run each SQL block above in sequence
4. Enable UUID extension if not already enabled:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```
5. Set up authentication providers (Email/Password recommended)
6. Copy your project URL and anon key to the `.env` files
