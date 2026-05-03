-- Run this in the Supabase SQL Editor to create an admin user.
-- Change the email, password, and full_name before running.

DO $$
DECLARE
  new_id uuid := gen_random_uuid();
BEGIN
  -- Insert into auth.users (Supabase auth table)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token,
    recovery_token
  ) VALUES (
    new_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@example.com',                          -- ← change this
    crypt('motdepasse123', gen_salt('bf')),        -- ← change this
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Administrateur","role":"admin"}', -- ← change full_name if needed
    false,
    'authenticated',
    'authenticated',
    '',
    ''
  );

  -- Required for email/password login to work
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_id,
    jsonb_build_object('sub', new_id::text, 'email', 'admin@example.com'), -- ← same email
    'email',
    new_id::text,
    now(),
    now()
  );

  -- The trigger on_auth_user_created will auto-create the profile with role='admin'
  -- from raw_user_meta_data above. Nothing else to do.
END;
$$;
