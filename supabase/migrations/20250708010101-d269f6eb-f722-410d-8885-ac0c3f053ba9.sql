-- Create conversations table for both private and group chats
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT, -- null for private chats, set for group chats
  type TEXT NOT NULL DEFAULT 'private' CHECK (type IN ('private', 'group')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation members table
CREATE TABLE public.conversation_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message read receipts table
CREATE TABLE public.message_read_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view conversations they belong to" 
ON public.conversations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.conversation_members cm 
  WHERE cm.conversation_id = conversations.id AND cm.user_id = auth.uid()
));

CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Conversation owners can update conversations" 
ON public.conversations 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.conversation_members cm 
  WHERE cm.conversation_id = conversations.id 
  AND cm.user_id = auth.uid() 
  AND cm.role IN ('owner', 'admin')
));

CREATE POLICY "Conversation owners can delete conversations" 
ON public.conversations 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.conversation_members cm 
  WHERE cm.conversation_id = conversations.id 
  AND cm.user_id = auth.uid() 
  AND cm.role = 'owner'
));

-- Conversation members policies
CREATE POLICY "Users can view members of conversations they belong to" 
ON public.conversation_members 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.conversation_members cm 
  WHERE cm.conversation_id = conversation_members.conversation_id 
  AND cm.user_id = auth.uid()
));

CREATE POLICY "Users can add themselves to conversations" 
ON public.conversation_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Conversation admins can add members" 
ON public.conversation_members 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.conversation_members cm 
  WHERE cm.conversation_id = conversation_members.conversation_id 
  AND cm.user_id = auth.uid() 
  AND cm.role IN ('owner', 'admin')
));

CREATE POLICY "Users can remove themselves from conversations" 
ON public.conversation_members 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Conversation admins can remove members" 
ON public.conversation_members 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.conversation_members cm 
  WHERE cm.conversation_id = conversation_members.conversation_id 
  AND cm.user_id = auth.uid() 
  AND cm.role IN ('owner', 'admin')
));

-- Messages policies
CREATE POLICY "Users can view messages in conversations they belong to" 
ON public.messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.conversation_members cm 
  WHERE cm.conversation_id = messages.conversation_id 
  AND cm.user_id = auth.uid()
));

CREATE POLICY "Users can send messages to conversations they belong to" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id 
  AND EXISTS (
    SELECT 1 FROM public.conversation_members cm 
    WHERE cm.conversation_id = messages.conversation_id 
    AND cm.user_id = auth.uid()
  )
);

-- Message read receipts policies
CREATE POLICY "Users can view read receipts for conversations they belong to" 
ON public.message_read_receipts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.messages m 
  JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id 
  WHERE m.id = message_read_receipts.message_id 
  AND cm.user_id = auth.uid()
));

CREATE POLICY "Users can mark messages as read" 
ON public.message_read_receipts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', false);

-- Create storage policies for chat files
CREATE POLICY "Users can upload chat files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view chat files in their conversations" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-files');

CREATE POLICY "Users can update their chat files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their chat files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for conversations updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for all chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_read_receipts;