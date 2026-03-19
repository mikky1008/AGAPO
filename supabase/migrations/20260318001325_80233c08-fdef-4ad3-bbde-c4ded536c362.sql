
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role app_role;
BEGIN
  -- Read intended role from user metadata, default to 'staff'
  _role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::app_role,
    'staff'
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  RETURN NEW;
END;
$function$;
