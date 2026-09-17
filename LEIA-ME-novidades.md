# Novidades automáticas — Sala de Estudo

Toda segunda-feira, 9h (horário de Recife), um robô no GitHub busca notícias
recentes, pede pro Gemini escrever um post original em cima delas e publica na
seção "Novidades" do site. Sem intervenção manual depois de configurado.

Os temas entram em rodízio, um por semana: **ENEM/vestibular (SSA)** →
**dicas de estudo** → **educação em Recife/PE**.

## Arquivos (já instalados no repositório)

```
.github/workflows/gerar-novidades.yml   → o robô agendado
scripts/gerar-novidade.mjs              → busca notícia + gera texto + salva
sql/001_criar_tabela_novidades.sql      → cria a tabela no Supabase (1x só)
novidades.html / .js / .css             → a página e os cards do site
index.html                              → seção "Novidades" (3 mais recentes)
```

Enquanto a tabela não existir (ou não houver post), a seção na home **some
sozinha** — a home fica exatamente como está hoje.

## O que falta fazer (só você consegue, precisa de login)

### 1. Criar a tabela no Supabase

[supabase.com/dashboard](https://supabase.com/dashboard) → projeto
`fesejrbindspzafiyssm` (o mesmo do admin) → **SQL Editor** → cole o conteúdo de
`sql/001_criar_tabela_novidades.sql` → **Run**. É seguro, usa `if not exists`.

### 2. Pegar a service_role key do Supabase

Mesmo projeto → **Project Settings → API** → copie a chave **`service_role`**.
⚠️ Não é a `anon`/`publishable`. Essa é secreta e nunca pode entrar em arquivo
do site.

### 3. Cadastrar os 3 secrets no GitHub

Repositório `allanlauzid/site-saladeestudo` → **Settings → Secrets and
variables → Actions** → aba **Secrets** → **New repository secret**:

| Nome | Valor |
|---|---|
| `GEMINI_API_KEY` | sua chave do Google AI Studio (`AQ.Ab...` ou `AIza...`) |
| `SUPABASE_URL` | `https://fesejrbindspzafiyssm.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | a chave do passo 2 |

### 4. Testar sem esperar a segunda-feira

Aba **Actions** → **Gerar novidade semanal** → **Run workflow** → em
`tema_forcado` deixe `auto` (ou escolha um tema) → **Run**. Leva ~30 segundos.

- Deu certo: confira em **Table Editor → novidades** no Supabase, e abra
  `novidades.html` no site.
- Deu erro: clique na execução vermelha, o log mostra a mensagem em português.

## Ajustes depois

- **Frequência:** linha `cron:` no `.yml` (ex.: `"0 12 * * 1,4"` = segunda e
  quinta). O horário é em UTC; Recife é UTC-3.
- **Temas e buscas:** objeto `TEMAS` no topo do `scripts/gerar-novidade.mjs`.
- **Trocar o modelo do Gemini:** crie uma *variable* (não secret) chamada
  `GEMINI_MODEL` em Settings → Secrets and variables → Actions → aba
  **Variables**. Sem ela, usa `gemini-3.6-flash`.
- **Revisar antes de publicar:** hoje o post vai direto pro ar. Se quiser
  aprovação manual, dá pra acrescentar uma coluna `publicado boolean default
  false` na tabela e filtrar por ela no `novidades.js`.

## Detalhes de robustez já embutidos

- Se o Google News falhar (403, timeout), o script **não quebra**: segue sem
  notícias e o Gemini escreve uma dica prática atemporal.
- Chamada ao Gemini com até 3 tentativas (429 e erros 5xx) e chave enviada no
  cabeçalho `x-goog-api-key` — compatível com o formato novo de chave (`AQ.`).
- Se a IA repetir um título no mesmo dia, o post é salvo com sufixo em vez de
  falhar por slug duplicado.
- O workflow só tem permissão de leitura do repositório e não roda duas vezes
  em paralelo.
- A tabela tem RLS: o site (chave pública) só consegue **ler**; escrever, só a
  service_role guardada no GitHub.

⚠️ Workflows agendados do GitHub são desativados automaticamente após **60
dias sem nenhuma atividade** no repositório. Se ficar muito tempo sem commits,
reative na aba Actions.
