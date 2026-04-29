
CREATE OR REPLACE FUNCTION public.notify_new_senior()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, message, type, senior_id, triggered_by)
  SELECT
    p.user_id,
    'New senior ' || NEW.first_name || ' ' || NEW.last_name || ' has been registered.',
    'new_senior',
    NEW.id,
    'system'
  FROM public.profiles p
  -- Only notify users who have not explicitly turned this off
  WHERE NOT EXISTS (
    SELECT 1 FROM public.notification_preferences np
    WHERE np.user_id = p.user_id
      AND np.new_senior = false
  );
  RETURN NEW;
END;
$$;

-- ── notify_assistance_added ──────────────────────────────────
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

  INSERT INTO public.notifications (user_id, message, type, senior_id, triggered_by)
  SELECT
    p.user_id,
    'Assistance added for ' || COALESCE(senior_name, 'Unknown') || ' — ' || NEW.type || '.',
    'assistance_added',
    NEW.senior_id,
    'system'
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.notification_preferences np
    WHERE np.user_id = p.user_id
      AND np.assistance_added = false
  );
  RETURN NEW;
END;
$$;

-- ── notify_high_priority ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_high_priority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.priority_level = 'High' AND (OLD.priority_level IS NULL OR OLD.priority_level <> 'High') THEN
    INSERT INTO public.notifications (user_id, message, type, senior_id, triggered_by)
    SELECT
      p.user_id,
      NEW.first_name || ' ' || NEW.last_name || ' has been flagged as High Priority.',
      'high_priority',
      NEW.id,
      'system'
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.notification_preferences np
      WHERE np.user_id = p.user_id
        AND np.high_priority = false
    );
  END IF;
  RETURN NEW;
END;
$$;

-- ── notify_assistance_completed ──────────────────────────────
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

    INSERT INTO public.notifications (user_id, message, type, senior_id, triggered_by)
    SELECT
      p.user_id,
      'Assistance for ' || COALESCE(senior_name, 'Unknown') || ' has been marked as Completed.',
      'assistance_completed',
      NEW.senior_id,
      'system'
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.notification_preferences np
      WHERE np.user_id = p.user_id
        AND np.assistance_completed = false
    );
  END IF;
  RETURN NEW;
END;
$$;

