alter table public.gemini_api_keys
  add column if not exists provider text,
  add column if not exists base_url text,
  add column if not exists key_mask text,
  add column if not exists models_cache jsonb not null default '[]'::jsonb,
  add column if not exists models_checked_at timestamptz,
  add column if not exists provider_note text;

update public.gemini_api_keys
set key_mask = case
  when length(api_key) >= 9 then left(api_key, 4) || '••••••••' || right(api_key, 4)
  else '••••••••'
end
where key_mask is null;

create index if not exists gemini_api_keys_provider_idx
  on public.gemini_api_keys(provider);

comment on column public.gemini_api_keys.provider is
  'Provedor detectado automaticamente pelo painel ou pela Edge Function.';
comment on column public.gemini_api_keys.base_url is
  'Endpoint opcional para APIs compatíveis com o protocolo da OpenAI.';
comment on column public.gemini_api_keys.models_cache is
  'Modelos que a chave conseguiu listar na última verificação.';

-- A tabela mantém o nome histórico para preservar os registros atuais.
-- Antes da publicação definitiva, restrinja o acesso direto a api_key via RLS
-- e permita que somente a Edge Function com service role leia o valor completo.
