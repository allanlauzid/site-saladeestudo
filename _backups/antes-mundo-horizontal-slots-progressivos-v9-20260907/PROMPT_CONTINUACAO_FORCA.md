# Prompt de continuação — easter egg do jogo da forca

Copie todo o texto abaixo para outra IA caso seja necessário continuar o trabalho fora desta conversa.

---

Trabalhe no projeto local:

`C:\Users\Allan\Documents\___Freelance_Kupim Digital___\Rubia (Sala de Estudo)\_site-atual`

## Objetivo geral

Implementar por fases um easter egg de jogo da forca usando o SVG existente do mascote no `index.html`, com rig articulado nos ombros, cotovelos, quadris e joelhos. Use GSAP para a coreografia e `requestAnimationFrame` quando ele for realmente necessário para sincronização, máscaras ou coordenadas.

## Restrições obrigatórias

- Preserve o site atual, a intro, o jogo da velha, o card flutuante e o badge da Kupim Digital.
- Não altere o listener nem o sorteio dos 10 cliques existentes em `game-jogodavelha.js`.
- O jogo da forca deve continuar sendo iniciado externamente pela função global `window.startHangmanGame()`.
- Não acrescente um listener de ativação da forca nesta fase.
- Trabalhe em apenas um checkpoint por vez.
- Ao final de cada checkpoint, valide visualmente no navegador, pare e aguarde aprovação do usuário.
- Atualize este arquivo ao final de cada etapa para que ele continue servindo como prompt de transferência.
- Preserve todas as mudanças locais que não pertençam a este easter egg.

## Estado atual verificado

Os checkpoints 1 a 4 foram concluídos e aprovados:

1. Projeto e SVG inspecionados.
2. Criado `svg/mascote-animavel.svg`; o SVG original foi preservado.
3. SVG animável integrado inline no `index.html`, sem alteração visual da pose inicial.
4. Implementada a sequência livro → cabeça → apoio → levantar.

O checkpoint 5 foi implementado e teve sua mecânica aprovada:

5. Walk cycle no lugar, com dois ciclos completos, alternância de pernas, contrabalanço dos braços e oscilação vertical da cabeça/tronco. O personagem retorna à pose neutra em pé ao concluir.

O checkpoint 5B foi implementado e aprovado pelo usuário:

- O rig deixou de aparecer como um esqueleto fino de linhas.
- Braços e pernas agora são cápsulas preenchidas e arredondadas, com espessura compatível com o ícone original.
- O tronco ganhou uma pele sólida e afunilada, calculada a partir dos pontos do rig.
- Um ciclo de `requestAnimationFrame` sincroniza essa pele com a linha central animada do tronco e é encerrado automaticamente após a timeline.
- A transição inicial mantém a leitura visual do mesmo mascote sentado, levantando e caminhando.

O checkpoint 6 acaba de ser implementado e aguarda aprovação visual do usuário:

- O SVG agora possui `#hangman-world`, grupo que representa o mundo horizontal acompanhado pela câmera.
- O rig móvel fica dentro de `#character-travel`, permitindo separar deslocamento físico do personagem e deslocamento da câmera.
- Durante dois ciclos de caminhada, o personagem avança 24 unidades no mundo.
- A câmera avança 30 unidades e termina ligeiramente à frente do personagem, abrindo espaço visual para os elementos das próximas etapas.
- Mesa, cadeira e livro permanecem ancorados ao mundo e saem juntos para a esquerda.
- O livro recebe uma compensação de `-24` unidades por estar estruturalmente dentro do rig; assim, não acompanha o personagem.
- Ao concluir, é disparado o evento `hangman:camera-complete`.

Antes de iniciar o checkpoint 7, o usuário decidiu criar as poses finais manualmente. Foi criado um checkpoint intermediário: o editor visual de poses do mascote. Ele está implementado e aguarda avaliação do usuário:

