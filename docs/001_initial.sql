-- Quorum initial relational model
-- Store derived facts separately from original message and attachment data.
-- Do not store phone numbers as public identifiers.

create extension if not exists pgcrypto;

create table cases (
  id uuid primary key default gen_random_uuid(),
  photon_conversation_ref text not null,
  opened_by_ref text not null,
  status text not null check (status in ('open', 'deliberating', 'ruled', 'closed', 'deleted')),
  requested_amount text,
  requested_currency text,
  requested_action text,
  opened_at timestamptz not null default now(),
  closes_at timestamptz,
  deleted_at timestamptz
);

create table case_messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  photon_message_ref text not null,
  sender_ref text not null,
  body_ciphertext text,
  attachment_hash text,
  included_by_user boolean not null default true,
  received_at timestamptz not null,
  expires_at timestamptz not null
);

create table exhibits (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  exhibit_type text not null,
  status text not null check (status in ('supporting', 'conflicting', 'unavailable', 'inconclusive')),
  observed_fact text not null,
  source_label text not null,
  source_reference text,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  checked_at timestamptz not null default now(),
  user_visible_summary text not null
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  participant_ref text not null,
  joined_at timestamptz not null default now(),
  unique (case_id, participant_ref)
);

create table testimonies (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  vote text check (vote in ('vouch', 'object', 'unknown')),
  statement text,
  first_hand boolean not null default false,
  created_at timestamptz not null default now()
);

create table verdicts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  outcome text not null check (outcome in ('pay', 'pause', 'walk_away')),
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  strongest_risk text not null,
  unresolved_evidence text not null,
  receipt_text text not null,
  issued_at timestamptz not null default now()
);

create table retention_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  requested_by_ref text not null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create index cases_conversation_idx on cases(photon_conversation_ref);
create index exhibits_case_idx on exhibits(case_id, checked_at desc);
create index testimonies_case_idx on testimonies(case_id, created_at);
