INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'email',
  '{"sub":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee","email":"denial-test@test.local","email_verified":true}',
  now(), now(), now()
) ON CONFLICT DO NOTHING;