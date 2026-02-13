cat > supabase-schema.sql << 'EOF'
create table public.interview_events (
  id uuid not null default gen_random_uuid(),
  request_id text not null,
  session_id text not null,
  transcript text null,
  confidence double precision null,
  raw_llm text null,
  timestamp bigint null,
  created_at timestamp with time zone null default now(),
  constraint interview_events_pkey primary key (id)
);

create index if not exists idx_events_session
  on public.interview_events using btree (session_id, created_at);

create index if not exists idx_events_request_id
  on public.interview_events using btree (request_id);

alter table interview_events enable row level security;
create policy "Allow all for anon" on interview_events for all using (true);
EOF
