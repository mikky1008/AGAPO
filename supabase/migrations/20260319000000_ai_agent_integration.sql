-- ============================================================
-- AGAPO Migration: AI Agent Integration
-- Based on CEO ERD — agapo_erd.html
-- ============================================================

-- 1. Add new columns to seniors table
ALTER TABLE public.seniors
  ADD COLUMN IF NOT EXISTS illness_severity TEXT DEFAULT 'None',
  ADD COLUMN IF NOT EXISTS last_aid_date DATE,
  ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS priority_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agent_reasoning TEXT;

-- 2. Add new columns to notifications table
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS senior_id UUID REFERENCES public.seniors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS triggered_by TEXT DEFAULT 'system';

-- 3. Create ai_agent_logs table (NEW)
CREATE TABLE IF NOT EXISTS public.ai_agent_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  senior_id UUID NOT NULL REFERENCES public.seniors(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_priority TEXT,
  new_priority TEXT,
  score INTEGER,
  reasoning TEXT,
  triggered_by TEXT DEFAULT 'ai_agent',
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view ai logs"
  ON public.ai_agent_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert ai logs"
  ON public.ai_agent_logs FOR INSERT TO authenticated WITH CHECK (true);

-- 4. Trigger to auto-update seniors.last_aid_date on assistance insert
CREATE OR REPLACE FUNCTION public.update_last_aid_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.seniors
  SET last_aid_date = NEW.date_given
  WHERE id = NEW.senior_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_assistance_inserted ON public.assistance_records;
CREATE TRIGGER on_assistance_inserted
  AFTER INSERT ON public.assistance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_last_aid_date();
