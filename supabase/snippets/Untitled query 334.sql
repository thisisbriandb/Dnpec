update auth.users
set encrypted_password = crypt('Etienne2000', gen_salt('bf')),
    updated_at = now()
where email = 'admin@gnpec.com';
