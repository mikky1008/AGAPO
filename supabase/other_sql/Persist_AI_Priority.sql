
CREATE OR REPLACE FUNCTION public.stamp_priority_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.priority_level IS DISTINCT FROM OLD.priority_level
     OR NEW.priority_score IS DISTINCT FROM OLD.priority_score
  THEN
    NEW.priority_updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_priority_changed ON public.seniors;
CREATE TRIGGER on_priority_changed
  BEFORE UPDATE ON public.seniors
  FOR EACH ROW EXECUTE FUNCTION public.stamp_priority_updated_at();

-- 2. Secure RPC for N8N to call after AI scoring
--    N8N will POST to Supabase Edge Function which then calls this RPC.
--    Input: senior_id, new score, new level, AI reasoning text, triggered_by label.
CREATE OR REPLACE FUNCTION public.apply_ai_priority(
  _senior_id    UUID,
  _score        INTEGER,
  _level        TEXT,        -- 'High' | 'Medium' | 'Low'
  _reasoning    TEXT,
  _triggered_by TEXT DEFAULT 'n8n_agent'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _old_level TEXT;
BEGIN
  -- Fetch current level for the log
  SELECT priority_level INTO _old_level FROM public.seniors WHERE id = _senior_id;

  -- Update the senior record
  UPDATE public.seniors SET
    priority_score       = _score,
    priority_level       = _level,
    agent_reasoning      = _reasoning,
    priority_updated_at  = now()
  WHERE id = _senior_id;

  -- Write to ai_agent_logs (immutable audit trail of AI decisions)
  INSERT INTO public.ai_agent_logs
    (senior_id, action, old_priority, new_priority, score, reasoning, triggered_by)
  VALUES
    (_senior_id, 'priority_update', _old_level, _level, _score, _reasoning, _triggered_by);
END;
$$;

-- 3. RLS: only authenticated users can call this function; it is SECURITY DEFINER
--    so the actual table writes bypass RLS (needed because N8N uses service role key).
--    Nothing extra needed — SECURITY DEFINER functions run as the function owner.

-- 4. Grant for anon/service role so N8N can invoke via Supabase REST
GRANT EXECUTE ON FUNCTION public.apply_ai_priority(UUID, INTEGER, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_ai_priority(UUID, INTEGER, TEXT, TEXT, TEXT) TO service_role;

-- 5. Expose ai_agent_logs to realtime so the frontend can watch live AI updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_agent_logs;

-- 6. Add index for fast recent-log queries
CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_senior ON public.ai_agent_logs (senior_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_time ON public.ai_agent_logs (triggered_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.system_logs;