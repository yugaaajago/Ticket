-- NOC Desk v2: jalankan di Supabase > SQL Editor (aman dijalankan berulang)

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