- `Claude outputs/mascot-pose-editor.html` é uma ferramenta local e independente; não altera o `index.html` nem inicia o jogo.
- O SVG original sentado aparece como referência sobre a prancheta, com controle de visibilidade e opacidade.
- O modelo editável separa cabeça, tronco, dois braços com cotovelos e dois pares coxa/canela com joelhos.
- Pontos circulares movem articulações e extremidades; losangos remodelam a curvatura de cada segmento.
- A cabeça pode ser movida e redimensionada; o tronco possui seis pontos de contorno.
- A opção `Cores por peça` identifica cada parte com uma cor diferente.
- O editor foi ampliado após a primeira avaliação: braços e pernas agora são caminhos fechados preenchidos, cada segmento com oito pontos azuis de contorno independentes.
- A cabeça possui oito pontos radiais de contorno, além dos controles gerais de largura e altura.
- O tronco possui dez pontos editáveis de silhueta. O botão `Contorno` mostra ou oculta os controles adicionais da peça selecionada.
- Os círculos brancos e losangos continuam controlando articulações/eixo; os pontos azuis controlam somente a borda visível, permitindo assimetria e variação de volume.
- Há referências prontas para sentado, em pé, passada esquerda e passada direita.
- Poses personalizadas podem ser salvas no navegador, duplicadas, excluídas, desfeitas e refeitas.
- A pose pode ser copiada ou exportada em JSON e SVG, e um JSON exportado pode ser importado novamente.

## Arquivos principais do easter egg

- `index.html`: contém o SVG inline articulado e carrega GSAP 3.13 antes do script da forca.
- `svg/mascote-animavel.svg`: cópia animável independente do mascote.
- `hangman-animation.js`: timeline GSAP, poses e API pública.
- `Claude outputs/hangman-checkpoint-4.html`: prévia da etapa de levantar.
- `Claude outputs/hangman-checkpoint-5.html`: prévia atual do checkpoint 5B, com botões para reproduzir e recomeçar.
- `Claude outputs/hangman-checkpoint-6.html`: prévia atual do mundo horizontal e da câmera.
- `Claude outputs/mascot-pose-editor.html`: editor visual de poses.
- `Claude outputs/mascot-pose-editor.css`: aparência responsiva do editor.
- `Claude outputs/mascot-pose-editor.js`: modelagem, poses, histórico, armazenamento e exportação.
- `game-jogodavelha.js`: deve permanecer intacto; contém `CLICKS_TO_TRIGGER = 10`.

## API e eventos atuais

- `window.startHangmanGame()`: reinicia a pose e executa levantar + caminhada.
- `window.resetHangmanAnimation()`: volta ao mascote original sentado.
- `window.HangmanAnimation.start()` e `.reset()` expõem as mesmas operações.
- Evento `hangman:standing`: disparado quando o mascote termina de levantar.
- Evento `hangman:walk-complete`: disparado ao concluir a caminhada.
- Evento `hangman:camera-complete`: disparado quando a câmera chega ao enquadramento final.

O livro permanece sobre a mesa após ser abaixado. A mobília não faz parte do rig corporal.

## Validações já realizadas

- `hangman-animation.js` passa em `node --check`.
- O SVG externo é XML válido.
- O valor `CLICKS_TO_TRIGGER = 10` continua presente e inalterado.
- A pose original aparece antes da ativação.
- Cotovelos e joelhos permanecem conectados durante as poses.
- A caminhada foi medida no DOM para confirmar alternância real das coordenadas.
- A silhueta preenchida foi inspecionada no início da transição, durante o movimento e na pose final.
- O navegador não registrou erros da animação refinada.
- No fim do checkpoint 6, os transforms verificados são: mundo `x = -30`, personagem `x = 24` e compensação do livro `x = -24`.
- O navegador não registrou erros durante o acompanhamento da câmera.
- `mascot-pose-editor.js` passa em `node --check`.
- No editor, foram validados no navegador: pose sentada, pose em pé, cores por peça, arraste de articulação, seleção de peça, ajuste de espessura, desfazer, salvar/excluir pose local e cópia de JSON.
- O JSON copiado foi lido de volta com 23 pontos, medidas da cabeça e espessuras das partes.
- Após a ampliação, o formato de exportação passou para a versão 2 e inclui `contours`; membros são exportados como paths fechados preenchidos.
- Foram confirmados no navegador oito pontos de contorno por membro, oito na cabeça, dez pontos editáveis no tronco e alteração real do path ao arrastar uma borda.
- A pose temporária criada no teste foi excluída; o editor foi deixado limpo.

## Próximo passo

### Novo modelo aprovado em princípio pelo usuário

O usuário redesenhou o mascote no Inkscape e confirmou que aquela é a forma definitiva desejada. O arquivo autoral foi preservado em dois lugares:

- Fonte editada por Allan: `C:\Users\Allan\Documents\Codex\2026-09-05\referenced-chatgpt-conversation-this-is-an\outputs\mascote-poses-inkscape.svg`.
- Cópia imutável de trabalho: `svg/mascote-modelo-allan-fonte.svg`.

