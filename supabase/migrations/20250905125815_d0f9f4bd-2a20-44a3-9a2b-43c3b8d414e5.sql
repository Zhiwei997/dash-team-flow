-- Create storage bucket for job attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('job-attachments', 'job-attachments', false);

-- Create job_attachments table
CREATE TABLE public.job_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on job_attachments
ALTER TABLE public.job_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for job_attachments
CREATE POLICY "Anyone can view job attachments" 
ON public.job_attachments 
FOR SELECT 
USING (true);

CREATE POLICY "Job creators can upload attachments" 
ON public.job_attachments 
FOR INSERT 
WITH CHECK (
  auth.uid() = uploaded_by AND 
  EXISTS (
    SELECT 1 FROM jobs j 
    WHERE j.id = job_attachments.job_id 
    AND j.created_by = auth.uid()
  )
);

CREATE POLICY "Job creators can delete attachments" 
ON public.job_attachments 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM jobs j 
    WHERE j.id = job_attachments.job_id 
    AND j.created_by = auth.uid()
  )
);

-- Create storage policies for job-attachments bucket
CREATE POLICY "Job creators can upload files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'job-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view job attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'job-attachments');

CREATE POLICY "Job creators can delete their uploads" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'job-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Job creators can update their uploads" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'job-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);