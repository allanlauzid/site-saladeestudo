-- Analytics dos minigames (easter eggs de clique no site publico).
-- Cada linha e uma partida: comeca com "started_at" preenchido e
-- "finished_at" nulo; quando o jogo termina (ou o jogador fecha/sai),
-- o front-end tenta atualizar "finished_at". Se a atualizacao nunca
-- chegar (aba fechada, sem internet etc.), a partida fica registrada
-- como iniciada mas nao concluida -- o que tambem e um dado util.

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  game text not null check (game in ('jogo-da-velha', 'forca')),
  trigger_source text not null check (trigger_source in ('fundo', 'mascote')),
  visitor_id text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  outcome text
);

create index if not exists game_sessions_game_idx on public.game_sessions(game);
create index if not exists game_sessions_visitor_idx on public.game_sessions(visitor_id);
create index if not exists game_sessions_started_at_idx on public.game_sessions(started_at);

comment on table public.game_sessions is
  'Registro de partidas dos minigames (easter eggs) do site publico, usado na aba Analytics do admin.';
comment on column public.game_sessions.trigger_source is
  'Qual easter egg iniciou a partida: clique de fundo (sorteio) ou clique na cabeca do mascote.';
comment on column public.game_sessions.visitor_id is
  'Id anonimo gerado no navegador do visitante (localStorage), sem relacao com contas de usuario.';

-- Mesma politica de acesso simples ja usada nas outras tabelas publicas
-- deste projeto: leitura e escrita liberadas para a chave anonima
-- (nao ha dado sensivel aqui, so estatistica de uso dos jogos).
alter table public.game_sessions enable row level security;

drop policy if exists "game_sessions_insert_anon" on public.game_sessions;
create policy "game_sessions_insert_anon"
  on public.game_sessions
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "game_sessions_update_anon" on public.game_sessions;
create policy "game_sessions_update_anon"
  on public.game_sessions
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "game_sessions_select_anon" on public.game_sessions;
create policy "game_sessions_select_anon"
  on public.game_sessions
  for select
  to anon, authenticated
  using (true);
