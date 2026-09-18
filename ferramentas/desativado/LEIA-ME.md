# Código desativado

## provider-manager.js

Roteador de provedores de IA (Google, OpenAI, Anthropic, Groq e outros),
com detecção automática do provedor pelo formato da chave e chamada via
edge function `ai-provider-router` do Supabase.

**Não está ligado em lugar nenhum.** Verificado em 18/09/2026: nenhuma
página do site carrega este arquivo, e o `admin.html` não tem nenhum
vestígio da lógica dele — nenhuma referência à tabela `gemini_api_keys`,
a `generativelanguage.googleapis.com` nem a `functions.invoke`. As tabelas
que o admin realmente usa são `themes`, `post_schedules`, `clipboard_items`,
`access_logs`, `settings`, `skills` e `game_sessions`.

Foi movido para cá em vez de apagado porque:

- a edge function correspondente (`supabase/functions/ai-provider-router/`)
  continua no repositório e pode estar publicada no Supabase;
- o código está completo e funcional — se a ideia for retomada, basta
  voltar o arquivo para a raiz e adicionar a tag `<script>` no `admin.html`.

Se for retomado, note que ele já reconhece o formato novo de chave do
Google AI Studio (`AQ.Ab...`), além do antigo (`AIza...`).

Se a decisão for abandonar de vez, dá para apagar este arquivo e a pasta
`supabase/functions/ai-provider-router/` — o histórico do Git guarda tudo.
