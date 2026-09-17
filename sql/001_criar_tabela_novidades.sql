-- ============================================================================
-- Novidades (Sala de Estudo) — tabela onde os posts gerados automaticamente
-- toda semana ficam salvos, e de onde o site público lê para exibir.
--
-- Como rodar: Supabase → seu projeto → SQL Editor → cole este arquivo inteiro
-- → Run. É seguro rodar uma vez só (usa "if not exists").
-- ============================================================================

create table if not exists public.novidades (
    id          uuid primary key default gen_random_uuid(),
    created_at  timestamptz not null default now(),
    tema        text not null check (tema in ('enem_vestibular', 'dicas_estudo', 'educacao_pe')),
    titulo      text not null,
    resumo      text not null,
    corpo       text not null,
    fontes      jsonb not null default '[]'::jsonb,
    slug        text not null unique
);

-- Índice para a query mais comum do site: "últimos posts, do mais novo pro mais velho"
create index if not exists novidades_created_at_idx on public.novidades (created_at desc);

-- Row Level Security: qualquer visitante do site pode LER (select).
-- Ninguém (nem o próprio site) pode inserir/editar/apagar usando a chave pública
-- (anon key) — só o script automatizado pode, porque ele usa a service_role key,
-- que ignora RLS. Isso evita que alguém de fora escreva "novidades" falsas no seu banco.
alter table public.novidades enable row level security;

drop policy if exists "novidades_select_publico" on public.novidades;
create policy "novidades_select_publico"
    on public.novidades
    for select
    to anon, authenticated
    using (true);

-- (De propósito, não existe policy de insert/update/delete aqui — fica bloqueado
-- por padrão para as chaves públicas. Só a service_role key, guardada como secret
-- no GitHub Actions, consegue escrever.)
