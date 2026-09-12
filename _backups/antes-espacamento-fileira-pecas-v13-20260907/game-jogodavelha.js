/* =========================================================================
   Easter egg: Jogo da Velha escondido no fundo do site.
   10 cliques seguidos no FUNDO (a malha quadriculada do body, fora de
   qualquer elemento de conteudo) abrem um jogo da velha desenhado com a
   mesma tecnica de "traco de caneta" da intro (SVG com stroke-dasharray
   animado), na cor definida pela mesma regra de segundos da intro.
   ========================================================================= */
(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Configuracao
  // ---------------------------------------------------------------------
  var CLICKS_TO_TRIGGER = 10;
  var CLICK_GAP_RESET_MS = 1500; // se demorar mais que isso entre cliques, zera a contagem
  var BOARD_SIZE = 240; // largura/altura do tabuleiro (px)
  var BOARD_MARGIN = 24; // margem extra considerada ao checar espaco livre
  var CELL = BOARD_SIZE / 3;
  var STROKE_DURATION = 260; // ms por traco individual (linha da grade, perna do X, etc.)
  var AI_THINK_DELAY_MS = 550; // pequena pausa antes da IA jogar, pra parecer que "pensou"
  var END_GAME_LINGER_MS = 1800; // tempo que o resultado fica na tela antes de fechar sozinho

  // ---------------------------------------------------------------------
  // Estado do contador de cliques no fundo
  // ---------------------------------------------------------------------
  var bgClickCount = 0;
  var lastBgClickTime = 0;
  var gameActive = false;
  var pageShiftWrapper = null;

  // Tags que representam conteudo real (imagem, botao, link, etc.) -- clicar
  // nelas nunca conta como "fundo", mesmo que o proprio elemento nao tenha
  // cor de fundo definida via CSS.
  var CONTENT_TAGS = { IMG: 1, SVG: 1, BUTTON: 1, A: 1, INPUT: 1, TEXTAREA: 1, SELECT: 1, CANVAS: 1, VIDEO: 1, IFRAME: 1 };

  function isTransparentBackground(el) {
    var cs = getComputedStyle(el);
    if (cs.backgroundImage && cs.backgroundImage !== 'none') return false;
    var bg = cs.backgroundColor || '';
    if (bg === 'transparent') return true;
    var m = bg.match(/rgba?\(([^)]+)\)/);
    if (!m) return false;
    var parts = m[1].split(',');
    if (parts.length === 4) return parseFloat(parts[3]) === 0;
    return false; // rgb(...) sem alpha -> tem cor solida, nao e transparente
  }

  function isBackgroundClick(target) {
    // A malha quadriculada e pintada no <body>; varios elementos por cima dela
    // (nav, header, secoes) nao tem cor/imagem de fundo propria, entao o que
    // se ve nesses pontos e o proprio fundo aparecendo por transparencia.
    // Conta como clique no fundo quando TODA a cadeia de elementos ate o body
    // e transparente e nenhuma delas e um elemento de conteudo real.
    if (!target || target === document.documentElement) return false;
    var el = target;
    while (el && el !== document.body && el !== document.documentElement) {
      if (CONTENT_TAGS[el.tagName]) return false;
      if (!isTransparentBackground(el)) return false;
      el = el.parentElement;
    }
    return !!el; // chegou ate o body sem achar nada opaco/de conteudo no caminho
  }

  function ensurePageShiftWrapper() {
    if (pageShiftWrapper) return pageShiftWrapper;
    var wrapper = document.createElement('div');
    wrapper.id = 'ttPageShiftWrapper';
    wrapper.style.cssText = 'transition: transform 0.6s ease; will-change: transform;';
    var children = Array.prototype.slice.call(document.body.children);
    children.forEach(function (child) {
      wrapper.appendChild(child);
    });
    document.body.appendChild(wrapper);
    pageShiftWrapper = wrapper;
    return wrapper;
  }

  function shiftPageBy(px) {
    var wrapper = ensurePageShiftWrapper();
    wrapper.style.transform = px ? 'translateX(' + px + 'px)' : '';
  }

  document.addEventListener(
    'click',
    function (e) {
      if (gameActive) return;
      if (!isBackgroundClick(e.target)) return;

      var now = performance.now();
      if (now - lastBgClickTime > CLICK_GAP_RESET_MS) {
        bgClickCount = 0;
      }
      lastBgClickTime = now;
      bgClickCount++;

      if (bgClickCount >= CLICKS_TO_TRIGGER) {
        bgClickCount = 0;
        startGame(e.clientX, e.clientY);
      }
    },
    true
  );

  // ---------------------------------------------------------------------
  // Cor da caneta -- mesma regra da intro (intro.js)
  // ---------------------------------------------------------------------
  // Cor definida pelo digito das UNIDADES dos segundos do relogio (0-9):
  // azul: 0,1,5,8 | vermelho: 2,3,9 | verde: 4,6,7
  var PEN_COLOR_BY_UNIT_DIGIT = {
    0: '#004EB5', 1: '#004EB5', 5: '#004EB5', 8: '#004EB5', // azul
    2: '#d1342b', 3: '#d1342b', 9: '#d1342b',               // vermelho
    4: '#10B981', 6: '#10B981', 7: '#10B981',               // verde
  };

  function computePenColor() {
    var unitDigit = new Date().getSeconds() % 10;
    return PEN_COLOR_BY_UNIT_DIGIT[unitDigit] || '#004EB5';
  }

  // ---------------------------------------------------------------------
  // IA do jogo da velha (minimax) + dificuldade aleatoria por partida
  // ---------------------------------------------------------------------
  var WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  function checkWinner(board) {
    for (var i = 0; i < WIN_LINES.length; i++) {
      var line = WIN_LINES[i];
      var a = line[0], b = line[1], c = line[2];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line: line };
      }
    }
    if (board.every(function (v) { return v; })) {
      return { winner: 'draw', line: null };
    }
    return null;
  }

  // Jogador humano = 'X' (sempre comeca, foi ele quem clicou). IA = 'O'.
  function minimax(board, player) {
    var result = checkWinner(board);
    if (result) {
      if (result.winner === 'O') return { score: 1 };
      if (result.winner === 'X') return { score: -1 };
      return { score: 0 };
    }

    var moves = [];
    for (var i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = player;
        var next = minimax(board, player === 'O' ? 'X' : 'O');
        moves.push({ index: i, score: next.score });
        board[i] = null;
      }
    }

    var best = moves[0];
    if (player === 'O') {
      for (var j = 1; j < moves.length; j++) if (moves[j].score > best.score) best = moves[j];
    } else {
      for (var k = 1; k < moves.length; k++) if (moves[k].score < best.score) best = moves[k];
    }
    return best;
  }

  function bestMove(board) {
    return minimax(board.slice(), 'O').index;
  }

  function randomMove(board) {
    var empties = [];
    for (var i = 0; i < 9; i++) if (!board[i]) empties.push(i);
    return empties[Math.floor(Math.random() * empties.length)];
  }

  // 35% facil (40% de chance de jogada aleatoria), 50% medio (15%), 15% dificil/perfeito (0%)
  function pickDifficultyErrorRate() {
    var r = Math.random();
    if (r < 0.35) return 0.40;
    if (r < 0.85) return 0.15;
    return 0.0;
  }

  function pickAIMove(board, errorRate) {
    if (Math.random() < errorRate) return randomMove(board);
    return bestMove(board);
  }

  // ---------------------------------------------------------------------
  // Encontrar espaco livre pro tabuleiro (perto do clique, ou deslocando
  // a pagina pro lado mais proximo que tiver espaco)
  // ---------------------------------------------------------------------
  function hasOwnDirectText(el) {
    var kids = el.childNodes;
    for (var i = 0; i < kids.length; i++) {
      var n = kids[i];
      if (n.nodeType === 3 && n.textContent.trim().length > 0) return true;
    }
    return false;
  }

  // So conta como "conteudo real" (pra efeito de achar espaco livre) um elemento
  // que de fato pinta algo visivel ali: texto proprio, imagem/botao/link, ou uma
  // cor/imagem de fundo propria. Wrappers estruturais transparentes (nav, header,
  // section, .container, etc.) NAO contam sozinhos -- so o que ha de solido dentro deles.
  function getContentRects() {
    var wrapper = ensurePageShiftWrapper();
    var rects = [];
    var walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_ELEMENT);
    var node = walker.currentNode;
    while (node) {
      if (node.nodeType === 1 && node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') {
        var cs = getComputedStyle(node);
        if (cs.display !== 'none' && cs.visibility !== 'hidden') {
          var isSolid = CONTENT_TAGS[node.tagName] || hasOwnDirectText(node) || !isTransparentBackground(node);
          if (isSolid) {
            var r = node.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) rects.push(r);
          }
        }
      }
      node = walker.nextNode();
    }
    return rects;
  }

  function rectsOverlap(a, b) {
    return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
  }

  function boardRectAt(cx, cy, shiftX) {
    var half = BOARD_SIZE / 2 + BOARD_MARGIN;
    return {
      left: cx - half,
      right: cx + half,
      top: cy - half - CLOSE_BTN_TOP_RESERVE, // reserva espaco pro botao de fechar, que fica acima do tabuleiro
      bottom: cy + half,
      shiftX: shiftX || 0,
    };
  }

  function fitsWithoutOverlap(candidate, contentRects, shiftX) {
    for (var i = 0; i < contentRects.length; i++) {
      var r = contentRects[i];
      var shifted = { left: r.left + shiftX, right: r.right + shiftX, top: r.top, bottom: r.bottom };
      if (rectsOverlap(candidate, shifted)) return false;
    }
    // tambem nao pode ficar fora da viewport horizontalmente
    if (candidate.left < 4 || candidate.right > window.innerWidth - 4) return false;
    return true;
  }

  // Retorna o deslocamento horizontal minimo (podendo ser 0) necessario
  // para que o tabuleiro, ancorado em (cx,cy), caiba sem sobrepor conteudo.
  function findShiftForBoard(cx, cy) {
    var contentRects = getContentRects();
    var candidate = boardRectAt(cx, cy, 0);

    if (fitsWithoutOverlap(candidate, contentRects, 0)) return 0;

    var STEP = 30;
    var MAX = 900;
    for (var d = STEP; d <= MAX; d += STEP) {
      if (fitsWithoutOverlap(candidate, contentRects, d)) return d;
      if (fitsWithoutOverlap(candidate, contentRects, -d)) return -d;
    }
    return 0; // nao achou espaco livre em nenhum lado -- desiste do deslocamento
  }

  // ---------------------------------------------------------------------
  // Desenho "traco de caneta" (SVG stroke-dasharray, igual a intro)
  // ---------------------------------------------------------------------
  function makeSvgPath(d, color, strokeWidth) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    el.setAttribute('d', d);
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke', color);
    el.setAttribute('stroke-width', strokeWidth);
    el.setAttribute('stroke-linecap', 'round');
    return el;
  }

  function drawStroke(pathEl, durationMs, onDone) {
    var len = pathEl.getTotalLength();
    pathEl.style.strokeDasharray = len;
    pathEl.style.strokeDashoffset = len;
    var anim = pathEl.animate(
      [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
      { duration: durationMs, easing: 'ease-in-out', fill: 'forwards' }
    );
    anim.onfinish = function () {
      pathEl.style.strokeDashoffset = '0';
      if (onDone) onDone();
    };
  }

  // leve "tremor" pra parecer traco a mao livre, nao uma linha reta perfeita
  function jitter(v, amount) {
    return v + (Math.random() - 0.5) * amount;
  }

  function gridLinePath(x1, y1, x2, y2) {
    var mx = jitter((x1 + x2) / 2, 4);
    var my = jitter((y1 + y2) / 2, 4);
    return 'M ' + x1 + ' ' + y1 + ' Q ' + mx + ' ' + my + ' ' + x2 + ' ' + y2;
  }

  function circlePath(cx, cy, r) {
    var r1 = jitter(r, 2);
    return (
      'M ' + (cx - r1) + ' ' + cy +
      ' C ' + (cx - r1) + ' ' + (cy - r1 * 1.4) + ' ' + (cx + r1) + ' ' + (cy - r1 * 1.4) + ' ' + (cx + r1) + ' ' + cy +
      ' C ' + (cx + r1) + ' ' + (cy + r1 * 1.4) + ' ' + (cx - r1) + ' ' + (cy + r1 * 1.4) + ' ' + (cx - r1) + ' ' + cy
    );
  }

  // ---------------------------------------------------------------------
  // O jogo em si
  // ---------------------------------------------------------------------
  var CLOSE_BTN_TOP_RESERVE = 60; // espaco extra acima do tabuleiro por causa do botao de fechar

  function clampClickPoint(clientX, clientY) {
    var halfW = BOARD_SIZE / 2 + BOARD_MARGIN;
    var minY = BOARD_SIZE / 2 + CLOSE_BTN_TOP_RESERVE;
    var maxY = window.innerHeight - BOARD_SIZE / 2 - BOARD_MARGIN;
    var y = Math.min(Math.max(clientY, minY), Math.max(minY, maxY));
    var x = Math.min(Math.max(clientX, halfW), Math.max(halfW, window.innerWidth - halfW));
    return { x: x, y: y };
  }

  function startGame(clientX, clientY) {
    gameActive = true;

    var clamped = clampClickPoint(clientX, clientY);
    clientX = clamped.x;
    clientY = clamped.y;

    var shiftX = findShiftForBoard(clientX, clientY);
    shiftPageBy(shiftX);

    // espera a transicao de deslocamento (se houver) antes de fixar a posicao do tabuleiro
    var delay = shiftX ? 620 : 0;
    setTimeout(function () {
      renderBoard(clientX, clientY);
    }, delay);
  }

  function renderBoard(clientX, clientY) {
    var penColor = computePenColor();
    var docX = clientX + window.scrollX;
    var docY = clientY + window.scrollY;

    var layer = document.createElement('div');
    layer.id = 'ticTacToeLayer';
    layer.style.cssText =
      'position:absolute; left:' + (docX - BOARD_SIZE / 2) + 'px; top:' + (docY - BOARD_SIZE / 2) + 'px;' +
      'width:' + BOARD_SIZE + 'px; height:' + BOARD_SIZE + 'px; z-index:2147483000;' +
      'pointer-events:auto;';
    document.body.appendChild(layer);

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', BOARD_SIZE);
    svg.setAttribute('height', BOARD_SIZE);
    svg.setAttribute('viewBox', '0 0 ' + BOARD_SIZE + ' ' + BOARD_SIZE);
    svg.style.cssText = 'position:absolute; left:0; top:0; overflow:visible;';
    layer.appendChild(svg);

    // Todo o "tinta" do tabuleiro (grade, X, O, risco de vitoria) fica dentro deste
    // grupo, que e mascarado no efeito de apagar -- o botao de fechar fica de fora.
    var gameId = 'ttt' + Math.floor(Math.random() * 1e9);
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    var maskId = 'eraseMask-' + gameId;
    var mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
    mask.setAttribute('id', maskId);
    var maskBase = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    maskBase.setAttribute('x', -20);
    maskBase.setAttribute('y', -60);
    maskBase.setAttribute('width', BOARD_SIZE + 40);
    maskBase.setAttribute('height', BOARD_SIZE + 80);
    maskBase.setAttribute('fill', '#ffffff');
    mask.appendChild(maskBase);
    defs.appendChild(mask);
    svg.appendChild(defs);

    var boardInk = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    boardInk.setAttribute('mask', 'url(#' + maskId + ')');
    // leve inclinacao aleatoria (nao exagerada), pra nao parecer um tabuleiro
    // desenhado com regua perfeita -- o botao de fechar fica de fora, sempre reto.
    var boardTiltDeg = (Math.random() * 2 - 1) * 5; // entre -5 e +5 graus
    boardInk.setAttribute('transform', 'rotate(' + boardTiltDeg.toFixed(2) + ' ' + (BOARD_SIZE / 2) + ' ' + (BOARD_SIZE / 2) + ')');
    svg.appendChild(boardInk);

    // Botao de fechar: X grande no canto superior direito
    var closeBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    closeBtn.setAttribute('class', 'ttt-close-btn');
    closeBtn.style.cursor = 'pointer';
    var closeSize = 14;
    var closeCx = BOARD_SIZE - 6;
    var closeCy = -14;
    var closeLine1 = makeSvgPath(
      'M ' + (closeCx - closeSize / 2) + ' ' + (closeCy - closeSize / 2) + ' L ' + (closeCx + closeSize / 2) + ' ' + (closeCy + closeSize / 2),
      '#FFFFFF', 4
    );
    var closeLine2 = makeSvgPath(
      'M ' + (closeCx + closeSize / 2) + ' ' + (closeCy - closeSize / 2) + ' L ' + (closeCx - closeSize / 2) + ' ' + (closeCy + closeSize / 2),
      '#FFFFFF', 4
    );
    var closeBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    closeBg.setAttribute('cx', closeCx);
    closeBg.setAttribute('cy', closeCy);
    closeBg.setAttribute('r', 16);
    closeBg.setAttribute('fill', penColor);
    closeBtn.appendChild(closeBg);
    closeBtn.appendChild(closeLine1);
    closeBtn.appendChild(closeLine2);
    closeBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      eraseAndClose();
    });
    svg.appendChild(closeBtn);

    // Animacao de entrada do botao de fechar: "pop" com uma leve saltada (overshoot),
    // girando e crescendo a partir de um ponto pequeno, em vez de so aparecer estatico.
    closeBtn.style.transformOrigin = closeCx + 'px ' + closeCy + 'px';
    closeBtn.animate(
      [
        { transform: 'scale(0.2) rotate(-25deg)', opacity: 0 },
        { transform: 'scale(1.15) rotate(6deg)', opacity: 1, offset: 0.7 },
        { transform: 'scale(1) rotate(0deg)', opacity: 1 },
      ],
      { duration: 380, easing: 'ease-out', fill: 'forwards' }
    );

    // Animacao de saida do botao de fechar: encolhe, gira e desaparece antes de ser
    // removido de fato -- usada tanto ao clicar nele quanto quando o apagador comeca.
    function animateCloseBtnOut(onDone) {
      if (!closeBtn.parentNode) { onDone && onDone(); return; }
      var anim = closeBtn.animate(
        [
          { transform: 'scale(1) rotate(0deg)', opacity: 1 },
          { transform: 'scale(0.2) rotate(20deg)', opacity: 0 },
        ],
        { duration: 200, easing: 'ease-in', fill: 'forwards' }
      );
      anim.onfinish = function () {
        if (closeBtn.parentNode) closeBtn.parentNode.removeChild(closeBtn);
        onDone && onDone();
      };
    }

    // Grade (linhas verticais e horizontais), desenhada com o traco de caneta
    var gridPaths = [
      gridLinePath(CELL, 6, CELL, BOARD_SIZE - 6),
      gridLinePath(CELL * 2, 6, CELL * 2, BOARD_SIZE - 6),
      gridLinePath(6, CELL, BOARD_SIZE - 6, CELL),
      gridLinePath(6, CELL * 2, BOARD_SIZE - 6, CELL * 2),
    ];

    var board = new Array(9).fill(null);
    var errorRate = pickDifficultyErrorRate();
    var playerTurn = false;
    var finished = false;

    var cellHitAreas = [];

    function drawSequential(paths, strokeWidth, onAllDone) {
      var idx = 0;
      function next() {
        if (idx >= paths.length) { onAllDone && onAllDone(); return; }
        var p = makeSvgPath(paths[idx], penColor, strokeWidth);
        boardInk.appendChild(p);
        idx++;
        drawStroke(p, STROKE_DURATION, next);
      }
      next();
    }

    drawSequential(gridPaths, 3, function () {
      setupCells();
      playerTurn = true;
    });

    function setupCells() {
      for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 3; c++) {
          var idx = r * 3 + c;
          var hit = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          hit.setAttribute('x', c * CELL);
          hit.setAttribute('y', r * CELL);
          hit.setAttribute('width', CELL);
          hit.setAttribute('height', CELL);
          hit.setAttribute('fill', 'transparent');
          hit.style.cursor = 'pointer';
          (function (cellIndex) {
            hit.addEventListener('click', function (ev) {
              ev.stopPropagation();
              onCellClick(cellIndex);
            });
          })(idx);
          svg.appendChild(hit);
          cellHitAreas.push(hit);
        }
      }
    }

    function cellCenter(idx) {
      var r = Math.floor(idx / 3), c = idx % 3;
      return { x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 };
    }

    function drawMark(idx, mark, onDone) {
      var center = cellCenter(idx);
      var pad = CELL * 0.28;
      if (mark === 'X') {
        var p1 = makeSvgPath(
          'M ' + (center.x - CELL / 2 + pad) + ' ' + (center.y - CELL / 2 + pad) + ' L ' + (center.x + CELL / 2 - pad) + ' ' + (center.y + CELL / 2 - pad),
          penColor, 3
        );
        var p2 = makeSvgPath(
          'M ' + (center.x + CELL / 2 - pad) + ' ' + (center.y - CELL / 2 + pad) + ' L ' + (center.x - CELL / 2 + pad) + ' ' + (center.y + CELL / 2 - pad),
          penColor, 3
        );
        boardInk.appendChild(p1);
        drawStroke(p1, STROKE_DURATION, function () {
          boardInk.appendChild(p2);
          drawStroke(p2, STROKE_DURATION, onDone);
        });
      } else {
        var r = CELL / 2 - pad;
        var p = makeSvgPath(circlePath(center.x, center.y, r), penColor, 3);
        boardInk.appendChild(p);
        drawStroke(p, STROKE_DURATION * 2, onDone);
      }
    }

    function removeCellHit(idx) {
      var hit = cellHitAreas[idx];
      if (hit && hit.parentNode) hit.parentNode.removeChild(hit);
    }

    function onCellClick(idx) {
      if (!playerTurn || finished || board[idx]) return;
      playerTurn = false;
      board[idx] = 'X';
      removeCellHit(idx);
      drawMark(idx, 'X', function () {
        var result = checkWinner(board);
        if (result) { finishGame(result); return; }
        setTimeout(aiTurn, AI_THINK_DELAY_MS);
      });
    }

    function aiTurn() {
      var move = pickAIMove(board, errorRate);
      board[move] = 'O';
      removeCellHit(move);
      drawMark(move, 'O', function () {
        var result = checkWinner(board);
        if (result) { finishGame(result); return; }
        playerTurn = true;
      });
    }

    function finishGame(result) {
      finished = true;
      if (result.line) {
        var a = cellCenter(result.line[0]);
        var c = cellCenter(result.line[2]);
        var strikePath = gridLinePath(a.x, a.y, c.x, c.y);
        var strike = makeSvgPath(strikePath, penColor, 5);
        boardInk.appendChild(strike);
        drawStroke(strike, STROKE_DURATION, null);
      }
      setTimeout(eraseAndClose, END_GAME_LINGER_MS);
    }

    var erasing = false;
    var ERASE_ROW_MS = 260; // duracao do apagao em cada uma das 3 faixas do tabuleiro

    // Efeito de "apagador de quadro branco" passando pelo tabuleiro em zigue-zague
    // (faixa de cima da esquerda pra direita, faixa do meio da direita pra esquerda,
    // faixa de baixo da esquerda pra direita), escondendo a tinta conforme passa.
    function eraseAndClose() {
      if (erasing) return;
      erasing = true;
      finished = true;
      playerTurn = false;

      // nao pode mais jogar nem clicar em fechar de novo durante o apagao
      cellHitAreas.forEach(function (hit) { if (hit && hit.parentNode) hit.parentNode.removeChild(hit); });
      animateCloseBtnOut();

      // "apagador": um retangulo branco arredondado com borda cinza, no estilo
      // do apagador ja usado na intro do site (hand-erase), so que em uso ativo aqui.
      var eraser = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      var eraserBody = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      var eraserW = 46, eraserH = CELL * 0.9;
      eraserBody.setAttribute('x', -eraserW / 2);
      eraserBody.setAttribute('y', -eraserH / 2);
      eraserBody.setAttribute('width', eraserW);
      eraserBody.setAttribute('height', eraserH);
      eraserBody.setAttribute('rx', 8);
      eraserBody.setAttribute('fill', '#ffffff');
      eraserBody.setAttribute('stroke', '#c9c9c9');
      eraserBody.setAttribute('stroke-width', 2);
      eraser.appendChild(eraserBody);
      svg.appendChild(eraser);

      var rowDirections = ['ltr', 'rtl', 'ltr'];
      var totalDuration = ERASE_ROW_MS * 3;

      // Faixas com largura IRREGULAR (nao exatamente 1/3 do tabuleiro cada) -- pequeno
      // sorteio nos limites entre faixas, pra nao parecer uma passada perfeita de regua.
      var jitterA = (Math.random() * 2 - 1) * 22;
      var jitterB = (Math.random() * 2 - 1) * 22;
      var bounds = [0, CELL + jitterA, 2 * CELL + jitterB, BOARD_SIZE];
      if (bounds[2] - bounds[1] < 30) bounds[2] = bounds[1] + 30; // garante faixa minima
      if (bounds[3] - bounds[2] < 20) bounds[2] = bounds[3] - 20;

      // Cada faixa tem uma frente enviesada/ondulada (nao uma linha reta vertical),
      // como se a mao que apaga nao fosse perfeitamente precisa. skew = inclinacao
      // fixa sorteada por faixa; a ondulacao (seno) varia durante o proprio passe.
      // Faixa de variacao ampla: mantem as inclinacoes suaves de antes como possibilidade
      // (magnitude minima ~8) mas agora tambem sorteia passadas bem mais inclinadas (ate ~50).
      var skewByRow = rowDirections.map(function () {
        var mag = 8 + Math.random() * 42;
        return (Math.random() < 0.5 ? -1 : 1) * mag;
      });
      var wobbleAmpByRow = rowDirections.map(function () { return 4 + Math.random() * 16; });

      // Os elementos da mascara (que escondem a tinta conforme o apagador passa) sao
      // atualizados manualmente a cada frame (rAF), em vez de Element.animate() -- elementos
      // dentro de um <mask> nao respondem a animacoes CSS/WAAPI de forma confiavel no Chromium
      // (o atributo fica travado no valor inicial), entao precisamos mexer nos atributos na mao.
      var rowPaths = rowDirections.map(function () {
        var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('fill', '#000000'); // preto na mask = area apagada (escondida)
        mask.appendChild(p);
        return p;
      });

      function rowBandPath(rowIdx, dir, t) {
        var y0 = bounds[rowIdx] - 2, y1 = bounds[rowIdx + 1] + 2;
        var skew = skewByRow[rowIdx];
        var wobble = Math.sin(t * Math.PI * 2.5 + rowIdx) * wobbleAmpByRow[rowIdx] * Math.min(t * 4, 1);
        if (dir === 'ltr') {
          var leadTop = t * BOARD_SIZE + skew / 2 + wobble;
          var leadBottom = t * BOARD_SIZE - skew / 2 - wobble;
          return 'M 0 ' + y0 + ' L ' + leadTop + ' ' + y0 + ' L ' + leadBottom + ' ' + y1 + ' L 0 ' + y1 + ' Z';
        }
        var leadTop2 = BOARD_SIZE - t * BOARD_SIZE - skew / 2 - wobble;
        var leadBottom2 = BOARD_SIZE - t * BOARD_SIZE + skew / 2 + wobble;
        return 'M ' + BOARD_SIZE + ' ' + y0 + ' L ' + leadTop2 + ' ' + y0 + ' L ' + leadBottom2 + ' ' + y1 + ' L ' + BOARD_SIZE + ' ' + y1 + ' Z';
      }

      // posiciona o apagador no ponto inicial da primeira faixa antes de comecar
      eraser.setAttribute(
        'transform',
        'translate(' + (rowDirections[0] === 'ltr' ? 0 : BOARD_SIZE) + ',' + ((bounds[0] + bounds[1]) / 2) + ')'
      );

      var startTime = null;
      function frame(now) {
        if (startTime === null) startTime = now;
        var elapsed = now - startTime;

        for (var i = 0; i < rowDirections.length; i++) {
          var dir = rowDirections[i];
          var rowStart = i * ERASE_ROW_MS;
          var t = Math.min(Math.max((elapsed - rowStart) / ERASE_ROW_MS, 0), 1);
          rowPaths[i].setAttribute('d', rowBandPath(i, dir, t));

          if (t > 0 && t < 1) {
            var midY = (bounds[i] + bounds[i + 1]) / 2;
            var eraserX = dir === 'ltr' ? t * BOARD_SIZE : BOARD_SIZE - t * BOARD_SIZE;
            var rock = Math.sin(t * Math.PI * 6) * 5; // um leve balanco, como se fosse mesmo a mao
            eraser.setAttribute('transform', 'translate(' + eraserX + ',' + midY + ') rotate(' + rock.toFixed(1) + ')');
          }
        }

        if (elapsed < totalDuration) {
          requestAnimationFrame(frame);
        } else {
          rowPaths.forEach(function (p, i) {
            p.setAttribute('d', 'M -20 ' + (bounds[i] - 2) + ' L ' + (BOARD_SIZE + 20) + ' ' + (bounds[i] - 2) +
              ' L ' + (BOARD_SIZE + 20) + ' ' + (bounds[i + 1] + 2) + ' L -20 ' + (bounds[i + 1] + 2) + ' Z');
          });
          setTimeout(closeGame, 60);
        }
      }
      requestAnimationFrame(frame);
    }
  }

  function closeGame() {
    var layer = document.getElementById('ticTacToeLayer');
    if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
    shiftPageBy(0);
    gameActive = false;
  }
})();
