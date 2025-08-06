-- Function to log project creation
CREATE OR REPLACE FUNCTION public.log_project_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'projects' THEN
    INSERT INTO public.activity_logs (project_id, user_id, action, details)
    VALUES (
      NEW.id,
      NEW.created_by,
      'project_created',
      jsonb_build_object(
        'project_name', NEW.project_name,
        'description', NEW.description
      )
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

-- Function to log project member activities
CREATE OR REPLACE FUNCTION public.log_project_member_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  invited_user_name text;
  removed_user_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get the invited user's name
    SELECT full_name INTO invited_user_name
    FROM public.users
    WHERE id = NEW.user_id;
    
    INSERT INTO public.activity_logs (project_id, user_id, action, details)
    VALUES (
      NEW.project_id,
      auth.uid(), -- The user who performed the invitation
      'member_added',
      jsonb_build_object(
        'invited_user_id', NEW.user_id,
        'invited_user_name', COALESCE(invited_user_name, 'Unknown User'),
        'role', NEW.role
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Get the removed user's name
    SELECT full_name INTO removed_user_name
    FROM public.users
    WHERE id = OLD.user_id;
    
    INSERT INTO public.activity_logs (project_id, user_id, action, details)
    VALUES (
      OLD.project_id,
      auth.uid(), -- The user who performed the removal
      'member_removed',
      jsonb_build_object(
        'removed_user_id', OLD.user_id,
        'removed_user_name', COALESCE(removed_user_name, 'Unknown User'),
        'role', OLD.role
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Create trigger for project creation
CREATE TRIGGER projects_activity_trigger
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.log_project_activity();

-- Create trigger for project member changes
CREATE TRIGGER project_members_activity_trigger
  AFTER INSERT OR DELETE ON public.project_members
  FOR EACH ROW
  EXECUTE FUNCTION public.log_project_member_activity();