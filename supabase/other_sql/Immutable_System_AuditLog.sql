
CREATE POLICY "System triggers can insert logs"
  ON public.system_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Index for fast filtering by table + time
CREATE INDEX IF NOT EXISTS idx_system_logs_table_name ON public.system_logs (table_name, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_performed_by ON public.system_logs (performed_by, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_record_id ON public.system_logs (record_id);

-- ============================================================
-- 2. Generic trigger function that writes to system_logs
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_system_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id   UUID;
  _record_id UUID;
  _old_data  JSONB;
  _new_data  JSONB;
BEGIN
  -- Attempt to read the current authenticated user
  BEGIN
    _user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    _user_id := NULL;
  END;

  IF TG_OP = 'INSERT' THEN
    _record_id := (NEW.id)::UUID;
    _old_data  := NULL;
    _new_data  := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    _record_id := (NEW.id)::UUID;
    _old_data  := to_jsonb(OLD);
    _new_data  := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    _record_id := (OLD.id)::UUID;
    _old_data  := to_jsonb(OLD);
    _new_data  := NULL;
  END IF;

  INSERT INTO public.system_logs
    (performed_by, action, table_name, record_id, old_data, new_data)
  VALUES
    (_user_id, TG_OP, TG_TABLE_NAME, _record_id, _old_data, _new_data);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================
-- 3. Attach audit triggers to key tables
-- ============================================================

-- seniors
DROP TRIGGER IF EXISTS audit_seniors ON public.seniors;
CREATE TRIGGER audit_seniors
  AFTER INSERT OR UPDATE OR DELETE ON public.seniors
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

-- assistance_records
DROP TRIGGER IF EXISTS audit_assistance_records ON public.assistance_records;
CREATE TRIGGER audit_assistance_records
  AFTER INSERT OR UPDATE OR DELETE ON public.assistance_records
  FOR EACH ROW E-- ============================================================
-- AGAPO Migration: Immutable System Audit Log
-- Run after: 20260319000000_ai_agent_integration.sql
-- ============================================================

-- 1. Create system_logs table (append-only, no UPDATE/DELETE policy)
CREATE TABLE IF NOT EXISTS public.system_logs (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  performed_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  action        TEXT        NOT NULL,          -- 'INSERT' | 'UPDATE' | 'DELETE'
  table_name    TEXT        NOT NULL,          -- 'seniors' | 'assistance_records' | 'profiles' …
  record_id     UUID,                          -- the PK of the affected row
  old_data      JSONB,                         -- snapshot before change (NULL on INSERT)
  new_data      JSONB,                         -- snapshot after change  (NULL on DELETE)
  ip_address    TEXT,                          -- optional: passed from app via set_config
  logged_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No UPDATE or DELETE policy — rows are write-once (immutable)
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system logs"
  ON public.system_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
XECUTE FUNCTION public.log_system_action();

-- profiles (staff account changes)
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

-- user_roles (role assignments)
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();