Foi criada `svg/mascote-modelo-allan.svg`, uma cópia técnica limpa que preserva exatamente as formas de Allan e possui:

- seis peças lógicas marcadas com `data-piece`: cabeça, tronco, dois braços e duas pernas;
- antebraços e canelas como subarticulações aninhadas;
- IDs estáveis para GSAP;
- pivôs registrados em `data-pivot`;
- modo colorido de inspeção e classe `single-color` para voltar ao azul da marca.

Foi criada a prévia isolada `Claude outputs/hangman-modelo-allan-preview.html`. Ela mostra o novo modelo sentado, levantando e executando uma caminhada curta. O deslocamento fica quase parado na prévia; o avanço real continuará sendo combinado com a câmera do checkpoint 6.

O SVG é XML válido, contém exatamente seis atributos `data-piece`, o JavaScript da prévia passa na validação sintática e o navegador não registrou erros.

Primeiro peça ao usuário para validar visualmente essa prévia:

`http://127.0.0.1:8765/Claude%20outputs/hangman-modelo-allan-preview.html`

Não substitua ainda o SVG inline do `index.html` sem essa aprovação. Após a aprovação, faça uma integração isolada do novo modelo no fluxo existente e valide novamente sentado → levantar → caminhada antes de retomar o checkpoint 7.

Somente quando o usuário aprovar a prévia do modelo de Allan e a integração isolada, retome o fluxo pelo checkpoint 7: slots dinâmicos `_`. Os slots devem existir dentro de `#hangman-world`, à frente do personagem, para entrarem naturalmente no enquadramento criado pelo checkpoint 6. Não implemente ainda a forca, a atuação de horror, a desmontagem ou o gameplay.

Depois do checkpoint 7, valide visualmente, atualize este arquivo e pare novamente.

## Checkpoint de integração do modelo aprovado v7 (concluído e APROVADO por Allan)

Seguindo `PACOTE_CLAUDE_EASTER_EGG_v7/PROMPT_IMPLEMENTAR_EASTER_EGG_CLAUDE.md`, o rig provisório baseado em linhas foi substituído pelas 23 poses aprovadas por Allan:

- `mascote-pose-data.js` (pacote v7) foi copiado para a raiz do site e é carregado no `index.html` antes de `hangman-animation.js`.
- Dentro de `#character-travel`, o antigo `#character-rig` com `<line>`/`<circle>` foi substituído por seis grupos `.mascot-piece` (`leg-right`, `arm-right`, `torso`, `leg-left`, `arm-left`, `head`), cada um contendo os `<path>` correspondentes às chaves de `mascote-pose-data.js` (`thigh-right-shape`, `shin-right-shape`, `upper-arm-right-shape`, `forearm-right-shape`, `torso-shape-allan`, `thigh-left-shape`, `shin-left-shape`, `upper-arm-left-shape`, `forearm-left-shape`, `head-shape-allan`).
- As cores por peça aprovadas na prévia foram preservadas (perna direita marrom, braço direito verde, tronco azul, perna esquerda rosa, braço esquerdo vermelho, cabeça roxa) — o braço fica mais aparente em verde depois do giro, conforme aprovação.
- `hangman-animation.js` foi reescrito: `startHangmanGame()` agora aplica a pose 0 (sentado lendo) nos `<path>` do rig ainda invisível, faz uma troca instantânea de opacidade entre `#rest-character` e `#character-rig` (sem flash, pois a pose 0 reproduz a mesma silhueta da pose de descanso) e reproduz as 23 poses interpolando o atributo `d` de cada `<path>` via GSAP, na ordem e durações do pacote aprovado.
- A caminhada usa os frames 8 a 15 do pacote, repetidos em 2 ciclos (mantendo a convenção "dois ciclos completos" já aprovada em checkpoints anteriores), e reaproveita o deslocamento já existente de `#character-travel` (`x: 24`) e da câmera `#hangman-world` (`x: -30`) criado no checkpoint 6 — não foi necessário redesenhar o mundo/câmera nesta etapa.
- A cabeça continua como peça flutuante; o encontro visual com o corpo só acontece nas poses 20 e 22, exatamente como vem nos paths do pacote v7 (nenhuma lógica extra foi adicionada para isso).
- `resetHangmanAnimation()` mata a timeline ativa, zera `x` de `#hangman-world`/`#character-travel`, reaplica a pose 0 nos paths e volta a exibir `#rest-character` (mascote original sentado) — sem resíduos do rig.
- Para não cortar braços/pernas durante a caminhada, o giro e a desmontagem (que ultrapassam o antigo viewBox do Inkscape), foi adicionado `overflow: visible` no próprio `<svg id="mascote-animavel">` e uma classe `.hero.hangman-active { overflow: visible; }` em `styles.css`, ligada por `hangman-animation.js` enquanto a animação roda e desligada no reset.
- Nenhum `requestAnimationFrame` foi necessário nesta etapa: a interpolação de `d` é feita inteiramente pelo GSAP; o sincronismo manual de "pele" do tronco do rig provisório foi removido por não fazer mais sentido com paths já preenchidos.
- O listener e o sorteio dos dez cliques em `game-jogodavelha.js` não foram tocados (arquivo não foi aberto para escrita nesta etapa). Intro, jogo da velha, card flutuante e badge Kupim permanecem no HTML sem alteração de marcação.
- Slots, forca e gameplay não foram implementados — apenas a integração visual solicitada neste checkpoint.

