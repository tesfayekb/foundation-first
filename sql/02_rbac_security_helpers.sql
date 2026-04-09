-- =============================================================================
-- Phase 2 RBAC Security Definer Helper Functions
-- APPLY ORDER: Run AFTER 01_rbac_schema.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND r.key = 'superadmin'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND r.key = _role_key
  )
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL OR _permission_key IS NULL THEN
    RETURN false;
  END IF;
  IF public.is_superadmin(_user_id) THEN
    RETURN true;
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id
      AND p.key = _permission_key
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_authorization_context()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _roles TEXT[];
  _permissions TEXT[];
  _is_superadmin BOOLEAN;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(array_agg(r.key), ARRAY[]::TEXT[])
  INTO _roles
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = _user_id;

  _is_superadmin := 'superadmin' = ANY(_roles);

  IF _is_superadmin THEN
    SELECT COALESCE(array_agg(p.key), ARRAY[]::TEXT[])
    INTO _permissions
    FROM public.permissions p;
  ELSE
    SELECT COALESCE(array_agg(DISTINCT p.key), ARRAY[]::TEXT[])
    INTO _permissions
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id;
  END IF;

  RETURN jsonb_build_object(
    'roles', to_jsonb(_roles),
    'permissions', to_jsonb(_permissions),
    'is_superadmin', _is_superadmin
  );
END;
$$;
