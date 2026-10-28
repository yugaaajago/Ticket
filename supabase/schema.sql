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
