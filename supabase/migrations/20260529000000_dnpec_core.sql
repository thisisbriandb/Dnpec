create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

do $$ begin
  create type public.app_role as enum ('super_admin', 'analyste', 'agent_saisie', 'entreprise');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.account_status as enum ('pending', 'validated', 'rejected', 'suspended');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.company_size as enum ('tpe', 'pme', 'grande_entreprise');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.legal_status as enum ('sa', 'sarl', 'suarl', 'gie', 'public', 'autre');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.form_field_type as enum (
    'short_text', 'long_text', 'integer', 'decimal', 'date',
    'single_select', 'multi_select', 'checkbox', 'data_table', 'file'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.form_version_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.campaign_status as enum ('draft', 'scheduled', 'active', 'closed', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.periodicity as enum ('monthly', 'quarterly', 'annual', 'one_off');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.target_status as enum ('waiting', 'in_progress', 'submitted', 'validated', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.submission_status as enum ('draft', 'submitted', 'validated', 'rejected', 'correction_requested');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_status as enum ('queued', 'sent', 'failed', 'read');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.export_format as enum ('xlsx', 'csv', 'stata', 'rds', 'pdf');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.job_status as enum ('queued', 'running', 'completed', 'failed');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role public.app_role not null default 'entreprise',
  account_status public.account_status not null default 'pending',
  phone text,
  division text,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sectors (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  nif text not null unique,
  rccm text,
  name text not null,
  sector_id uuid not null references public.sectors(id),
  size public.company_size not null,
  legal_status public.legal_status not null,
  contact_email text not null,
  phone text not null,
  address text,
  creation_year int check (creation_year is null or creation_year between 1800 and 2100),
  account_status public.account_status not null default 'pending',
  profile_id uuid unique references public.profiles(id) on delete set null,
  rejection_reason text,
  validated_by uuid references public.profiles(id),
  validated_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_templates (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null unique references public.sectors(id) on delete cascade,
  title text not null,
  description text,
  current_version_id uuid,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.form_templates(id) on delete cascade,
  version_number int not null,
  status public.form_version_status not null default 'draft',
  schema jsonb not null default '{"sections":[]}'::jsonb,
  published_by uuid references public.profiles(id),
  published_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (template_id, version_number)
);

do $$ begin
  alter table public.form_templates
    add constraint form_templates_current_version_id_fkey
    foreign key (current_version_id) references public.form_versions(id);
exception when duplicate_object then null;
end $$;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  sector_id uuid not null references public.sectors(id),
  form_version_id uuid not null references public.form_versions(id),
  reference_period text not null,
  periodicity public.periodicity not null,
  status public.campaign_status not null default 'draft',
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  target_mode text not null default 'sector',
  sent_at timestamptz,
  closed_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closes_at > opens_at)
);

create table if not exists public.campaign_targets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  status public.target_status not null default 'waiting',
  last_reminder_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, company_id)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  status public.submission_status not null default 'draft',
  current_version int not null default 1,
  submitted_at timestamptz,
  validated_by uuid references public.profiles(id),
  validated_at timestamptz,
  rejection_comment text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, company_id)
);

create table if not exists public.submission_versions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  version_number int not null,
  answers jsonb not null default '{}'::jsonb,
  completion_rate numeric(5,2) not null default 0 check (completion_rate between 0 and 100),
  submitted_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (submission_id, version_number)
);

create table if not exists public.submission_field_comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  field_key text not null,
  comment text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.submissions(id) on delete cascade,
  submission_version_id uuid references public.submission_versions(id) on delete cascade,
  field_key text,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes <= 10485760),
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  channels text[] not null default array['in_app'],
  status public.notification_status not null default 'queued',
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_table text not null,
  entity_id uuid,
  ip_address inet,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.profiles(id),
  campaign_id uuid references public.campaigns(id),
  format public.export_format not null,
  filters jsonb not null default '{}'::jsonb,
  status public.job_status not null default 'queued',
  storage_path text,
  error_message text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists companies_sector_idx on public.companies(sector_id);
