-- Jalankan SETELAH membuat user di Supabase > Authentication > Users > Add user
-- dengan email: yugaachi@nocdesk.app  (centang "Auto Confirm User")
insert into public.profiles (id, username, role)
select id, 'yugaachi', 'superadmin'
from auth.users
where email = 'yugaachi@nocdesk.app'
on conflict (id) do update set username = 'yugaachi', role = 'superadmin';
