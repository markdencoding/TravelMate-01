-- ==============================================================================
-- File: supabase/checks/schema_audit.sql
-- Description: Read-only schema verification & RLS introspection queries.
-- Execute in Supabase SQL Editor or via psql to audit database security posture.
-- ==============================================================================

-- 1. Check Row Level Security (RLS) status across all public tables
-- Expectation: ALL tables must have rls_enabled = true.
select
  schemaname,
  tablename,
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
order by tablename;

-- 2. Inspect active policies per table, command, and permissive rules
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;

-- 3. Check table privileges for 'anon' and 'authenticated' roles
-- Expectation: 'anon' has NO privileges; 'authenticated' has minimal required CRUD.
select
  table_schema,
  table_name,
  grantee,
  string_agg(privilege_type, ', ' order by privilege_type) as granted_privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
group by table_schema, table_name, grantee
order by table_name, grantee;

-- 4. Check active triggers on public tables and auth.users
select
  event_object_schema as trigger_schema,
  event_object_table as target_table,
  trigger_name,
  event_manipulation as event,
  action_timing as timing,
  action_statement as statement
from information_schema.triggers
where (event_object_schema = 'public' or (event_object_schema = 'auth' and event_object_table = 'users'))
order by event_object_schema, event_object_table, trigger_name;

-- 5. Foreign Key & Constraint Integrity Check
select
  conrelid::regclass as table_name,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(c.oid) as constraint_definition
from pg_constraint c
join pg_namespace n on n.oid = c.connamespace
where n.nspname = 'public'
order by conrelid::regclass::text, contype, conname;

-- 6. Index Coverage Check
select
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;
