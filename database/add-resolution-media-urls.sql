-- Add an array column to store staff resolution photos (public URLs)
ALTER TABLE public.complaints
ADD COLUMN IF NOT EXISTS resolution_media_urls text[] DEFAULT '{}'::text[] NOT NULL;

-- Optional index for array operations (contains/overlap)
CREATE INDEX IF NOT EXISTS idx_complaints_resolution_media_urls_gin
ON public.complaints USING GIN (resolution_media_urls);
