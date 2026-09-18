-- =========================================================================
-- PASSO 0 — Auditoria: o que esta exposto hoje?
--
-- Rode isto no SQL Editor do Supabase e me mande o resultado inteiro.
-- Nao altera nada, so lista.
--
-- O que olhar em cada linha:
--   rls_ativo = false            -> tabela TOTALMENTE aberta, RLS nem liga
--   papeis contem "anon"         -> qualquer pessoa com a chave publicavel
--                                   (que esta no codigo-fonte do site, de
--                                   proposito) faz essa operacao sem login
--   condicao = "true"            -> sem nenhum filtro: vale pra todas as linhas
-- =========================================================================

-- 1) A CONSULTA MAIS IMPORTANTE.
--
--    rls_ativo = f        -> tabela SEM PROTECAO NENHUMA. E o pior caso, e o
--                            mais traicoeiro: com o RLS desligado o
--                            pg_policies nao mostra nada, entao a tabela
--                            parece limpa na consulta (2) quando na verdade
--                            esta escancarada.
--    politicas = 0 com rls_ativo = t -> tabela fechada pra todo mundo
--                            (so a service role enxerga)
--    anon_pode com qualquer coisa    -> permissao na raiz pro papel anonimo,
--                            que e o da chave publicavel que fica no
--                            codigo-fonte do site. Sem permissao aqui, o
--                            PostgREST nem chega a avaliar o RLS.
select
  c.relname                                   as tabela,
  c.relrowsecurity                            as rls_ativo,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname) as politicas,
  coalesce((select string_agg(distinct g.privilege_type, ', ' order by g.privilege_type)
              from information_schema.role_table_grants g
             where g.table_schema = 'public'
               and g.table_name = c.relname
               and g.grantee = 'anon'), '-')  as anon_pode,
  coalesce((select string_agg(distinct g.privilege_type, ', ' order by g.privilege_type)
              from information_schema.role_table_grants g
             where g.table_schema = 'public'
               and g.table_name = c.relname
               and g.grantee = 'authenticated'), '-') as logado_pode
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relrowsecurity, c.relname;

-- 2) Todas as politicas RLS: quem pode fazer o que, e sob qual condicao.
select
  tablename                        as tabela,
  policyname                       as politica,
  cmd                              as operacao,
  array_to_string(roles, ', ')     as papeis,
  coalesce(qual, '(sem using)')    as condicao_leitura,
  coalesce(with_check, '(sem check)') as condicao_escrita
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;

-- 3) Buckets do Storage (a galeria de imagens do admin usa um) e suas politicas.
select id as bucket, public as publico, file_size_limit, allowed_mime_types
from storage.buckets
order by id;

select
  policyname                    as politica,
  cmd                           as operacao,
  array_to_string(roles, ', ')  as papeis,
  coalesce(qual, '(sem using)') as condicao
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;

-- 4) A conta compartilhada tem mesmo um TOTP verificado? (se vier vazio, o
--    passo 1 tranca voce pra fora — cadastre o autenticador ANTES de aplicar.)
select
  u.email,
  f.friendly_name as autenticador,
  f.factor_type,
  f.status,
  f.created_at
from auth.mfa_factors f
join auth.users u on u.id = f.user_id
order by f.created_at;
