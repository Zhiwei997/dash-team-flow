-- Set default value for created_by in conversations table
ALTER TABLE public.conversations
ALTER COLUMN created_by SET DEFAULT auth.uid();