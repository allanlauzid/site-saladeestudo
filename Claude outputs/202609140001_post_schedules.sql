-- Cronograma de Posts: cabeçalho de cada cronograma gerado (período,
-- configuração escolhida pelo usuário e o texto bruto colado do LLM,
-- guardado para referência/depuração).
--
-- Retenção: cronogramas com mais de 18 meses (created_at) são apagados.
-- Não há cron no Supabase aqui — a limpeza roda do lado do admin, toda
-- vez que a aba "Cronograma de Posts" é aberta (mesmo padrão já usado
-- pelo painel "Copiados").

create table if not exists public.post_schedules (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  start_date date not null,
  end_date date not null,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'aguardando_importacao',
  raw_import text,
  created_at timestamptz not null default now()
);

create index if not exists post_schedules_created_at_idx on public.post_schedules(created_at);

comment on table public.post_schedules is
  'Cabecalho de cada Cronograma de Posts gerado no admin: periodo, configuracao (dias da semana, formato por dia, etc.) e o texto colado do LLM. Retencao de 18 meses feita pelo front-end.';
comment on column public.post_schedules.status is
  'aguardando_importacao | importado';
comment on column public.post_schedules.config is
  'JSON com a configuracao escolhida: semanas, dias da semana marcados, se o formato 4:5 esta habilitado, e o formato por dia quando personalizado manualmente (senao o LLM decide).';

alter table public.post_schedules enable row level security;

drop policy if exists "post_schedules_insert" on public.post_schedules;
create policy "post_schedules_insert"
  on public.post_schedules
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "post_schedules_select" on public.post_schedules;
create policy "post_schedules_select"
  on public.post_schedules
  for select
  to anon, authenticated
  using (true);

drop policy if exists "post_schedules_update" on public.post_schedules;
create policy "post_schedules_update"
  on public.post_schedules
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "post_schedules_delete" on public.post_schedules;
create policy "post_schedules_delete"
  on public.post_schedules
  for delete
  to anon, authenticated
  using (true);
