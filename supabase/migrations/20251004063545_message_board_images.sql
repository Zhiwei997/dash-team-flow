-- Add image_urls field to project_messages table (JSON array of image URLs)
ALTER TABLE public.project_messages 
ADD COLUMN image_urls JSONB DEFAULT '[]'::jsonb;
