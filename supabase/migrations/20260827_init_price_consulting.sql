-- Estrutura do projeto Supabase Consultoria-Preço-Venga.
-- O segredo é criado fora do repositório e salvo apenas como hash.
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public;
create table if not exists private.app_secrets(id smallint primary key default 1 check(id=1),secret_hash text not null,rotated_at timestamptz not null default now());
revoke all on private.app_secrets from public,anon,authenticated;
create or replace function private.request_is_trusted() returns boolean language sql stable security definer set search_path=private,pg_catalog,extensions as $$
select exists(select 1 from private.app_secrets where id=1 and secret_hash=encode(extensions.digest(coalesce(current_setting('request.headers',true)::jsonb->>'x-app-secret',''),'sha256'::text),'hex'))
$$;
revoke all on function private.request_is_trusted() from public;
grant execute on function private.request_is_trusted() to anon,authenticated;

create table if not exists public.companies(id text primary key,code text not null,name text not null,cnpj text not null default '',active boolean not null default true,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.company_members(company_id text not null references public.companies(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,role text not null check(role in('admin','editor','viewer')),active boolean not null default true,created_at timestamptz not null default now(),primary key(company_id,user_id));
create table if not exists public.platform_admins(user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now());
create table if not exists public.app_states(company_id text not null,state_key text not null,payload jsonb not null default 'null'::jsonb,source text not null default 'supabase',updated_by uuid references auth.users(id) on delete set null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),primary key(company_id,state_key));
create table if not exists public.documents(id uuid primary key default gen_random_uuid(),company_id text not null,category text not null default 'geral',file_name text not null,storage_path text not null unique,mime_type text,size_bytes bigint check(size_bytes is null or size_bytes>=0),created_by uuid references auth.users(id) on delete set null,created_at timestamptz not null default now());
create index if not exists company_members_user_company_idx on public.company_members(user_id,company_id) where active;
create index if not exists app_states_company_updated_idx on public.app_states(company_id,updated_at desc);
create index if not exists documents_company_created_idx on public.documents(company_id,created_at desc);
create index if not exists app_states_updated_by_idx on public.app_states(updated_by) where updated_by is not null;
create index if not exists documents_created_by_idx on public.documents(created_by) where created_by is not null;

alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.platform_admins enable row level security;
alter table public.app_states enable row level security;
alter table public.documents enable row level security;
grant select,insert,update,delete on public.companies,public.company_members,public.platform_admins,public.app_states,public.documents to anon,authenticated;
create policy companies_trusted_app on public.companies for all to anon,authenticated using(private.request_is_trusted()) with check(private.request_is_trusted());
create policy members_trusted_app on public.company_members for all to anon,authenticated using(private.request_is_trusted()) with check(private.request_is_trusted());
create policy admins_trusted_app on public.platform_admins for all to anon,authenticated using(private.request_is_trusted()) with check(private.request_is_trusted());
create policy states_trusted_app on public.app_states for all to anon,authenticated using(private.request_is_trusted()) with check(private.request_is_trusted());
create policy documents_trusted_app on public.documents for all to anon,authenticated using(private.request_is_trusted()) with check(private.request_is_trusted());

insert into public.companies(id,code,name,cnpj) values('santo-brilho','400','SANTO BRILHO','') on conflict(id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit) values('company-files','company-files',false,52428800) on conflict(id) do nothing;
create policy storage_trusted_select on storage.objects for select to anon,authenticated using(bucket_id='company-files' and private.request_is_trusted());
create policy storage_trusted_insert on storage.objects for insert to anon,authenticated with check(bucket_id='company-files' and private.request_is_trusted());
create policy storage_trusted_update on storage.objects for update to anon,authenticated using(bucket_id='company-files' and private.request_is_trusted()) with check(bucket_id='company-files' and private.request_is_trusted());
create policy storage_trusted_delete on storage.objects for delete to anon,authenticated using(bucket_id='company-files' and private.request_is_trusted());