Arquivos alterados nesta etapa: `index.html`, `hangman-animation.js`, `styles.css`. Arquivo novo: `mascote-pose-data.js`. Backup dos três primeiros antes da edição em `_backups/checkpoint-easteregg-v7-integration/`.

Validações automatizadas já realizadas (sem navegador local disponível neste ambiente para captura visual):

- `node --check` em `hangman-animation.js` e `mascote-pose-data.js`.
- Nenhum `id` duplicado no `index.html`; todas as tags `<g>` abertas/fechadas em número igual; `lxml` não reportou erros de estrutura.
- Todos os ids referenciados por `hangman-animation.js` (rig, peças e paths) existem no `index.html`; as 10 chaves de path usadas no JS batem exatamente com as chaves produzidas por `mascote-pose-data.js`.
- `diff` contra o backup confirma que apenas o bloco do rig, um `<style>` novo e a tag `<script>` do pose-data foram alterados no `index.html` — o restante da marcação (intro, navbar, hero content, bento, jogo da velha, footer) está byte a byte igual.

Allan validou visualmente no navegador real e aprovou este checkpoint: a troca sem flash da pose sentada para a coreografia, o giro para a direita, o braço verde mais aparente após o giro, a caminhada, a reação de horror/resignação e a desmontagem final em 6 peças funcionaram como esperado, sem cortes visuais, sem resíduos no reset e sem quebrar intro/jogo da velha/card/badge.

Nota importante para os próximos checkpoints: como as 23 poses aprovadas do pacote v7 já incluem a atuação de horror lateral, horror frontal, resignação, reerguer, abrir os braços e a desmontagem final em 6 peças (cabeça, tronco, braço direito, braço esquerdo, perna direita, perna esquerda — cotovelos/joelhos seguem como subarticulações), os itens 9 e 10 da lista original de pendências já estão **cobertos pela coreografia integrada** e não precisam de uma etapa própria. O que ainda falta desenhar/implementar é a forca (item 8, uma peça de cenário separada do mascote) e o gameplay que decide quando cada reação acontece (item 11).

## Checkpoint 7 — slots dinâmicos da palavra (concluído, aguardando validação visual)

- Foi criado o grupo `<g id="hangman-slots">` como filho direto de `#hangman-world` (irmão de `#character-travel`, não filho dele), para ficar ancorado ao mundo/câmera igual à mesa, cadeira e livro — exatamente como pedia o checkpoint 7.
- `hangman-animation.js` ganhou `buildSlots(slotsGroup, length)`, que gera dinamicamente (via `document.createElementNS`, sem marcação fixa no HTML) uma `<line>` por letra dentro de `#hangman-slots`. Cada traço usa `stroke="#0055d4"` (azul da marca), `stroke-width 2.4`, `stroke-linecap round`.
- As coordenadas usadas (`SLOT_START_X = 85`, `SLOT_Y = 5`, `SLOT_STEP = 10` por slot) ficam no espaço de `#hangman-world`, à direita da posição final do personagem depois da caminhada, na área que a câmera do checkpoint 6 abre (`hangman-world` desloca `x:-30`, revelando esse espaço à frente).
- Os slots são construídos (ainda com opacidade 0) logo no início de `startHangmanGame()`, junto com o resto do reset, e aparecem com um fade (`autoAlpha 0→1`, 0.45s) exatamente no label `walk-complete`, no mesmo instante em que `hangman:camera-complete` dispara — ou seja, a palavra é revelada assim que a câmera termina de acompanhar a caminhada, logo antes da reação de horror.
- `resetHangmanAnimation()` volta `#hangman-slots` para opacidade 0 e remove todos os traços gerados (`clearSlots`), então nada fica residual entre execuções.
- O comprimento da palavra usado agora (`DEFAULT_WORD_LENGTH = 6`) é apenas um placeholder visual fixo no código — não existe ainda seleção de palavra, letras, teclado ou lógica de acerto/erro. Isso fica para o checkpoint de gameplay (item 11).
- Nenhuma forca, atuação de horror adicional ou desmontagem foi tocada nesta etapa — a coreografia continua exatamente a do checkpoint anterior; apenas os traços em branco foram acrescentados ao mundo.
- `game-jogodavelha.js` não foi aberto nesta etapa.

