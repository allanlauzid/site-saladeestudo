/* =========================================================================
   Roteador central do easter egg de clique.

   Conta 10 cliques seguidos no FUNDO da pagina (fora de qualquer elemento
   de conteudo real) e sorteia, entre os minigames cadastrados em GAMES,
   qual deles vai abrir. Os jogos individuais (game-jogodavelha.js,
   hangman-animation.js, e qualquer um que for adicionado no futuro) nao
   escutam clique nenhum por conta propria -- eles so expoem start() e
   isActive(), e quem decide quando chamar start() e este arquivo.

   Para adicionar um novo minigame no futuro: basta registrar uma nova
   entrada em GAMES abaixo, com start(clientX, clientY) e isActive(). Nada
   mais precisa mudar aqui.
   ========================================================================= */
(function () {
  'use strict';

  var CLICKS_TO_TRIGGER = 10;
  var CLICK_GAP_RESET_MS = 1500; // se demorar mais que isso entre cliques, zera a contagem

  var bgClickCount = 0;
  var lastBgClickTime = 0;

  // Cada entrada precisa expor:
  //   start(clientX, clientY) -> inicia o minigame
  //   isActive()              -> true enquanto esse minigame estiver rodando
  var GAMES = [
    {
      name: 'jogo-da-velha',
      weight: 0.5,
      start: function (x, y) {
        if (!window.TicTacToe) return;
        window.TicTacToe.start(x, y);
        trackGameLaunch('jogo-da-velha', 'fundo', this.isActive);
      },
      isActive: function () {
        return !!(window.TicTacToe && window.TicTacToe.isActive());
      }
    },
    {
      name: 'forca',
      weight: 0.5,
      start: function () {
        if (!window.HangmanAnimation) return;
        window.HangmanAnimation.startRandom();
        trackGameLaunch('forca', 'fundo', this.isActive);
      },
      isActive: function () {
        return !!(window.HangmanAnimation && window.HangmanAnimation.isActive());
      }
    }
  ];

  function anyGameActive() {
    return GAMES.some(function (game) { return game.isActive(); });
  }

  // ---------------------------------------------------------------------
  // Carregamento sob demanda (game-loader.js)
  //
  // Os arquivos dos minigames (~425 KB) nao vem mais no carregamento da
  // pagina. aquecer() dispara o download assim que alguem da o primeiro
  // sinal de que talvez va jogar; abrir() garante que tudo ja executou
  // antes de chamar o start() do jogo sorteado.
  // ---------------------------------------------------------------------
  var abrindo = false;

  function aquecer() {
    if (window.GameLoader) window.GameLoader.carregar();
  }

  function abrir(iniciar) {
    if (abrindo) return;           // ja tem um jogo a caminho
    if (!window.GameLoader) return; // sem o carregador nao ha o que abrir
    abrindo = true;
    window.GameLoader.carregar().then(function () {
      abrindo = false;
      iniciar();
    });
  }

  // Registra no Supabase (via game-analytics.js) o inicio de uma partida e
  // fica de olho em isActiveFn() para gravar o fim assim que o jogo parar de
  // estar ativo (vitoria, derrota ou o usuario simplesmente fechando/saindo).
  function trackGameLaunch(gameName, triggerName, isActiveFn) {
    if (!window.GameAnalytics) return;

    var sessionId = window.GameAnalytics.startSession(gameName, triggerName);
    var checkInterval = setInterval(function () {
      if (isActiveFn()) return;
      clearInterval(checkInterval);
      window.GameAnalytics.finishSession(sessionId, { outcome: 'concluido' });
    }, 500);
  }

  // Sorteio por peso: cada jogo tem sua propria chance (soma dos "weight"
  // acima), em vez de sortear com a mesma probabilidade entre todos.
  function pickRandomGame() {
    var totalWeight = GAMES.reduce(function (sum, game) {
      return sum + (typeof game.weight === 'number' ? game.weight : 1);
    }, 0);
    var roll = Math.random() * totalWeight;
    var cursor = 0;
    for (var i = 0; i < GAMES.length; i += 1) {
      cursor += (typeof GAMES[i].weight === 'number' ? GAMES[i].weight : 1);
      if (roll < cursor) return GAMES[i];
    }
    return GAMES[GAMES.length - 1];
  }

  function skipIntroIfNeeded() {
    // Se a animação de introdução estiver rodando (ou prestes a mostrar a seta), cancela na hora.
    var introEl = document.getElementById('intro');
    if (introEl) {
      introEl.classList.add('skip-intro');
      document.body.style.overflow = ''; // Garante que o scroll volte
      try {
        sessionStorage.setItem('introPlayed', 'true');
      } catch (e) {}
    }
  }

  document.addEventListener(
    'click',
    function (e) {
      if (anyGameActive()) return;
      if (typeof window.isBackgroundClick !== 'function' || !window.isBackgroundClick(e.target)) return;

      var now = performance.now();
      if (now - lastBgClickTime > CLICK_GAP_RESET_MS) {
        bgClickCount = 0;
      }
      lastBgClickTime = now;
      bgClickCount++;

      // Primeiro clique no fundo: ja comeca a baixar os jogos em segundo
      // plano, para que o 10o clique abra na hora, sem espera.
      if (bgClickCount === 1) aquecer();

      if (bgClickCount >= CLICKS_TO_TRIGGER) {
        bgClickCount = 0;
        skipIntroIfNeeded();
        var x = e.clientX, y = e.clientY;
        abrir(function () { pickRandomGame().start(x, y); });
      }
    },
    true
  );

  /* -------------------------------------------------------------------
     Easter egg 2: interrogacao na cabeca do mascote.

     1o clique na cabeca -> "arma" o easter egg: aparece uma interrogacao
     pairando sobre a cabeca. Enquanto armado, o usuario tem ate
     HEAD_ARM_TIMEOUT_MS para clicar de novo na cabeca; esse 2o clique
     inicia o jogo da forca. Se o tempo esgotar, ou se acontecer um
     clique fora da cabeca enquanto armado, desarma: a interrogacao sai
     flutuando para cima e some, sem iniciar nada.

     Totalmente independente do easter egg de fundo acima.
     ------------------------------------------------------------------- */
  var HEAD_ARM_TIMEOUT_MS = 5000;

  var headArmed = false;
  var headArmTimer = null;
  var questionEl = null;
  var repositionQuestionMark = null;

  function getHeads() {
    return [
      document.getElementById('rest-head'),
      document.getElementById('head')
    ].filter(Boolean);
  }

  function clickIsInsideHead(target) {
    return getHeads().some(function (head) {
      return head === target || head.contains(target);
    });
  }

  function positionQuestionMark(el, head) {
    var rect = head.getBoundingClientRect();
    el.style.left = (rect.left + rect.width / 2) + 'px';
    el.style.top = rect.top + 'px';
  }

  function showQuestionMark(head) {
    if (questionEl) return;

    questionEl = document.createElement('div');
    questionEl.className = 'mascot-question-mark';
    questionEl.textContent = '?';
    questionEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(questionEl);
    positionQuestionMark(questionEl, head);

    repositionQuestionMark = function () {
      if (questionEl) positionQuestionMark(questionEl, head);
    };
    window.addEventListener('scroll', repositionQuestionMark, true);
    window.addEventListener('resize', repositionQuestionMark);
  }

  function removeQuestionMark(floatAway) {
    if (!questionEl) return;

    if (repositionQuestionMark) {
      window.removeEventListener('scroll', repositionQuestionMark, true);
      window.removeEventListener('resize', repositionQuestionMark);
      repositionQuestionMark = null;
    }

    var el = questionEl;
    questionEl = null;

    if (floatAway) {
      el.classList.add('mascot-question-mark--float-away');
      el.addEventListener(
        'animationend',
        function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        },
        { once: true }
      );
    } else if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  function disarmHead(floatAway) {
    headArmed = false;
    if (headArmTimer) {
      clearTimeout(headArmTimer);
      headArmTimer = null;
    }
    removeQuestionMark(floatAway);
  }

  function armHead(head) {
    headArmed = true;
    aquecer(); // 1o clique na cabeca: ja baixa os jogos enquanto o usuario decide
    showQuestionMark(head);
    headArmTimer = setTimeout(function () {
      disarmHead(true);
    }, HEAD_ARM_TIMEOUT_MS);
  }

  function bindHeadQuestionEasterEgg() {
    var heads = getHeads();
    if (!heads.length) return;

    heads.forEach(function (head) {
      head.addEventListener(
        'click',
        function () {
          if (anyGameActive()) return;

          if (!headArmed) {
            armHead(head);
          } else {
            disarmHead(false);
            skipIntroIfNeeded();
            abrir(function () {
              if (!window.HangmanAnimation) return;
              window.HangmanAnimation.startRandom();
              trackGameLaunch('forca', 'mascote', function () {
                return !!(window.HangmanAnimation && window.HangmanAnimation.isActive());
              });
            });
          }
        },
        true
      );
    });

    // Clique fora da cabeca enquanto armado -> desarma (interrogacao flutua e some).
    document.addEventListener(
      'click',
      function (e) {
        if (!headArmed) return;
        if (clickIsInsideHead(e.target)) return;
        disarmHead(true);
      },
      true
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindHeadQuestionEasterEgg);
  } else {
    bindHeadQuestionEasterEgg();
  }
})();
