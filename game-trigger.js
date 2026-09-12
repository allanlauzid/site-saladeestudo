/* =========================================================================
   Roteador central dos easter eggs de clique.

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
      weight: 0.4,
      start: function (x, y) {
        if (window.TicTacToe) window.TicTacToe.start(x, y);
      },
      isActive: function () {
        return !!(window.TicTacToe && window.TicTacToe.isActive());
      }
    },
    {
      name: 'forca',
      weight: 0.6,
      start: function () {
        if (window.HangmanAnimation) window.HangmanAnimation.startRandom();
      },
      isActive: function () {
        return !!(window.HangmanAnimation && window.HangmanAnimation.isActive());
      }
    }
  ];

  function anyGameActive() {
    return GAMES.some(function (game) { return game.isActive(); });
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

      if (bgClickCount >= CLICKS_TO_TRIGGER) {
        bgClickCount = 0;

        // Se a animação de introdução estiver rodando (ou prestes a mostrar a seta), cancela na hora.
        var introEl = document.getElementById('intro');
        if (introEl) {
          introEl.classList.add('skip-intro');
          document.body.style.overflow = ''; // Garante que o scroll volte
          try {
            sessionStorage.setItem('introPlayed', 'true');
          } catch (e) {}
        }

        pickRandomGame().start(e.clientX, e.clientY);
      }
    },
    true
  );
})();
