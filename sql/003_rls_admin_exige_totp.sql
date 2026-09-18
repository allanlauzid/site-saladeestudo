-- =========================================================================
-- PASSO 1 — Fazer o TOTP valer de verdade.
--
-- HOJE: as tabelas do admin aceitam leitura e escrita do papel "anon", ou
-- seja, de qualquer pessoa que pegue a chave publicavel no codigo-fonte do
-- site. O codigo de 6 digitos so decide se a TELA do admin abre; ele nao
-- protege o DADO. Da pra ler o historico de "Copiados", os agendamentos e
-- os logs de acesso sem nunca passar pelo login.
--
-- DEPOIS: o dado so responde para uma sessao que passou pelo autenticador.
-- O Supabase marca no token o nivel de autenticacao (claim "aal"):
--     aal1 = entrou so com e-mail e senha
--     aal2 = entrou e confirmou o codigo de 6 digitos
-- As politicas abaixo exigem aal2. Com isso a senha que esta no fonte do
-- site deixa de abrir qualquer coisa sozinha.
--
-- -------------------------------------------------------------------------
-- ANTES DE RODAR, CONFIRA DUAS COISAS
--
--  1. Rode o sql/002_auditoria_rls.sql e veja se a consulta (4) devolve um
--     autenticador com status "verified". Se vier vazia, NAO rode este
--     arquivo: voce se tranca pra fora do proprio painel.
--
--  2. Confira a lista TABELAS_ADMIN abaixo contra o resultado da consulta
--     (1) da auditoria. Montei a lista a partir das tabelas que o
--     assets/js/admin.js usa; se a auditoria mostrar alguma tabela que eu
--     nao listei, me avise antes de aplicar.
--
-- Da pra voltar atras: o DO abaixo so mexe nas tabelas listadas, e o
-- Supabase guarda um backup diario do banco.
-- =========================================================================

begin;

-- -------------------------------------------------------------------------
-- 1. Tabelas que so o admin pode ver ou mexer.
--    Apaga qualquer politica existente nelas e recria exigindo aal2.
-- -------------------------------------------------------------------------
do $$
declare
  TABELAS_ADMIN text[] := array[
    'themes',
    'settings',
    'skills',
    'access_logs',
    'post_schedules',
    'post_schedule_items',
    'clipboard_items'
  ];
  t     text;
  pol   record;
begin
  foreach t in array TABELAS_ADMIN loop
    if to_regclass('public.' || t) is null then
      raise notice 'pulando %: tabela nao existe', t;
      continue;
    end if;

    -- tira a permissao do papel anonimo na raiz: sem grant, o PostgREST nem
    -- chega a avaliar o RLS
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);

    execute format('alter table public.%I enable row level security', t);

    -- limpa as politicas antigas (nomes variam; por isso o loop)
    for pol in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy %I on public.%I', pol.policyname, t);
    end loop;

    -- uma politica por operacao, todas exigindo sessao com TOTP confirmado
    execute format($f$
      create policy "%1$s_admin_aal2_select" on public.%1$I
        for select to authenticated
        using ((select auth.jwt() ->> 'aal') = 'aal2')
    $f$, t);

    execute format($f$
      create policy "%1$s_admin_aal2_insert" on public.%1$I
        for insert to authenticated
        with check ((select auth.jwt() ->> 'aal') = 'aal2')
    $f$, t);

    execute format($f$
      create policy "%1$s_admin_aal2_update" on public.%1$I
        for update to authenticated
        using ((select auth.jwt() ->> 'aal') = 'aal2')
        with check ((select auth.jwt() ->> 'aal') = 'aal2')
    $f$, t);

    execute format($f$
      create policy "%1$s_admin_aal2_delete" on public.%1$I
        for delete to authenticated
        using ((select auth.jwt() ->> 'aal') = 'aal2')
    $f$, t);

    raise notice 'trancada: %', t;
  end loop;
end $$;

