/* =========================================================================
   Carregador sob demanda dos minigames (easter eggs).

   Os arquivos do jogo da forca + jogo da velha somam ~425 KB de JavaScript.
   Carregar tudo isso em TODA visita a home era desperdicio: a imensa maioria
   das pessoas nunca dispara o easter egg. Este arquivo -- pequeno e carregado
   sempre -- faz duas coisas:

     1. Detecta clique no FUNDO da pagina (window.isBackgroundClick). O
        game-trigger.js precisa disso para contar os 10 cliques. A funcao
        morava no game-jogodavelha.js, que agora so e baixado sob demanda.

     2. Expoe window.GameLoader.carregar(): baixa os arquivos pesados e
        devolve uma Promise que resolve quando todos ja executaram.

   Os scripts sao inseridos com async = false: baixam em paralelo, mas
   EXECUTAM na ordem de insercao. A ordem importa -- o hangman-animation.js
   le o window.HANGMAN_POSES_SVG definido pelo hangman-poses-inline.js, e o
   game-analytics.js usa o window.supabase vindo do CDN.

   Para adicionar um novo minigame no futuro: inclua o arquivo dele na lista
   ARQUIVOS abaixo e registre o jogo em GAMES no game-trigger.js.
   ========================================================================= */
(function () {
  'use strict';

  // =====================================================================
  // 1. Clique no fundo da pagina
  // =====================================================================
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

  window.isBackgroundClick = isBackgroundClick;

  // =====================================================================
  // 2. Carregamento sob demanda dos arquivos pesados
  // =====================================================================
  var ARQUIVOS = [
    'assets/js/mascote-pose-data.js?v=10',
    // Prancha com as 5 poses do boneco na forca. O hangman-animation.js le
    // window.HANGMAN_POSES_SVG daqui para montar o boneco pendurado; sem este
    // arquivo as pecas aparecem soltas, sem formar o boneco.
    'assets/js/hangman-poses-inline.js?v=1',
    'assets/js/hangman-animation.js?v=32',
    'assets/js/hangman-gameplay.js?v=12',
    'assets/js/game-jogodavelha.js?v=3',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'assets/js/game-analytics.js?v=1'
  ];

  var promessa = null;

  function injetar(src) {
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = src;
      s.async = false; // baixa em paralelo, executa na ordem de insercao
      // Falha de rede em um arquivo nao pode travar a Promise inteira: o jogo
      // ainda tenta abrir, e quem depender do que faltou simplesmente nao roda
      // (o game-analytics.js, por exemplo, ja sai fora se nao achar o supabase).
      s.onload = function () { resolve(true); };
      s.onerror = function () { resolve(false); };
      document.body.appendChild(s);
    });
  }

  function carregar() {
    if (!promessa) promessa = Promise.all(ARQUIVOS.map(injetar));
    return promessa;
  }

  window.GameLoader = {
    carregar: carregar,
    // true depois que os jogos ja estao na memoria
    pronto: function () { return !!(window.HangmanAnimation && window.TicTacToe); }
  };
})();
