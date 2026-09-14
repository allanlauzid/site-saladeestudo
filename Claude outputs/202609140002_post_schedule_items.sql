-- Cronograma de Posts: um post por dia do cronograma (data, formato,
-- título-resumo, texto do post quando for Feed, e o prompt de imagem).
-- Cada linha pertence a um public.post_schedules.

create table if not exists public.post_schedule_items (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.post_schedules(id) on delete cascade,
  post_date date not null,
  formato text not null,
  titulo text,
  texto text,
  prompt_imagem text not null,
  created_at timestamptz not null default now()
);

create index if not exists post_schedule_items_schedule_id_idx on public.post_schedule_items(schedule_id);
create index if not exists post_schedule_items_post_date_idx on public.post_schedule_items(post_date);

comment on table public.post_schedule_items is
  'Um post por dia de um Cronograma de Posts: data, formato (1:1 | 4:5 | 9:16), titulo-resumo, texto do post (so Feed) e prompt de imagem, importados do texto colado do LLM.';
comment on column public.post_schedule_items.formato is
  '1:1 (feed quadrado, padrao) | 4:5 (feed retangular) | 9:16 (story)';
comment on column public.post_schedule_items.texto is
  'Texto escrito do post (legenda). So existe para formato 1:1/4:5 (Feed) -- Story (9:16) e so imagem, sem texto escrito separado.';

alter table public.post_schedule_items enable row level security;

drop policy if exists "post_schedule_items_insert" on public.post_schedule_items;
create policy "post_schedule_items_insert"
  on public.post_schedule_items
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "post_schedule_items_select" on public.post_schedule_items;
create policy "post_schedule_items_select"
  on public.post_schedule_items
  for select
  to anon, authenticated
  using (true);

drop policy if exists "post_schedule_items_delete" on public.post_schedule_items;
create policy "post_schedule_items_delete"
  on public.post_schedule_items
  for delete
  to anon, authenticated
  using (true);