-- -------------------------------------------------------------------------
-- 2. game_sessions: o visitante escreve por FUNCAO, nunca na tabela.
--
--    O site publico precisa registrar a partida de quem nem esta logado.
--    Dar insert/update direto na tabela pro papel anonimo nao resolve: pra
--    fechar a partida o front faz "update ... where id = <uuid>", e nesse
--    caso o Postgres tambem aplica a politica de SELECT -- ou seja, eu teria
--    que deixar o anonimo LER a tabela, que e exatamente o que quero evitar.
--
--    Solucao: duas funcoes security definer. O visitante chama a funcao; ela
--    escreve por baixo do RLS. O anonimo fica sem nenhuma permissao na
--    tabela: nao le, nao escreve, nao descobre o que tem la dentro.
--    (o assets/js/game-analytics.js foi ajustado pra chamar estas funcoes)
-- -------------------------------------------------------------------------
do $$
declare pol record;
begin
  if to_regclass('public.game_sessions') is null then
    raise notice 'pulando game_sessions: tabela nao existe';
    return;
  end if;

  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'game_sessions'
  loop
    execute format('drop policy %I on public.game_sessions', pol.policyname);
  end loop;

  revoke all on public.game_sessions from anon;
  grant select, insert, update, delete on public.game_sessions to authenticated;
  alter table public.game_sessions enable row level security;

  -- ler/mexer na base de partidas: so o admin com TOTP
  create policy "game_sessions_admin_aal2_select" on public.game_sessions
    for select to authenticated using ((select auth.jwt() ->> 'aal') = 'aal2');
  create policy "game_sessions_admin_aal2_delete" on public.game_sessions
    for delete to authenticated using ((select auth.jwt() ->> 'aal') = 'aal2');

  raise notice 'game_sessions: tabela fechada; escrita publica passa a ser por funcao';
end $$;

create or replace function public.registrar_partida(
  p_id uuid, p_game text, p_trigger text, p_visitor text
) returns void
language sql security definer set search_path = public as $$
  insert into public.game_sessions (id, game, trigger_source, visitor_id)
  values (p_id, p_game, p_trigger, p_visitor)
  on conflict (id) do nothing;
$$;

create or replace function public.finalizar_partida(
  p_id uuid, p_outcome text
) returns void
language sql security definer set search_path = public as $$
  update public.game_sessions
     set finished_at = now(), outcome = p_outcome
   where id = p_id and finished_at is null;
$$;

revoke all on function public.registrar_partida(uuid, text, text, text) from public;
revoke all on function public.finalizar_partida(uuid, text) from public;
grant execute on function public.registrar_partida(uuid, text, text, text) to anon, authenticated;
grant execute on function public.finalizar_partida(uuid, text) to anon, authenticated;

-- -------------------------------------------------------------------------
-- 3. gemini_api_keys: tabela morta.
--    O provider-manager.js que usava isso foi desativado (esta em
--    ferramentas/desativado/). Enquanto ela existir guardando chave de API,
--    e risco a toa. Aqui so fecho o acesso; o drop fica pra quando voce
--    confirmar que nao ha nada util dentro.
-- -------------------------------------------------------------------------
do $$
declare pol record;
begin
  if to_regclass('public.gemini_api_keys') is null then
    raise notice 'gemini_api_keys nao existe (nada a fazer)';
    return;
  end if;

  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'gemini_api_keys'
  loop
    execute format('drop policy %I on public.gemini_api_keys', pol.policyname);
  end loop;

  revoke all on public.gemini_api_keys from anon, authenticated;
  alter table public.gemini_api_keys enable row level security;
  -- sem nenhuma politica + sem grant = so a service role (Edge Functions e
  -- o painel do Supabase) enxerga

  raise notice 'gemini_api_keys: fechada (confira o conteudo e depois: drop table)';
end $$;

-- -------------------------------------------------------------------------
-- 4. novidades NAO e tocada de proposito: a leitura publica dela e o que faz
--    a pagina Novidades funcionar pra quem visita o site. A escrita ja e
--    so pela service role (GitHub Actions), como esta no 001.
-- -------------------------------------------------------------------------

commit;

-- =========================================================================
-- CONFERENCIA DEPOIS DE APLICAR
--
-- a) Rode de novo o sql/002_auditoria_rls.sql: nenhuma tabela do admin pode
--    aparecer com "anon" nos papeis (so game_sessions, em insert/update).
--
-- b) Teste o buraco na pratica, num terminal qualquer. Isto usa a chave
--    publicavel que esta no site, SEM login nenhum:
--
--    curl "https://fesejrbindspzafiyssm.supabase.co/rest/v1/clipboard_items?select=*" \
--      -H "apikey: sb_publishable_mGEU6ouQVdIt1G97ENAq_w_tX8uknCK"
--
--    ANTES deste arquivo: devolve o historico de Copiados.
--    DEPOIS: deve devolver erro 401 / "permission denied for table
--    clipboard_items" -- a permissao foi tirada na raiz, entao nem chega a
--    consultar as linhas.
--
-- c) Abra o admin normalmente e confirme que tudo continua funcionando
--    DEPOIS de digitar os 6 digitos. Se alguma aba ficar vazia, a tabela
--    dela provavelmente ficou de fora da lista TABELAS_ADMIN — me diga qual.
-- =========================================================================
