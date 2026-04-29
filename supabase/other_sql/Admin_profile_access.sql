-- ============================================================
-- AGAPO Migration: Admin User Management Support
-- Run after: 20260320000004_n8n_ai_bridge.sql
-- ============================================================

-- 1. Allow admins to view ALL profiles (not just their own)
--    (A similar policy already exists from FILE3, but it may conflict
--     with the self-only policy. We replace both with combined logic.)

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Single unified SELECT policy: own profile OR admin
CREATE POLICY "View profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

-- 2. Allow admins to update any profile (e.g. full_name, role field)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Allow admins to view ALL user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "View user roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

-- 4. RPC: promote a user to admin (admin-only callable)
CREATE OR REPLACE FUNCTION public.set_user_role(_target_user_id UUID, _new_role app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins may call this
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  -- Upsert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _new_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- If changing TO a role, remove the old one (single-role model)
  DELETE FROM public.user_roles
  WHERE user_id = _target_user_id
    AND role <> _new_role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, app_role) TO authenticated;

-- 5. RPC: list all staff users with their roles (for admin user-management page)
CREATE OR REPLACE FUNCTION public.list_all_users()
RETURNS TABLE (
  user_id    UUID,
  email      TEXT,
  full_name  TEXT,
  role       TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    au.email,
    p.full_name,
    ur.role::TEXT,
    p.created_at
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_all_users() TO authenticated;

-- 6. Add is_active flag to profiles (for deactivating staff without deleting auth user)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Admins can deactivate a user by setting is_active = false
-- The app should check this on login and block access accordingly.
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles (is_active);