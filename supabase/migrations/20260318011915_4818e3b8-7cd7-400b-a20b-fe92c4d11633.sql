
-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  new_senior BOOLEAN NOT NULL DEFAULT true,
  assistance_added BOOLEAN NOT NULL DEFAULT true,
  high_priority BOOLEAN NOT NULL DEFAULT true,
  assistance_completed BOOLEAN NOT NULL DEFAULT true,
  email_new_senior BOOLEAN NOT NULL DEFAULT true,
  email_assistance_added BOOLEAN NOT NULL DEFAULT true,
  email_high_priority BOOLEAN NOT NULL DEFAULT true,
  email_assistance_completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.notification_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.notification_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.notification_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Trigger function: notify all users when a senior is registered
CREATE OR REPLACE FUNCTION public.notify_new_senior()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, message, type)
  SELECT p.user_id,
    'New senior ' || NEW.first_name || ' ' || NEW.last_name || ' has been registered.',
    'new_senior'
  FROM public.profiles p;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_senior_created
  AFTER INSERT ON public.seniors
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_senior();

-- Trigger function: notify all users when assistance record is added
CREATE OR REPLACE FUNCTION public.notify_assistance_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  senior_name TEXT;
BEGIN
  SELECT first_name || ' ' || last_name INTO senior_name
  FROM public.seniors WHERE id = NEW.senior_id;
  
  INSERT INTO public.notifications (user_id, message, type)
  SELECT p.user_id,
    'Assistance added for ' || COALESCE(senior_name, 'Unknown') || ' — ' || NEW.type || '.',
    'assistance_added'
  FROM public.profiles p;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_assistance_created
  AFTER INSERT ON public.assistance_records
  FOR EACH ROW EXECUTE FUNCTION public.notify_assistance_added();

-- Trigger function: notify when senior flagged High Priority
CREATE OR REPLACE FUNCTION public.notify_high_priority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.priority_level = 'High' AND (OLD.priority_level IS NULL OR OLD.priority_level <> 'High') THEN
    INSERT INTO public.notifications (user_id, message, type)
    SELECT p.user_id,
      NEW.first_name || ' ' || NEW.last_name || ' has been flagged as High Priority.',
      'high_priority'
    FROM public.profiles p;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_senior_high_priority
  AFTER UPDATE ON public.seniors
  FOR EACH ROW EXECUTE FUNCTION public.notify_high_priority();

-- Trigger function: notify when assistance marked Completed
CREATE OR REPLACE FUNCTION public.notify_assistance_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  senior_name TEXT;
BEGIN
  IF NEW.status = 'Completed' AND (OLD.status IS NULL OR OLD.status <> 'Completed') THEN
    SELECT first_name || ' ' || last_name INTO senior_name
    FROM public.seniors WHERE id = NEW.senior_id;
    
    INSERT INTO public.notifications (user_id, message, type)
    SELECT p.user_id,
      'Assistance for ' || COALESCE(senior_name, 'Unknown') || ' has been marked as Completed.',
      'assistance_completed'
    FROM public.profiles p;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_assistance_completed
  AFTER UPDATE ON public.assistance_records
  FOR EACH ROW EXECUTE FUNCTION public.notify_assistance_completed();