create index if not exists companies_status_idx on public.companies(account_status);
create index if not exists companies_name_trgm_idx on public.companies using gin (name gin_trgm_ops);
create index if not exists campaigns_status_idx on public.campaigns(status);
create index if not exists campaigns_sector_idx on public.campaigns(sector_id);
create index if not exists targets_company_idx on public.campaign_targets(company_id);
create index if not exists submissions_campaign_status_idx on public.submissions(campaign_id, status);
create index if not exists submissions_company_idx on public.submissions(company_id);
create index if not exists submission_versions_answers_gin_idx on public.submission_versions using gin(answers);
create index if not exists notifications_recipient_idx on public.notifications(recipient_id, read_at);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists sectors_set_updated_at on public.sectors;
create trigger sectors_set_updated_at before update on public.sectors
for each row execute function public.set_updated_at();

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at before update on public.companies
for each row execute function public.set_updated_at();

drop trigger if exists form_templates_set_updated_at on public.form_templates;
create trigger form_templates_set_updated_at before update on public.form_templates
for each row execute function public.set_updated_at();

drop trigger if exists campaigns_set_updated_at on public.campaigns;
create trigger campaigns_set_updated_at before update on public.campaigns
for each row execute function public.set_updated_at();

drop trigger if exists submissions_set_updated_at on public.submissions;
create trigger submissions_set_updated_at before update on public.submissions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, account_status, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'entreprise'),
    case
      when coalesce(new.raw_user_meta_data->>'role', 'entreprise') = 'entreprise' then 'pending'::public.account_status
      else 'validated'::public.account_status
    end,
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function public.is_direction()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() in ('super_admin', 'analyste', 'agent_saisie'), false);
$$;

create or replace function public.can_manage()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() in ('super_admin', 'analyste'), false);
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'super_admin', false);
$$;

create or replace function public.owns_company(company uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.companies c
    where c.id = company
      and c.profile_id = (select auth.uid())
      and c.account_status = 'validated'
  );
$$;

alter table public.profiles enable row level security;
alter table public.sectors enable row level security;
alter table public.companies enable row level security;
alter table public.form_templates enable row level security;
alter table public.form_versions enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_targets enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_versions enable row level security;
alter table public.submission_field_comments enable row level security;
alter table public.attachments enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.export_jobs enable row level security;
alter table public.system_settings enable row level security;

create policy "profiles_select_own_or_direction" on public.profiles
for select to authenticated
using ((select auth.uid()) = id or public.is_direction());

create policy "profiles_update_direction" on public.profiles
for update to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "sectors_select_authenticated" on public.sectors
for select to authenticated using (true);

create policy "sectors_manage_admin_analyst" on public.sectors
for all to authenticated
using (public.can_manage())
with check (public.can_manage());

create policy "companies_select_own_or_direction" on public.companies
for select to authenticated
using (public.is_direction() or profile_id = (select auth.uid()));

create policy "companies_insert_self_or_direction" on public.companies
for insert to authenticated
with check (public.can_manage() or profile_id = (select auth.uid()));

create policy "companies_update_direction" on public.companies
for update to authenticated
using (public.can_manage())
with check (public.can_manage());

create policy "form_templates_select_authenticated" on public.form_templates
for select to authenticated using (true);

create policy "form_templates_manage" on public.form_templates
for all to authenticated
using (public.can_manage())
with check (public.can_manage());

create policy "form_versions_select_authenticated" on public.form_versions
for select to authenticated using (true);

create policy "form_versions_manage" on public.form_versions
for all to authenticated
using (public.can_manage())
with check (public.can_manage());

create policy "campaigns_select_direction_or_targeted_company" on public.campaigns
for select to authenticated
using (
  public.is_direction()
  or exists (
    select 1
    from public.campaign_targets ct
    join public.companies c on c.id = ct.company_id
    where ct.campaign_id = campaigns.id
      and c.profile_id = (select auth.uid())
      and campaigns.status in ('active', 'closed', 'archived')
  )
);

create policy "campaigns_manage" on public.campaigns
for all to authenticated
using (public.can_manage())
with check (public.can_manage());

create policy "targets_select_direction_or_company" on public.campaign_targets
for select to authenticated
using (
  public.is_direction()
  or exists (
    select 1 from public.companies c
    where c.id = campaign_targets.company_id
      and c.profile_id = (select auth.uid())
  )
);

create policy "targets_manage" on public.campaign_targets
for all to authenticated
using (public.can_manage())
with check (public.can_manage());

