-- NOC Desk: jalankan seluruh isi file ini di Supabase > SQL Editor

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  site text not null,
  status text not null default 'baru'
    check (status in ('baru', 'dicek', 'menunggu', 'selesai')),
  priority text not null default 'normal'
    check (priority in ('urgent', 'normal', 'rendah')),
  waiting_on text not null default ''
    check (waiting_on in ('', 'Pelanggan', 'Teknisi', 'Internal')),
  waiting_name text not null default '',
  follow_up date,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.ticket_notes (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists tickets_user_status_idx on public.tickets (user_id, status);
create index if not exists ticket_notes_ticket_idx on public.ticket_notes (ticket_id, created_at);

alter table public.tickets enable row level security;
alter table public.ticket_notes enable row level security;

drop policy if exists "tickets_own" on public.tickets;
create policy "tickets_own" on public.tickets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notes_own" on public.ticket_notes;
create policy "notes_own" on public.ticket_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ Peran user (superadmin / user) ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  role text not null default 'user' check (role in ('superadmin', 'user')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- User hanya boleh MEMBACA profilnya sendiri. Tidak ada policy insert/update/delete
-- untuk klien, jadi tidak ada yang bisa menaikkan perannya sendiri.
-- Penambahan/penghapusan user dilakukan lewat api/admin-users.js (service role).
drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own" on public.profiles
  for select using (auth.uid() = id);

-- ============ v2: RFO + penanganan ============

-- Waktu kejadian, penyebab, tindakan (untuk RFO)
alter table public.tickets add column if not exists incident_at timestamptz;
update public.tickets set incident_at = created_at where incident_at is null;
alter table public.tickets alter column incident_at set default now();
alter table public.tickets alter column incident_at set not null;

alter table public.tickets add column if not exists cause text not null default '';
alter table public.tickets add column if not exists action text not null default '';

-- Penanganan: Teknisi / Tim Metro / NOC / Pelanggan  ("Internal" lama -> "NOC")
alter table public.tickets drop constraint if exists tickets_waiting_on_check;
update public.tickets set waiting_on = 'NOC' where waiting_on = 'Internal';
alter table public.tickets add constraint tickets_waiting_on_check
  check (waiting_on in ('', 'Teknisi', 'Tim Metro', 'NOC', 'Pelanggan'));

-- Untuk tab Riwayat
create index if not exists tickets_closed_idx on public.tickets (user_id, closed_at desc);
