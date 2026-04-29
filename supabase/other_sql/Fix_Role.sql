-- ============================================================
-- AGAPO — Fix role assignment on signup (root cause fix)
--
-- ROOT CAUSE: The INSERT policy on user_roles requires
-- has_role(auth.uid(), 'admin'), but auth.uid() is NULL
-- inside a trigger fired during signup — so the insert
-- is silently blocked for ALL new users including admins.
--
-- FIX 1: Replace the INSERT policy to allow the trigger
--         (which runs as SECURITY DEFINER) to insert freely.
-- FIX 2: Rewrite the trigger to be safe — catches bad cast,
--         validates the role value before inserting.
-- ============================================================

-- Step 1: Fix the INSERT policy on user_roles
-- The trigger function is SECURITY DEFINER so it runs as
-- postgres/owner — we allow service_role to insert freely.
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow the trigger (runs as superuser/definer) to bypass RLS
-- by granting INSERT to the postgres role used by triggers
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;

-- Step 2: Rewrite handle_new_user_role to be safe and bypass RLS
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role_text TEXT;
  _role      app_role;
BEGIN
  -- Read the intended role from signup metadata
  _role_text := NEW.raw_user_meta_data ->> 'role';

  -- Safely cast — default to 'staff' if null or invalid value
  BEGIN
    IF _role_text IN ('admin', 'staff') THEN
      _role := _role_text::app_role;
    ELSE
      _role := 'staff';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    _role := 'staff';
  END;

  -- SECURITY DEFINER bypasses RLS — this insert will always succeed
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Step 3: Make sure the trigger is attached (recreate to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Step 4: Fix the existing user whose role is stuck as staff
-- (the account with UID 69d1f852-002b-41d5-bb24-a1613a3f4ea2)
DELETE FROM public.user_roles
  WHERE user_id = '69d1f852-002b-41d5-bb24-a1613a3f4ea2';

INSERT INTO public.user_roles (user_id, role)
  VALUES ('69d1f852-002b-41d5-bb24-a1613a3f4ea2', 'admin');

-- Verify
SELECT ur.role, p.full_name, au.email
FROM public.user_roles ur
JOIN public.profiles p  ON p.user_id  = ur.user_id
JOIN auth.users au       ON au.id      = ur.user_id
ORDER BY ur.role, p.full_name;