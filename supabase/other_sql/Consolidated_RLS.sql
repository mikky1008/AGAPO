-- ============================================================
-- AGAPO — FINAL CONSOLIDATED MIGRATION (idempotent)
-- ============================================================

-- ── PART 1: Profile visibility ───────────────────────────────
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles"    ON public.profiles;
DROP POLICY IF EXISTS "View profiles"                   ON public.profiles;

CREATE POLICY "View profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── PART 2: User roles visibility ───────────────────────────
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "View user roles"                ON public.user_roles;

CREATE POLICY "View user roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

-- ── PART 3: is_active flag on profiles ──────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles (is_active);

-- ── PART 4: RPC — set_user_role ─────────────────────────────
CREATE OR REPLACE FUNCTION public.set_user_role(
  _target_user_id UUID,
  _new_role        app_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target_user_id, _new_role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, app_role) TO authenticated;

-- ── PART 5: RPC — list_all_users ────────────────────────────
DROP FUNCTION IF EXISTS public.list_all_users();
CREATE OR REPLACE FUNCTION public.list_all_users()
RETURNS TABLE (
  user_id    UUID,
  email      TEXT,
  full_name  TEXT,
  role       TEXT,
  is_active  BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    u.email::TEXT,
    p.full_name,
    COALESCE(ur.role::TEXT, 'staff'),
    p.is_active,
    p.created_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_all_users() TO authenticated;

-- ── PART 6: RPC — toggle_user_active ────────────────────────
CREATE OR REPLACE FUNCTION public.toggle_user_active(
  _target_user_id UUID,
  _is_active       BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  UPDATE public.profiles SET is_active = _is_active WHERE user_id = _target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_user_active(UUID, BOOLEAN) TO authenticated;