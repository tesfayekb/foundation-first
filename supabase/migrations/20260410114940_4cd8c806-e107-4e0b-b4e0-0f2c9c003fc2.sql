DELETE FROM public.audit_logs WHERE actor_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' AND action = 'auth.permission_denied';
DELETE FROM public.user_roles WHERE user_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
DELETE FROM public.profiles WHERE id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
DELETE FROM auth.identities WHERE user_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
DELETE FROM auth.users WHERE id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';