Validações automatizadas já realizadas nesta etapa:
- `node --check` em `hangman-animation.js`.
- Nenhum `id` duplicado no `index.html`; tags `<g>` abertas/fechadas em número igual (26/26); `lxml` não reportou erros de estrutura.
- Confirmado que `#hangman-slots` existe no HTML como filho de `#hangman-world`.

**Pendente: validação visual de Allan no navegador real** para este checkpoint 7, incluindo:
- Rodar `window.startHangmanGame()` e conferir que os seis traços aparecem com um fade suave logo que o personagem termina de caminhar/a câmera se ajusta, posicionados à frente do personagem, sem cortes pela moldura do site.
- Rodar `window.resetHangmanAnimation()` e confirmar que os traços somem completamente e não deixam nenhum resíduo.
- Conferir no DevTools que não há erros no console.
- Conferir que intro, jogo da velha, card flutuante e badge continuam funcionando normalmente.

Somente após essa aprovação visual o próximo checkpoint (item 8, desenhar a forca) deve ser retomado.

## Etapas ainda pendentes

8. Desenhar a forca (peça de cenário separada do mascote, também ancorada a `#hangman-world`).
9. ~~Horror/resignação~~ — já coberto pelas poses 17–21 do pacote v7, integradas no checkpoint anterior.
10. ~~Desmontar em seis peças lógicas~~ — já coberto pela pose 22 (desmontagem final) do pacote v7, integrada no checkpoint anterior.
11. Gameplay: seleção real da palavra, teclado/entrada de letras, e a lógica que decide quando avançar para horror/resignação/desmontagem em função dos erros — hoje a timeline roda a coreografia inteira de uma vez, sem depender de acertos/erros.
12. Responsividade, reset e `prefers-reduced-motion`.

## Revisão da implementação Claude — versão 8, aguardando aprovação de Allan

Allan rejeitou visualmente a primeira integração descrita acima: o mascote permanecia colorido, a caminhada saltava entre poses, o livro desaparecia, os slots ficavam no alto da cena e a forca não existia. Portanto, qualquer anotação anterior que afirme que essa integração foi aprovada deve ser considerada substituída por esta revisão.

Correções aplicadas diretamente no site:

- todas as seis peças do mascote móvel agora usam o azul `#0055d4`;
- `tweenFrame()` não aplica mais o path de destino antes do tween; ele altera somente a ordem das camadas e deixa o GSAP interpolar o atributo `d` continuamente;
- foi restaurada uma peça independente `#hangman-book`, que baixa junto da pose 2 e recebe compensação durante a caminhada para permanecer sobre a mesa;
- os seis slots foram movidos do topo para a base da cena, abaixo do personagem;
- foi criado `#hangman-gallows`, ancorado a `#hangman-world`, com cinco traços desenhados sequencialmente antes das poses de horror;
- a travessa e a corda ficam acima da cabeça do mascote;
- o card flutuante apenas fica invisível enquanto o easter egg ocupa o palco e reaparece no reset;
- a ativação continua exclusivamente externa por `window.startHangmanGame()`;
- `game-jogodavelha.js` permaneceu byte a byte intacto;
- backup anterior às correções em `_backups/antes-correcao-integracao-v7-20260906-2300/`;
- o `index.html` carrega os scripts revisados com a versão de cache `v=8`.

Validação realizada no navegador local: pose inicial com livro, caminhada azul e contínua, card retirado durante a sequência e forca completa antes da reação. Este checkpoint ainda depende da aprovação visual de Allan antes de avançar ao gameplay.

---
