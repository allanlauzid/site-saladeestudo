# Acesso ao admin: o que esta errado e o plano

Escrito em 18/09/2026.

## O problema

O `index.html` tem, em texto puro, o e-mail e a senha da conta compartilhada
do Supabase. Qualquer pessoa que abra o codigo-fonte do site le. Mas isso e o
**segundo** problema.

O primeiro e maior: as tabelas do admin aceitam leitura e escrita do papel
`anon` — o papel da chave publicavel, que fica no fonte do site de proposito e
nao tem como sair de la. Ou seja, **nem a senha e necessaria**. Com um `curl`
da pra ler o historico de "Copiados", os agendamentos de post e os logs de
acesso sem passar por login nenhum.

O codigo de 6 digitos (TOTP) nao protege nada disso. Ele decide se a *tela* do
admin abre — e a verificacao acontece no navegador, onde quem quiser pula
fora. O dado nunca foi protegido por ele.

## O plano, em 3 passos

### Passo 0 — auditoria  ·  `sql/002_auditoria_rls.sql`

Lista toda tabela do banco, se o RLS esta ligado, quais permissoes `anon` e
`authenticated` tem, e todas as politicas. Nao altera nada. A ultima consulta
confirma que existe um autenticador TOTP verificado — sem isso o passo 1
tranca voce pra fora.

### Passo 1 — fazer o TOTP valer de verdade  ·  `sql/003_rls_admin_exige_totp.sql`

O Supabase grava no token o nivel de autenticacao:

- `aal1` — entrou so com e-mail e senha
- `aal2` — entrou **e** confirmou o codigo de 6 digitos

As politicas passam a exigir `aal2`. A partir dai a senha exposta no site nao
abre nada sozinha, e o TOTP deixa de ser enfeite: sem ele o banco responde
vazio, nao importa por onde a pessoa entre.

Tres situacoes diferentes:

- **tabelas do admin** (`themes`, `settings`, `skills`, `access_logs`,
  `post_schedules`, `post_schedule_items`, `clipboard_items`): `anon` perde
  toda permissao; `authenticated` so passa com `aal2`.
- **`game_sessions`**: o site publico precisa gravar a partida de quem nem
  esta logado. Passa a gravar por duas funcoes (`registrar_partida` e
  `finalizar_partida`), e o `anon` fica sem permissao nenhuma na tabela. Ler o
  analytics exige `aal2`.
- **`novidades`**: nao e tocada. A leitura publica dela e o que faz a pagina
  Novidades funcionar pra quem visita o site.

Verificado numa replica do schema em Postgres 16 antes de entregar: `anon`
barrado, `aal1` devolve zero linhas, `aal2` le e escreve normalmente,
Novidades segue publica, e o fluxo do jogo (registrar + finalizar partida)
continua funcionando pelas funcoes.

### Passo 2 — tirar a senha da pagina (Edge Function)

Formato escolhido: a Rubia continua so digitando os 6 digitos, sem senha.

1. Uma Edge Function `admin-login` guarda e-mail e senha como *secrets* do
   Supabase (nunca vao pro navegador).
2. O `index.html` manda so o codigo de 6 digitos pra funcao.
3. A funcao faz `signInWithPassword` → `mfa.challenge` → `mfa.verify` com o
   codigo, e devolve pro navegador os tokens de uma sessao ja em `aal2`.
4. O navegador chama `setSession(...)` com esses tokens e segue pro admin.

Resultado: a senha some do fonte, a verificacao do codigo passa a acontecer no
servidor (onde da pra limitar tentativas), e a experiencia da Rubia nao muda.

### Depois dos 3 passos

- **Trocar a senha da conta compartilhada.** Ela esta no historico do Git e
  continua la mesmo depois de sair do arquivo. Enquanto nao for trocada, o
  passo 2 nao termina de verdade.
- **`gemini_api_keys`**: tabela morta (o `provider-manager.js` que usava isso
  esta em `ferramentas/desativado/`). O passo 1 fecha o acesso; confira o
  conteudo e depois `drop table`.
- **Politicas do Storage**: a galeria do admin usa um bucket. O passo 0 lista
  as politicas dele — se estiverem abertas pro `anon`, mesmo tratamento.

## Bug encontrado no caminho

O `game-analytics.js` mandava o campo como `trigger`, mas a coluna se chama
`trigger_source`. O erro era engolido por um `.then(function(){}, function(){})`
vazio, entao **nenhuma partida chegou a ser gravada** desde que o analytics
existe — a aba "Analytics (jogos)" do admin sempre esteve vazia por isso, nao
por falta de gente jogando. Corrigido junto com a mudanca para as funcoes.