create policy "submissions_select_own_or_direction" on public.submissions
for select to authenticated
using (public.is_direction() or public.owns_company(company_id));

create policy "submissions_insert_own_or_agent" on public.submissions
for insert to authenticated
with check (public.owns_company(company_id) or public.current_app_role() in ('super_admin', 'agent_saisie'));

create policy "submissions_update_own_active_or_validator" on public.submissions
for update to authenticated
using (public.owns_company(company_id) or public.can_manage())
with check (public.owns_company(company_id) or public.can_manage());

create policy "submission_versions_select_own_or_direction" on public.submission_versions
for select to authenticated
using (
  public.is_direction()
  or exists (
    select 1 from public.submissions s
    where s.id = submission_versions.submission_id
      and public.owns_company(s.company_id)
  )
);

create policy "submission_versions_insert_own_or_agent" on public.submission_versions
for insert to authenticated
with check (
  exists (
    select 1 from public.submissions s
    where s.id = submission_versions.submission_id
      and (public.owns_company(s.company_id) or public.current_app_role() in ('super_admin', 'agent_saisie'))
  )
);

create policy "field_comments_select_own_or_direction" on public.submission_field_comments
for select to authenticated
using (
  public.is_direction()
  or exists (
    select 1 from public.submissions s
    where s.id = submission_field_comments.submission_id
      and public.owns_company(s.company_id)
  )
);

create policy "field_comments_insert_validator" on public.submission_field_comments
for insert to authenticated
with check (public.can_manage());

create policy "attachments_select_own_or_direction" on public.attachments
for select to authenticated
using (
  public.is_direction()
  or exists (
    select 1 from public.submissions s
    where s.id = attachments.submission_id
      and public.owns_company(s.company_id)
  )
);

create policy "attachments_insert_submitter" on public.attachments
for insert to authenticated
with check (uploaded_by = (select auth.uid()));

create policy "notifications_select_recipient" on public.notifications
for select to authenticated
using (recipient_id = (select auth.uid()) or public.is_direction());

create policy "notifications_update_recipient_read" on public.notifications
for update to authenticated
using (recipient_id = (select auth.uid()))
with check (recipient_id = (select auth.uid()));

create policy "notifications_insert_direction" on public.notifications
for insert to authenticated
with check (public.can_manage());

create policy "audit_logs_select_super_admin" on public.audit_logs
for select to authenticated
using (public.is_super_admin());

create policy "audit_logs_insert_authenticated" on public.audit_logs
for insert to authenticated
with check (actor_id = (select auth.uid()));

create policy "export_jobs_select_owner_or_direction" on public.export_jobs
for select to authenticated
using (requested_by = (select auth.uid()) or public.can_manage());

create policy "export_jobs_insert_admin_analyst" on public.export_jobs
for insert to authenticated
with check (public.can_manage() and requested_by = (select auth.uid()));

create policy "settings_select_direction" on public.system_settings
for select to authenticated
using (public.is_direction());

create policy "settings_manage_super_admin" on public.system_settings
for all to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

insert into storage.buckets (id, name, public)
values ('justificatifs', 'justificatifs', false)
on conflict (id) do nothing;

drop policy if exists "justificatifs_select" on storage.objects;
create policy "justificatifs_select" on storage.objects
for select to authenticated
using (
  bucket_id = 'justificatifs'
  and (
    owner = (select auth.uid())
    or public.is_direction()
  )
);

drop policy if exists "justificatifs_insert_owner" on storage.objects;
create policy "justificatifs_insert_owner" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'justificatifs'
  and owner = (select auth.uid())
);

drop policy if exists "justificatifs_update_owner" on storage.objects;
create policy "justificatifs_update_owner" on storage.objects
for update to authenticated
using (bucket_id = 'justificatifs' and owner = (select auth.uid()))
with check (bucket_id = 'justificatifs' and owner = (select auth.uid()));

insert into public.system_settings (key, value)
values
  ('auth.access_token_ttl_minutes', '60'::jsonb),
  ('auth.refresh_token_ttl_days', '7'::jsonb),
  ('security.max_login_failures', '5'::jsonb),
  ('security.lockout_minutes', '15'::jsonb),
  ('files.max_upload_mb', '10'::jsonb),
  ('notifications.channels', '["email","sms","in_app"]'::jsonb)
on conflict (key) do nothing;
