-- Nullify the assigned_by reference to the orphaned test user
UPDATE public.user_roles 
SET assigned_by = NULL 
WHERE assigned_by = '3f0ab9e2-3409-4802-be9f-7f1f4b6bb0af';

-- Delete the orphaned test user from auth.users
DELETE FROM auth.users WHERE id = '3f0ab9e2-3409-4802-be9f-7f1f4b6bb0af';