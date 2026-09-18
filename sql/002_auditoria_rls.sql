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

-- 1) Tabelas, se o RLS esta ligado, e quais permissoes o PostgREST concede
--    para anon/authenticated (grants sao a primeira barreira, antes do RLS).
select
  t.tablename                                as tabela,
  c.relrowsecurity                           as rls_ativo,
  c.relforcerowsecurity                      as rls_forcado,
  coalesce(string_agg(distinct g.privilege_type || ':' || g.grantee, ', '
           order by g.privilege_type || ':' || g.grantee), '(nenhum)') as grants
from pg_tables t
join pg_class c        on c.relname = t.tablename
join pg_namespace n    on n.oid = c.relnamespace and n.nspname = t.schemaname
left join information_schema.role_table_grants g
       on g.table_schema = t.schemaname
      and g.table_name   = t.tablename
      and g.grantee in ('anon','authenticated')
where t.schemaname = 'public'
group by t.tablename, c.relrowsecurity, c.relforcerowsecurity
order by t.tablename;

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
