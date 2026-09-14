-- Historico "Copiados": painel no admin que guarda o que o usuario colou
-- manualmente (botao "Colar"), para poder recuperar depois -- inclusive de
-- outra maquina, ja que fica salvo no Supabase e nao no navegador local.
--
-- Retencao: sempre mantem os 20 registros mais recentes, independente da
-- idade. Alem desses 20, qualquer registro com mais de 30 dias e apagado.
-- Essa limpeza roda do lado do admin (nao ha cron no Supabase aqui), toda
-- vez que o painel "Copiados" e aberto ou um novo item e adicionado.

create table if not exists public.clipboard_items (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists clipboard_items_created_at_idx on public.clipboard_items(created_at);

comment on table public.clipboard_items is
  'Historico do painel "Copiados" do admin: itens colados manualmente pelo usuario, com limpeza de retencao (20 mais recentes / 30 dias) feita pelo front-end.';

-- Mesma politica simples ja usada nas outras tabelas deste projeto: leitura
-- e escrita liberadas para quem estiver logado no admin (conta compartilhada).
alter table public.clipboard_items enable row level security;

drop policy if exists "clipboard_items_insert" on public.clipboard_items;
create policy "clipboard_items_insert"
  on public.clipboard_items
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "clipboard_items_select" on public.clipboard_items;
create policy "clipboard_items_select"
  on public.clipboard_items
  for select
  to anon, authenticated
  using (true);

drop policy if exists "clipboard_items_delete" on public.clipboard_items;
create policy "clipboard_items_delete"
  on public.clipboard_items
  for delete
  to anon, authenticated
  using (true);
