-- ============================================================
-- NCSC / ECA Payout Tracker
-- National Commission of Senior Citizens - Progressive Payouts
-- Ages: 80, 85, 90, 95 → ₱10,000 each | Age 100 → ₱100,000
-- ============================================================

CREATE TABLE public.ncsc_payouts (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  senior_id     UUID NOT NULL REFERENCES public.seniors(id) ON DELETE CASCADE,
  milestone_age INTEGER NOT NULL CHECK (milestone_age IN (80, 85, 90, 95, 100)),
  amount        NUMERIC(12, 2) NOT NULL,
  date_given    DATE NOT NULL DEFAULT CURRENT_DATE,
  given_by      TEXT NOT NULL,
  remarks       TEXT,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Enforce: one payout per senior per milestone age
  UNIQUE (senior_id, milestone_age)
);

ALTER TABLE public.ncsc_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view ncsc payouts"
  ON public.ncsc_payouts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert ncsc payouts"
  ON public.ncsc_payouts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update ncsc payouts"
  ON public.ncsc_payouts FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete ncsc payouts"
  ON public.ncsc_payouts FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_ncsc_payouts_updated_at
  BEFORE UPDATE ON public.ncsc_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Optional: notify all users when an NCSC payout is recorded
CREATE OR REPLACE FUNCTION public.notify_ncsc_payout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  senior_name TEXT;
  milestone_label TEXT;
BEGIN
  SELECT first_name || ' ' || last_name INTO senior_name
  FROM public.seniors WHERE id = NEW.senior_id;

  milestone_label := CASE
    WHEN NEW.milestone_age = 100 THEN 'Centenarian (₱100,000)'
    ELSE 'Age ' || NEW.milestone_age || ' (₱10,000)'
  END;

  INSERT INTO public.notifications (user_id, message, type)
  SELECT p.user_id,
    'NCSC payout recorded for ' || COALESCE(senior_name, 'Unknown')
      || ' — ' || milestone_label || ' milestone.',
    'info'
  FROM public.profiles p;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_ncsc_payout_created
  AFTER INSERT ON public.ncsc_payouts
  FOR EACH ROW EXECUTE FUNCTION public.notify_ncsc_payout();

-- NOTE: priority_level column on seniors table is intentionally retained
-- for historical data compatibility, but is no longer used in the application UI.
-- You may optionally drop it later with:
--   ALTER TABLE public.seniors DROP COLUMN IF EXISTS priority_level;
