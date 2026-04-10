INSERT INTO auth.users (
  id, instance_id, aud, role, email, 
  encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'denial-test@test.local',
  crypt('DenialTest123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"email":"denial-test@test.local","email_verified":true}',
  now(), now()
) ON CONFLICT (id) DO NOTHING;