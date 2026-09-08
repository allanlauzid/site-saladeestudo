/* ========================================================================
   Easter egg da forca — coreografia do mascote.
   Integração corrigida da coreografia aprovada, livro, slots e forca.

   O rig provisório baseado em linhas foi substituído pelas 23 poses
   aprovadas em mascote-pose-data.js (paths interpoláveis por GSAP),
   seguindo exatamente a coreografia validada em
   animacao-continua-mascote.html: sentado -> livro abaixado -> cabeça
   levantada -> apoio -> meio levantado -> em pé -> giro -> caminhada
   (8 ciclos) -> chegada neutra -> horror lateral -> horror frontal ->
   resignação -> reergue -> abre os braços -> desmontagem final.

   O livro permanece como peça de cenário, os slots ficam sob a cena e a
   forca é desenhada antes das poses de horror. A lógica de palavra e de
   acertos/erros continua reservada ao gameplay.

   Não há listener de ativação neste arquivo. A sequência é iniciada apenas
   por uma chamada externa a window.startHangmanGame(). O deslocamento do
   personagem (character-travel) e o acompanhamento de câmera (hangman-world)
   reaproveitam o mecanismo já aprovado nos checkpoints anteriores.
   ======================================================================== */
(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  var PIECES = {
    'leg-right': ['thigh-right-shape', 'shin-right-shape'],
    'arm-right': ['upper-arm-right-shape', 'forearm-right-shape'],
    'torso': ['torso-shape-allan'],
    'leg-left': ['thigh-left-shape', 'shin-left-shape'],
    'arm-left': ['upper-arm-left-shape', 'forearm-left-shape'],
    'head': ['head-shape-allan']
  };

  var PIECE_IDS = Object.keys(PIECES);
  var DISASSEMBLY_ROW_ORDER = ['head', 'torso', 'arm-left', 'arm-right', 'leg-left', 'leg-right'];

  /* Pontos locais da pose 23 usados como pivôs. O braço esquerdo usa a mão
     para prender no laço; a perna direita usa a extremidade inferior para a
     pose pendurada. Os demais pontos são ombros, quadris e centro da cabeça. */
  var PIECE_ANCHORS = {
    head: { x: 59.78, y: 11.78 },
    torso: { x: 45.2, y: 22.2 },
    'arm-left': { x: 61.0, y: 30.0 },
    'arm-right': { x: 28.0, y: 17.0 },
    'leg-left': { x: 52.0, y: 48.0 },
    'leg-right': { x: 52.0, y: 39.0 }
  };

  var WALK_FRAME_INDEXES = [8, 9, 10, 11, 12, 13, 14, 15];
  var WALK_CYCLES = 8;
  var STANDING_FRAME_INDEX = 5; /* "06 · Em pé neutro" */
  var WALK_COMPLETE_FRAME_INDEX = 16; /* "17 · Chegada neutra" */

  /* O personagem percorre uma distância maior que a câmera. Assim ele
     realmente avança para a direita no enquadramento enquanto toda a página
     acompanha o percurso como um cenário único. */
  var TRAVEL_X = 215;
  var CAMERA_X = 222;

  var BOOK_INITIAL_PATH = 'M9 20 L3 12';
  var BOOK_LOWERED_PATH = 'M17 29 L7 29';

  /* A chamada sem argumento usa a palavra padrão de seis letras. Palavras
     maiores comprimem campos e intervalos dentro da mesma largura de cena. */
  var DEFAULT_WORD_LENGTH = 6;
  var DEFAULT_WORD = 'ESTUDO';
  var DEFAULT_HINT = 'Atividade central da Sala de Estudo';
  /* O mascote deixa estes campos para trás enquanto caminha. Depois da
     compensação de câmera, eles terminam à esquerda dos seus pés. */
  var SLOT_START_X = 65;
  var SLOT_AREA_WIDTH = 160;
  var SLOT_GAP = 8;
  var SLOT_Y = 90;
  var SLOT_COLOR = '#0055d4';
  var SLOT_STROKE_WIDTH = 1.4;
  var REFERENCE_SLOT_WIDTH = 20;
  var MAX_WORD_CHARACTERS = 40;
  var MAX_WORD_LETTERS = 15;
  /* Centro vertical do laço: ele ocupa y=-25..-5. */
  var PIECE_ROW_CENTER_Y = -15;
  /* Um clique, toque ou tecla durante a sequência acelera a coreografia sem
     saltar poses. A velocidade normal volta a valer no próximo início. */
  var FAST_FORWARD_SCALE = 4;
  var MOBILE_LANDSCAPE_INTRO_MS = 2000;
  var FLOAT_DISTANCES = [2.1, 1.6, 2.4, 2.2, 2.7, 2.5];
  var FLOAT_DURATIONS = [3.6, 4.1, 4.5, 3.9, 4.7, 4.2];
  var FLOAT_ROTATIONS = [0, 0.8, 2, -2, 2.5, -2.5];
  var GALLOWS_PIECE_TARGETS = {
    head: { x: 290, y: -14, rotation: 0 },
    torso: { x: 290, y: 16, rotation: 0 },
    'arm-left': { x: 279, y: 18, rotation: -8 },
    'arm-right': { x: 301, y: 18, rotation: 8 },
    'leg-left': { x: 284, y: 55, rotation: -4 },
    'leg-right': { x: 297, y: 55, rotation: 4 }
  };

  /* Cinco poses aprovadas para a forca. A ordem de cada uma é a sequência
     em que os erros enviam os membros para a cena. As coordenadas são centros
     no mesmo mundo SVG da forca; os grupos continuam contendo cotovelos e
     joelhos como subarticulações. */
  var GALLOWS_POSES = [
    {
      name: 'balanco-em-l',
      order: ['arm-left', 'torso', 'leg-left', 'head', 'arm-right', 'leg-right'],
      targets: {
        'arm-left': { x: 290, y: -25, rotation: -18, localAnchor: { x: 86, y: 29.5 } }, torso: { x: 307, y: 2, rotation: -55 },
        'leg-left': { x: 307, y: 18, rotation: -78 }, head: { x: 307, y: -18, rotation: 0 },
        'arm-right': { x: 317, y: -4, rotation: 58 }, 'leg-right': { x: 315, y: 19, rotation: -98 }
      },
      attachedPiece: 'arm-left'
    },
    {
      name: 'estrela-perna',
      order: ['leg-right', 'torso', 'leg-left', 'head', 'arm-right', 'arm-left'],
      targets: {
        'leg-right': { x: 290, y: -25, rotation: 35, localAnchor: { x: 43, y: 76 } }, torso: { x: 307, y: 6, rotation: -48 },
        'leg-left': { x: 300, y: 18, rotation: 78 }, head: { x: 307, y: 48, rotation: 180 },
        'arm-right': { x: 327, y: 21, rotation: 58 }, 'arm-left': { x: 287, y: 20, rotation: -58 }
      },
      attachedPiece: 'leg-right'
    },
    {
      name: 'preguica-trave',
      order: ['head', 'torso', 'arm-right', 'arm-left', 'leg-left', 'leg-right'],
      targets: {
        head: { x: 314, y: -18, rotation: 0 }, torso: { x: 315, y: 8, rotation: 0 },
        'arm-right': { x: 333, y: -22, rotation: 18 }, 'arm-left': { x: 299, y: -22, rotation: -18 },
        'leg-left': { x: 309, y: 40, rotation: 34 }, 'leg-right': { x: 326, y: 40, rotation: -34 }
      },
      attachedPiece: 'arm-left'
    },
    {
      name: 'enroscado-poste',
      order: ['head', 'torso', 'arm-right', 'leg-right', 'arm-left', 'leg-left'],
      targets: {
        head: { x: 304, y: -15, rotation: -12 }, torso: { x: 316, y: 10, rotation: 28 },
        'arm-right': { x: 337, y: -18, rotation: 55 }, 'leg-right': { x: 342, y: 24, rotation: 76 },
        'arm-left': { x: 291, y: 18, rotation: -50 }, 'leg-left': { x: 300, y: 49, rotation: -34 }
      },
      attachedPiece: 'leg-right'
    },
    {
      name: 'bandeira-humana',
      order: ['head', 'torso', 'leg-left', 'leg-right', 'arm-right', 'arm-left'],
      targets: {
        head: { x: 270, y: 8, rotation: 0 }, torso: { x: 300, y: 8, rotation: 0 },
        'leg-left': { x: 278, y: 29, rotation: 52 }, 'leg-right': { x: 278, y: 50, rotation: -52 },
        'arm-right': { x: 333, y: -5, rotation: 38 }, 'arm-left': { x: 333, y: 20, rotation: -38 }
      },
      attachedPiece: 'arm-right'
    }
  ];
  var activeGallowsPose = GALLOWS_POSES[0];
  var gallowsSwayTimeline = null;
  var gallowsSwayAngle = 0;

  var activeTimeline = null;
  var pageCamera = null;
  var fastForwardListenersAttached = false;
  var exitControl = null;
  var exitControlListenersAttached = false;
  var landscapeOverlay = null;
  var landscapeBlockersAttached = false;
  var mobileLandscapeActive = false;
  var mobileLandscapeStarted = false;
  var mobileLandscapeIntroElapsed = false;
  var mobileLandscapeIntroTimer = null;
  var mobileFullscreenOwned = false;
  var landscapeRequestToken = 0;
  var floatingPieceStates = [];
  var activeRound = null;
  var floatingAnimations = [];
  var floatingInteractionsAttached = false;
  var activeParts = null;

  var WORD_BANK_URL = 'hangman-words.json';
  // Banco reserva, embutido no proprio arquivo (nao depende de fetch): usado quando
  // a pagina e aberta offline (file://) e o fetch do hangman-words.json e bloqueado
  // pelo navegador. Cobre os 13 topicos, entao o sorteio duplo continua variando
  // mesmo offline, so que dentro de um banco bem menor.
  var OFFLINE_FALLBACK_BANK = [
  {
    "topico": "Matérias escolares",
    "palavra": "artes",
    "charada": "Todo mundo me acha fácil até alguém pedir pra desenhar um cavalo de frente."
  },
  {
    "topico": "Matérias escolares",
    "palavra": "biologia",
    "charada": "Todo mundo decorou o nome de uma organela só pra fazer meme, e ninguém mais lembra pra que ela serve."
  },
  {
    "topico": "Matérias escolares",
    "palavra": "espanhol",
    "charada": "Todo brasileiro acha que me fala fluentemente só de colocar um 'ito' no final das palavras."
  },
  {
    "topico": "Matérias escolares",
    "palavra": "filosofia",
    "charada": "Deixo um adolescente de 16 anos numa crise existencial só de perguntar 'o que é o ser'."
  },
  {
    "topico": "Matérias escolares",
    "palavra": "física",
    "charada": "Explico por que seu celular, entre todas as posições possíveis, sempre escolhe cair com a tela pra baixo."
  },
  {
    "topico": "Matérias escolares",
    "palavra": "geografia",
    "charada": "Você sabe a capital de um país que nunca vai visitar, mas esquece onde estacionou o carro."
  },
  {
    "topico": "Matérias escolares",
    "palavra": "história",
    "charada": "Alguém decepcionado vive dizendo que eu me repito, mas ninguém repete a prova sobre mim se colar direito."
  },
  {
    "topico": "Matérias escolares",
    "palavra": "inglês",
    "charada": "Te deixo cantar um hit inteiro com pronúncia perfeita e travar solenemente na hora de pedir satisfação no aeroporto."
  },
  {
    "topico": "Matérias escolares",
    "palavra": "literatura",
    "charada": "Fingir que te leu inteira antes da prova é praticamente uma segunda matéria à parte."
  },
  {
    "topico": "Matérias escolares",
    "palavra": "matemática",
    "charada": "Toda vida adulta promete que você nunca mais vai precisar achar o valor de x, e a vida adulta mente descaradamente."
  },
  {
    "topico": "Matérias escolares",
    "palavra": "português",
    "charada": "A única matéria em que 'mim fazer isso' está errado, mas sai natural na hora de falar."
  },
  {
    "topico": "Matérias escolares",
    "palavra": "química",
    "charada": "Sou a razão do professor falar 'não façam isso em casa' logo depois de fazer bem na sua frente."
  },
  {
    "topico": "Matérias escolares",
    "palavra": "redação",
    "charada": "Ninguém nunca viu um 1000 de verdade em mim, só ouviu falar, que nem disco voador."
  },
  {
    "topico": "Matérias escolares",
    "palavra": "sociologia",
    "charada": "Te ensinei a dizer 'isso é uma construção social' pra ganhar qualquer discussão no almoço de domingo."
  },
  {
    "topico": "Matemática",
    "palavra": "altura",
    "charada": "A desculpa clássica de quem não alcança a prateleira de cima do mercado."
  },
  {
    "topico": "Matemática",
    "palavra": "ângulo",
    "charada": "Toda selfie busca o melhor de mim antes de postar."
  },
  {
    "topico": "Física",
    "palavra": "aceleração",
    "charada": "O que todo mundo faz no último quilômetro só pra não perder o compromisso que já está atrasado."
  },
  {
    "topico": "Física",
    "palavra": "atração",
    "charada": "Faz dois corpos se aproximarem, e também é a desculpa de qualquer paquera capenga."
  },
  {
    "topico": "Química",
    "palavra": "ácido",
    "charada": "A razão do seu estômago reclamar depois daquele lanche às 2 da manhã."
  },
  {
    "topico": "Química",
    "palavra": "água",
    "charada": "Prometem que você deveria beber mais de mim o dia inteiro, e ninguém cumpre."
  },
  {
    "topico": "Biologia",
    "palavra": "animal",
    "charada": "Categoria que inclui você, mesmo que sua timeline discorde."
  },
  {
    "topico": "Biologia",
    "palavra": "bactéria",
    "charada": "Vive numa maçaneta que ninguém nunca limpa direito."
  },
  {
    "topico": "História",
    "palavra": "batalha",
    "charada": "Aquele confronto que os livros descrevem em páginas inteiras, mas que na vida real dura só alguns minutos."
  },
  {
    "topico": "História",
    "palavra": "colônia",
    "charada": "Território emprestado que o dono original nunca mais devolveu de bom grado."
  },
  {
    "topico": "Geografia",
    "palavra": "ambiente",
    "charada": "Tudo ao redor que a gente promete cuidar melhor, geralmente depois de assistir um documentário."
  },
  {
    "topico": "Geografia",
    "palavra": "bússola",
    "charada": "Aponto sempre pro norte, ao contrário de qualquer decisão que você tenta tomar sozinho."
  },
  {
    "topico": "Português e Literatura",
    "palavra": "adjetivo",
    "charada": "Dou qualidade a um substantivo, tipo aquele elogio que sua mãe manda com segunda intenção."
  },
  {
    "topico": "Português e Literatura",
    "palavra": "antônimo",
    "charada": "O oposto exato de uma palavra, igual você e aquele parente que discorda de tudo só por discordar."
  },
  {
    "topico": "Redação",
    "palavra": "argumento",
    "charada": "Aquilo que todo mundo jura ter na discussão de grupo de família, mas poucos realmente trazem."
  },
  {
    "topico": "Redação",
    "palavra": "citação",
    "charada": "Uma frase de outra pessoa que você usa pra parecer mais culto do que realmente é."
  },
  {
    "topico": "Filosofia",
    "palavra": "conhecimento",
    "charada": "A única coisa que ninguém consegue tirar de você, exceto na hora da prova que você não estudou."
  },
  {
    "topico": "Filosofia",
    "palavra": "consciência",
    "charada": "Aquela voz que fala 'você devia estar estudando' bem na hora do episódio mais interessante da série."
  },
  {
    "topico": "Sociologia",
    "palavra": "cidadania",
    "charada": "Os direitos e deveres que todo mundo lembra dos direitos e esquece os deveres."
  },
  {
    "topico": "Sociologia",
    "palavra": "cidadão",
    "charada": "A pessoa que reclama do imposto e também reclama quando falta asfalto na rua."
  },
  {
    "topico": "Inglês e Espanhol",
    "palavra": "alfabeto",
    "charada": "Vinte e seis letrinhas que decidem toda discussão sobre como se escreve certo."
  },
  {
    "topico": "Inglês e Espanhol",
    "palavra": "bilíngue",
    "charada": "Quem fala dois idiomas, e ainda assim trava igual todo mundo na hora de pedir a conta no restaurante."
  },
  {
    "topico": "Artes",
    "palavra": "artista",
    "charada": "Quem transforma sentimento em obra, e também qualquer pessoa que decora o próprio bolo de aniversário torto com orgulho."
  },
  {
    "topico": "Artes",
    "palavra": "ator",
    "charada": "Finge sentir emoção profissionalmente, coisa que todo mundo já fez pelo menos uma vez numa festa chata."
  }
];
  var wordBankPromise = null;
  var wordBankCache = null;

  function isSequenceRunning() {
    return activeTimeline && activeTimeline.progress() < 1;
  }

  function handleFastForwardInput(event) {
    if (!isSequenceRunning()) return;
    if (event && event.target && event.target.closest &&
        event.target.closest('#hangman-exit-control')) return;

    /* Os controles ficam na captura da janela para que, durante a forca, o
       gesto não navegue por um link nem alcance o contador dos dez cliques. */
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (activeTimeline.timeScale() < FAST_FORWARD_SCALE) {
      activeTimeline.timeScale(FAST_FORWARD_SCALE);
      document.dispatchEvent(new CustomEvent('hangman:fast-forward', {
        detail: { timeScale: FAST_FORWARD_SCALE }
      }));
    }
  }

  function attachFastForwardControls() {
    if (fastForwardListenersAttached) return;
    window.addEventListener('pointerdown', handleFastForwardInput, true);
    window.addEventListener('click', handleFastForwardInput, true);
    window.addEventListener('keydown', handleFastForwardInput, true);
    fastForwardListenersAttached = true;
  }

  function detachFastForwardControls() {
    if (!fastForwardListenersAttached) return;
    window.removeEventListener('pointerdown', handleFastForwardInput, true);
    window.removeEventListener('click', handleFastForwardInput, true);
    window.removeEventListener('keydown', handleFastForwardInput, true);
    fastForwardListenersAttached = false;
  }

  function isExitControlEvent(event) {
    return Boolean(event && event.target && event.target.closest &&
      event.target.closest('#hangman-exit-control'));
  }

  function handleExitControlInput(event) {
    if (!isExitControlEvent(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    resetHangmanAnimation();
  }

  function ensureExitControl() {
    if (exitControl && exitControl.isConnected) return exitControl;

    exitControl = document.createElement('button');
    exitControl.id = 'hangman-exit-control';
    exitControl.type = 'button';
    exitControl.setAttribute('aria-label', 'Sair da animação');
    exitControl.title = 'Sair da animação';
    exitControl.style.cssText = [
      'position:fixed',
      'top:12px',
      'top:max(12px,env(safe-area-inset-top))',
      'right:12px',
      'right:max(12px,env(safe-area-inset-right))',
      'z-index:22000',
      'width:64px',
      'height:64px',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'padding:0',
      'border:0',
      'background:transparent',
      'box-shadow:none',
      'cursor:pointer',
      'touch-action:manipulation'
    ].join(';');
    exitControl.innerHTML =
      '<svg viewBox="0 0 48 48" width="46" height="46" aria-hidden="true">' +
        '<path d="M12 12L36 36M36 12L12 36" fill="none" stroke="#dc2626" stroke-width="6" stroke-linecap="round"/>' +
      '</svg>';
    document.body.appendChild(exitControl);
    return exitControl;
  }

  function showExitControl() {
    ensureExitControl().style.display = 'flex';
    if (exitControlListenersAttached) return;
    window.addEventListener('pointerdown', handleExitControlInput, true);
    window.addEventListener('click', handleExitControlInput, true);
    exitControlListenersAttached = true;
  }

  function removeExitControl() {
    if (exitControlListenersAttached) {
      window.removeEventListener('pointerdown', handleExitControlInput, true);
      window.removeEventListener('click', handleExitControlInput, true);
      exitControlListenersAttached = false;
    }
    if (exitControl && exitControl.parentNode) {
      exitControl.parentNode.removeChild(exitControl);
    }
    exitControl = null;
  }

  function isMobileDevice() {
    var userAgent = navigator.userAgent || '';
    var userAgentData = navigator.userAgentData;
    return Boolean(userAgentData && userAgentData.mobile) ||
      /Android|iPhone|iPod|IEMobile|Opera Mini/i.test(userAgent) ||
      (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1);
  }

  function isLandscapeViewport() {
    return window.innerWidth > window.innerHeight;
  }

  function blockInputWhileWaitingForLandscape(event) {
    if (!mobileLandscapeActive) return;
    if (mobileLandscapeIntroElapsed && isLandscapeViewport()) return;
    if (event.target && event.target.closest &&
        event.target.closest('#hangman-exit-control')) return;
    event.preventDefault();
    event.stopPropagation();
  }

  function attachLandscapeBlockers() {
    if (landscapeBlockersAttached) return;
    window.addEventListener('pointerdown', blockInputWhileWaitingForLandscape, true);
    window.addEventListener('click', blockInputWhileWaitingForLandscape, true);
    window.addEventListener('keydown', blockInputWhileWaitingForLandscape, true);
    landscapeBlockersAttached = true;
  }

  function detachLandscapeBlockers() {
    if (!landscapeBlockersAttached) return;
    window.removeEventListener('pointerdown', blockInputWhileWaitingForLandscape, true);
    window.removeEventListener('click', blockInputWhileWaitingForLandscape, true);
    window.removeEventListener('keydown', blockInputWhileWaitingForLandscape, true);
    landscapeBlockersAttached = false;
  }

  function ensureLandscapeOverlay() {
    if (landscapeOverlay && landscapeOverlay.isConnected) return landscapeOverlay;

    landscapeOverlay = document.createElement('div');
    landscapeOverlay.id = 'hangman-landscape-gate';
    landscapeOverlay.setAttribute('role', 'status');
    landscapeOverlay.setAttribute('aria-live', 'polite');
    landscapeOverlay.style.cssText = [
      'display:none',
      'position:fixed',
      'inset:0',
      'z-index:20000',
      'align-items:center',
      'justify-content:center',
      'padding:24px',
      'background:#f8f9fa',
      'color:#111827',
      'font-family:Inter,Arial,sans-serif',
      'text-align:center'
    ].join(';');
    landscapeOverlay.innerHTML =
      '<style>' +
        '@keyframes hangman-phone-turn{0%,20%{transform:rotate(0deg)}80%,100%{transform:rotate(90deg)}}' +
        '@keyframes hangman-turn-arrow{0%{stroke-dashoffset:120;opacity:.25}35%,100%{stroke-dashoffset:0;opacity:1}}' +
        '#hangman-landscape-gate .hangman-phone{transform-box:fill-box;transform-origin:center;animation:hangman-phone-turn 2s cubic-bezier(.65,0,.35,1) both}' +
        '#hangman-landscape-gate .hangman-turn-arrow{stroke-dasharray:120;animation:hangman-turn-arrow 2s ease-out both}' +
        '@media(prefers-reduced-motion:reduce){#hangman-landscape-gate .hangman-phone{animation:none;transform:rotate(90deg)}#hangman-landscape-gate .hangman-turn-arrow{animation:none;stroke-dashoffset:0}}' +
      '</style>' +
      '<div style="max-width:380px">' +
        '<svg viewBox="0 0 160 125" width="160" height="125" role="img" aria-label="Celular girando para a posição horizontal" style="display:block;margin:0 auto 12px;overflow:visible">' +
          '<path class="hangman-turn-arrow" d="M30 82C16 45 42 12 79 10C108 8 134 26 138 52" fill="none" stroke="#ffd100" stroke-width="8" stroke-linecap="round"/>' +
          '<path d="M128 43L139 53L144 38" fill="none" stroke="#ffd100" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<g class="hangman-phone">' +
            '<rect x="59" y="24" width="42" height="78" rx="8" fill="#0055d4"/>' +
            '<rect x="64" y="32" width="32" height="58" rx="3" fill="#f8f9fa"/>' +
            '<circle cx="80" cy="96" r="3" fill="#ffd100"/>' +
          '</g>' +
        '</svg>' +
        '<strong id="hangman-landscape-title" style="display:block;font:700 24px/1.15 Outfit,Inter,sans-serif;margin-bottom:10px">Gire o celular</strong>' +
        '<span id="hangman-landscape-message" style="display:block;font-size:16px;line-height:1.45">Use a tela na orientação horizontal para acompanhar a animação.</span>' +
      '</div>';
    document.body.appendChild(landscapeOverlay);
    return landscapeOverlay;
  }

  function showLandscapeOverlay(isIntro) {
    var overlay = ensureLandscapeOverlay();
    var title = overlay.querySelector('#hangman-landscape-title');
    var message = overlay.querySelector('#hangman-landscape-message');
    if (title) title.textContent = isIntro ? 'Prepare a tela' : 'Gire o celular';
    if (message) {
      message.textContent = isIntro
        ? 'A animação começará em modo horizontal.'
        : 'A animação continuará automaticamente na orientação horizontal.';
    }
    overlay.style.display = 'flex';
  }

  function hideLandscapeOverlay() {
    if (landscapeOverlay) landscapeOverlay.style.display = 'none';
  }

  function updateMobileLandscapeState() {
    if (!mobileLandscapeActive || !activeTimeline) return;

    if (!mobileLandscapeIntroElapsed) {
      detachFastForwardControls();
      attachLandscapeBlockers();
      showLandscapeOverlay(true);
      return;
    }

    if (!isLandscapeViewport()) {
      if (mobileLandscapeStarted) activeTimeline.pause();
      detachFastForwardControls();
      attachLandscapeBlockers();
      showLandscapeOverlay(false);
      return;
    }

    hideLandscapeOverlay();
    detachLandscapeBlockers();
    attachFastForwardControls();

    if (!mobileLandscapeStarted) {
      mobileLandscapeStarted = true;
      activeTimeline.play(0);
    } else if (activeTimeline.paused()) {
      activeTimeline.resume();
    }
  }

  function tryOrientationLock() {
    var orientation = window.screen && window.screen.orientation;
    if (!orientation || typeof orientation.lock !== 'function') {
      return Promise.resolve(false);
    }
    try {
      return orientation.lock('landscape').then(function () {
        return true;
      }).catch(function () {
        return false;
      });
    } catch (error) {
      return Promise.resolve(false);
    }
  }

  function requestMobileLandscapeLock() {
    var token = ++landscapeRequestToken;
    var root = document.documentElement;
    var requestFullscreen = root.requestFullscreen || root.webkitRequestFullscreen;
    var fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;

    function refreshOrientationState() {
      if (token !== landscapeRequestToken || !mobileLandscapeActive) return;
      window.setTimeout(updateMobileLandscapeState, 80);
    }

    if (!fullscreenElement && typeof requestFullscreen === 'function') {
      try {
        Promise.resolve(requestFullscreen.call(root)).then(function () {
          if (token !== landscapeRequestToken || !mobileLandscapeActive) return false;
          mobileFullscreenOwned = true;
          return tryOrientationLock();
        }).then(refreshOrientationState).catch(function () {
          return tryOrientationLock().then(refreshOrientationState);
        });
      } catch (error) {
        tryOrientationLock().then(refreshOrientationState);
      }
      return;
    }

    tryOrientationLock().then(refreshOrientationState);
  }

  function playTimelineWithMobileLandscape() {
    if (!isMobileDevice()) {
      attachFastForwardControls();
      activeTimeline.play(0);
      return;
    }

    mobileLandscapeActive = true;
    mobileLandscapeStarted = false;
    mobileLandscapeIntroElapsed = false;
    window.addEventListener('resize', updateMobileLandscapeState);
    window.addEventListener('orientationchange', updateMobileLandscapeState);

    /* A solicitação precisa acontecer imediatamente dentro do gesto que
       iniciou o jogo para os navegadores móveis aceitarem tela cheia. */
    requestMobileLandscapeLock();
    attachLandscapeBlockers();
    showLandscapeOverlay(true);
    mobileLandscapeIntroTimer = window.setTimeout(function () {
      mobileLandscapeIntroTimer = null;
      mobileLandscapeIntroElapsed = true;
      updateMobileLandscapeState();
    }, MOBILE_LANDSCAPE_INTRO_MS);
    updateMobileLandscapeState();
  }

  function releaseMobileLandscapeMode() {
    var hadMobileLandscapeSession = mobileLandscapeActive || mobileFullscreenOwned;
    landscapeRequestToken += 1;
    mobileLandscapeActive = false;
    mobileLandscapeStarted = false;
    mobileLandscapeIntroElapsed = false;
    if (mobileLandscapeIntroTimer !== null) {
      window.clearTimeout(mobileLandscapeIntroTimer);
      mobileLandscapeIntroTimer = null;
    }
    window.removeEventListener('resize', updateMobileLandscapeState);
    window.removeEventListener('orientationchange', updateMobileLandscapeState);
    detachLandscapeBlockers();
    hideLandscapeOverlay();

    if (landscapeOverlay && landscapeOverlay.parentNode) {
      landscapeOverlay.parentNode.removeChild(landscapeOverlay);
      landscapeOverlay = null;
    }

    var orientation = window.screen && window.screen.orientation;
    if (hadMobileLandscapeSession && orientation && typeof orientation.unlock === 'function') {
      try { orientation.unlock(); } catch (error) { /* Sem suporte no navegador. */ }
    }

    if (mobileFullscreenOwned) {
      var exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
      mobileFullscreenOwned = false;
      if (typeof exitFullscreen === 'function' &&
          (document.fullscreenElement || document.webkitFullscreenElement)) {
        try {
          var exitResult = exitFullscreen.call(document);
          if (exitResult && typeof exitResult.catch === 'function') {
            exitResult.catch(function () {});
          }
        } catch (error) { /* A saída pode já ter sido feita pelo usuário. */ }
      }
    }
  }

  function prefersReducedMotion() {
    return Boolean(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function renderFloatingPiece(state) {
    if (!state || !state.piece || !window.gsap) return;
    window.gsap.set(state.piece, {
      x: state.baseX + state.emotionX,
      y: state.baseY + state.floatY + state.waveY + state.reactY + state.emotionY,
      rotation: state.rotation + state.emotionRotation,
      transformOrigin: state.transformOrigin || '50% 50%'
    });
  }

  function stopGallowsSway() {
    if (gallowsSwayTimeline) {
      gallowsSwayTimeline.kill();
      gallowsSwayTimeline = null;
    }
    gallowsSwayAngle = 0;
  }

  function startGallowsSway(parts) {
    var gsap = window.gsap;
    if (!gsap || gallowsSwayTimeline || !parts || !parts.gallows) return;
    var attached = activeGallowsPose.attachedPiece;
    gallowsSwayTimeline = gsap.timeline({ repeat: -1, yoyo: true });
    gallowsSwayTimeline.to({ angle: 0 }, {
      angle: 2.2,
      duration: prefersReducedMotion() ? 1.2 : 2.8,
      ease: 'sine.inOut',
      onUpdate: function () {
        var angle = this.targets()[0].angle;
        gallowsSwayAngle = angle;
        gsap.set(parts.gallows, { rotation: angle, transformOrigin: '290px 194px' });
        floatingPieceStates.forEach(function (state) {
          if (!state.hung) return;
          gsap.set(state.piece, { rotation: state.rotation + angle * (state.pieceId === attached ? 0.9 : 0.65) });
        });
      }
    });
  }

  function stopFloatingPieces() {
    var gsap = window.gsap;

    stopGallowsSway();

    floatingAnimations.forEach(function (animation) {
      if (animation && typeof animation.kill === 'function') animation.kill();
    });
    floatingAnimations = [];

    floatingPieceStates.forEach(function (state) {
      if (state.reactionTimeline) state.reactionTimeline.kill();
      if (gsap) gsap.killTweensOf(state);
      if (state.piece) state.piece.style.willChange = '';
    });
    floatingPieceStates = [];

    if (floatingInteractionsAttached) {
      window.removeEventListener('pointerdown', handleFloatingSlotInput, true);
      window.removeEventListener('pointerover', handleFloatingHover, true);
      document.removeEventListener('hangman:piece-react', handleFloatingPieceEvent);
      floatingInteractionsAttached = false;
    }
  }

  function findFloatingPiece(identifier) {
    if (typeof identifier === 'number' && Number.isFinite(identifier)) {
      return floatingPieceStates[Math.max(0, Math.min(
        floatingPieceStates.length - 1,
        Math.floor(identifier)
      ))] || null;
    }
    if (typeof identifier === 'string') {
      for (var i = 0; i < floatingPieceStates.length; i += 1) {
        if (floatingPieceStates[i].pieceId === identifier) return floatingPieceStates[i];
      }
    }
    return null;
  }

  function reactFloatingPiece(identifier) {
    var gsap = window.gsap;
    var state = findFloatingPiece(identifier);
    if (!gsap || !state || state.hung) return false;

    if (state.reactionTimeline) state.reactionTimeline.kill();
    gsap.killTweensOf(state, 'reactY');
    state.reactY = 0;

    var distance = prefersReducedMotion() ? 1 : 4;
    var render = function () { renderFloatingPiece(state); };
    state.reactionTimeline = gsap.timeline({
      onComplete: function () {
        state.reactionTimeline = null;
        document.dispatchEvent(new CustomEvent('hangman:piece-reacted', {
          detail: { index: state.index, pieceId: state.pieceId }
        }));
      }
    });
    state.reactionTimeline
      .to(state, {
        reactY: distance,
        duration: 0.18,
        ease: 'power2.out',
        onUpdate: render
      })
      .to(state, {
        reactY: 0,
        duration: 0.32,
        ease: 'power2.inOut',
        onUpdate: render
      });
    return true;
  }

  function handleFloatingSlotInput(event) {
    if (!floatingPieceStates.length || !event.target || !event.target.closest) return;
    var target = event.target.closest('[data-hangman-piece]');
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    reactFloatingPiece(target.getAttribute('data-hangman-piece'));
  }

  function handleFloatingHover(event) {
    if (!floatingPieceStates.length || !event.target || !event.target.closest) return;
    var target = event.target.closest('[data-hangman-piece]');
    if (!target || (event.relatedTarget && target.contains(event.relatedTarget))) return;
    reactFloatingPiece(target.getAttribute('data-hangman-piece'));
  }

  function handleFloatingPieceEvent(event) {
    var detail = event.detail || {};
    var identifier = detail.pieceId !== undefined ? detail.pieceId : detail.index;
    reactFloatingPiece(identifier);
  }

  function attachFloatingInteractions() {
    if (floatingInteractionsAttached) return;
    window.addEventListener('pointerdown', handleFloatingSlotInput, true);
    window.addEventListener('pointerover', handleFloatingHover, true);
    document.addEventListener('hangman:piece-react', handleFloatingPieceEvent);
    floatingInteractionsAttached = true;
  }

  function startFloatingPieces(rowTargets) {
    var gsap = window.gsap;
    if (!gsap || !rowTargets || !rowTargets.length) return;

    stopFloatingPieces();
    var reduced = prefersReducedMotion();

    floatingPieceStates = rowTargets.map(function (piece, index) {
      var state = {
        index: index,
        pieceId: activeGallowsPose.order[index] || DISASSEMBLY_ROW_ORDER[index],
        piece: piece,
        baseX: Number(gsap.getProperty(piece, 'x')) || 0,
        baseY: Number(gsap.getProperty(piece, 'y')) || 0,
        floatY: 0,
        waveY: 0,
        reactY: 0,
        emotionX: 0,
        emotionY: 0,
        emotionRotation: 0,
        rotation: 0,
        transformOrigin: '50% 50%',
        reactionTimeline: null,
        floatTimeline: null,
        hung: false
      };
      piece.setAttribute('data-hangman-piece', state.pieceId);
      piece.style.cursor = 'pointer';
      piece.style.willChange = 'transform';
      return state;
    });

    floatingPieceStates.forEach(function (state, index) {
      var distance = reduced ? 1 : FLOAT_DISTANCES[index];
      var rotation = reduced ? 0 : FLOAT_ROTATIONS[index];
      var duration = FLOAT_DURATIONS[index];
      var render = function () { renderFloatingPiece(state); };
      var floatingTimeline = gsap.timeline({
        repeat: -1,
        delay: index * 0.13
      });

      floatingTimeline
        .to(state, {
          floatY: -distance,
          rotation: -rotation,
          duration: duration * 0.25,
          ease: 'sine.inOut',
          onUpdate: render
        })
        .to(state, {
          floatY: distance,
          rotation: rotation,
          duration: duration * 0.5,
          ease: 'sine.inOut',
          onUpdate: render
        })
        .to(state, {
          floatY: 0,
          rotation: 0,
          duration: duration * 0.25,
          ease: 'sine.inOut',
          onUpdate: render
        });
      state.floatTimeline = floatingTimeline;
      floatingAnimations.push(floatingTimeline);
    });

    var waveDistance = reduced ? 1 : 3;
    var waveTimeline = gsap.timeline({ repeat: -1, repeatDelay: 5.5, delay: 5.5 });
    floatingPieceStates.forEach(function (state, index) {
      var render = function () { renderFloatingPiece(state); };
      var waveStart = index * 0.07;
      waveTimeline.to(state, {
        waveY: -waveDistance,
        duration: 0.24,
        ease: 'power2.out',
        onUpdate: render
      }, waveStart);
      waveTimeline.to(state, {
        waveY: 0,
        duration: 0.42,
        ease: 'sine.inOut',
        onUpdate: render
      }, waveStart + 0.24);
    });
    floatingAnimations.push(waveTimeline);
    attachFloatingInteractions();
  }

  function animateFloatingMood(type) {
    var gsap = window.gsap;
    if (!gsap || !floatingPieceStates.length) return false;
    var reduced = prefersReducedMotion();

    floatingPieceStates.forEach(function (state, index) {
      if (state.hung) return;
      gsap.killTweensOf(state, 'emotionX,emotionY,emotionRotation');
      state.emotionX = 0;
      state.emotionY = 0;
      state.emotionRotation = 0;
      var direction = index % 2 ? 1 : -1;
      var render = function () { renderFloatingPiece(state); };
      var tween = gsap.to(state, type === 'celebrate' ? {
        emotionX: direction * (reduced ? 0.5 : 1.8),
        emotionY: reduced ? -0.6 : -3.8,
        emotionRotation: direction * (reduced ? 1 : 7),
        duration: reduced ? 0.16 : 0.11,
        repeat: type === 'celebrate' ? -1 : (reduced ? 1 : 9),
        yoyo: true,
        ease: 'power1.inOut',
        onUpdate: render,
        onComplete: function () {
          state.emotionX = 0;
          state.emotionY = 0;
          state.emotionRotation = 0;
          render();
        }
      } : {
        emotionX: direction * (reduced ? 0.35 : 1.15),
        emotionY: direction * (reduced ? 0.15 : 0.45),
        emotionRotation: direction * (reduced ? 0.5 : 2.4),
        duration: reduced ? 0.14 : 0.075,
        repeat: reduced ? 1 : 9,
        yoyo: true,
        ease: 'none',
        onUpdate: render,
        onComplete: function () {
          state.emotionX = 0;
          state.emotionY = 0;
          state.emotionRotation = 0;
          render();
        }
      });
      floatingAnimations.push(tween);
    });
    return true;
  }

  function movePieceToGallows(identifier, parts) {
    var gsap = window.gsap;
    var state = findFloatingPiece(identifier);
    if (!gsap || !state || state.hung) return false;
    var target = activeGallowsPose.targets[state.pieceId] || GALLOWS_PIECE_TARGETS[state.pieceId];
    if (!target) return false;

    state.hung = true;
    if (state.floatTimeline) state.floatTimeline.kill();
    if (state.reactionTimeline) state.reactionTimeline.kill();
    gsap.killTweensOf(state);
    state.floatY = 0;
    state.waveY = 0;
    state.reactY = 0;
    state.emotionX = 0;
    state.emotionY = 0;
    state.emotionRotation = 0;
    state.rotation = 0;
    if (state.piece.parentNode) state.piece.parentNode.appendChild(state.piece);

    var localAnchor = target.localAnchor || PIECE_ANCHORS[state.pieceId] || { x: 0, y: 0 };
    state.transformOrigin = localAnchor.x + 'px ' + localAnchor.y + 'px';
    var tween = gsap.to(state, {
      baseX: target.x - TRAVEL_X - localAnchor.x,
      baseY: target.y - localAnchor.y,
      rotation: target.rotation,
      duration: prefersReducedMotion() ? 0.25 : 0.9,
      ease: 'power2.inOut',
      onUpdate: function () { renderFloatingPiece(state); },
      onComplete: function () {
        renderFloatingPiece(state);
        document.dispatchEvent(new CustomEvent('hangman:piece-hung', {
          detail: { index: state.index, pieceId: state.pieceId }
        }));
      }
    });
    floatingAnimations.push(tween);
    return true;
  }

  function fearAndHangPiece(identifier) {
    if (!window.gsap) return false;
    animateFloatingMood('fear');
    var delayed = window.gsap.delayedCall(prefersReducedMotion() ? 0.2 : 0.78, function () {
      movePieceToGallows(identifier, activeParts);
    });
    floatingAnimations.push(delayed);
    return true;
  }

  var topicRevealStylesInjected = false;

  function ensureTopicRevealStyles() {
    if (topicRevealStylesInjected) return;
    topicRevealStylesInjected = true;
    var style = document.createElement('style');
    style.id = 'hangman-topic-reveal-styles';
    style.textContent =
      '#hangman-topic-reveal{position:absolute;right:6px;top:50%;' +
      'transform:translateY(-50%);z-index:3;color:#d1273f;font-family:"Caveat",cursive;' +
      'font-weight:700;text-decoration:underline;text-underline-offset:6px;' +
      'font-size:clamp(22px,3.4vw,34px);white-space:nowrap;pointer-events:none;' +
      'clip-path:inset(0 100% 0 0);}';
    document.head.appendChild(style);
  }

  /* O texto do topico mora dentro do <nav>, perto da ponta da seta amarela
     do menu (mesma area onde fica o botao "Agendar Diagnostico"). Ele e
     revelado progressivamente enquanto o boneco caminha, usando a mesma
     janela de tempo (walkStart / totalWalkDuration) do resto da caminhada
     -- o mesmo principio da forca, que ja esta desenhada e so entra no
     enquadramento pelo movimento da cena. */
  function ensureTopicReveal() {
    var el = document.getElementById('hangman-topic-reveal');
    if (el) return el;
    var nav = document.querySelector('.navbar');
    if (!nav) return null;
    ensureTopicRevealStyles();
    el = document.createElement('div');
    el.id = 'hangman-topic-reveal';
    el.setAttribute('aria-hidden', 'true');
    nav.appendChild(el);
    return el;
  }

  function hideTopicReveal() {
    var el = document.getElementById('hangman-topic-reveal');
    if (!el) return;
    el.textContent = '';
    el.style.clipPath = 'inset(0 100% 0 0)';
  }

  /* O jogo da velha desloca a página como um cenário único quando precisa
     abrir espaço lateral. A forca usa o mesmo princípio sem depender nem
     alterar o listener daquele jogo. */
  function ensurePageCamera() {
    if (pageCamera && pageCamera.isConnected) return pageCamera;

    pageCamera = document.getElementById('hangman-page-camera');
    if (pageCamera) return pageCamera;

    pageCamera = document.createElement('div');
    pageCamera.id = 'hangman-page-camera';
    pageCamera.style.willChange = 'transform';

    Array.prototype.slice.call(document.body.children).forEach(function (child) {
      pageCamera.appendChild(child);
    });
    document.body.appendChild(pageCamera);
    return pageCamera;
  }

  function collectParts() {
    var parts = {
      restCharacter: document.getElementById('rest-character'),
      rig: document.getElementById('character-rig'),
      world: document.getElementById('hangman-world'),
      travel: document.getElementById('character-travel'),
      svg: document.getElementById('mascote-animavel'),
      pageCamera: pageCamera,
      book: document.getElementById('hangman-book'),
      bookShape: document.getElementById('hangman-book-shape'),
      slots: document.getElementById('hangman-slots'),
      gallows: document.getElementById('hangman-gallows'),
      gallowsStrokes: Array.prototype.slice.call(document.querySelectorAll('#hangman-gallows .gallows-stroke')),
      floatingCard: document.querySelector('.card-equation'),
      hero: document.querySelector('.hero'),
      pieceEls: {},
      pathEls: {}
    };

    PIECE_IDS.forEach(function (pieceId) {
      parts.pieceEls[pieceId] = document.getElementById(pieceId);
      PIECES[pieceId].forEach(function (pathId) {
        parts.pathEls[pathId] = document.getElementById(pathId);
      });
    });

    return parts;
  }

  function hasCompleteRig(parts) {
    if (!parts.restCharacter || !parts.rig || !parts.world || !parts.travel ||
        !parts.svg || !parts.pageCamera ||
        !parts.book || !parts.bookShape || !parts.slots || !parts.gallows ||
        parts.gallowsStrokes.length !== 5) {
      return false;
    }
    return PIECE_IDS.every(function (pieceId) {
      if (!parts.pieceEls[pieceId]) return false;
      return PIECES[pieceId].every(function (pathId) {
        return !!parts.pathEls[pathId];
      });
    });
  }

  function clearSlots(slotsGroup) {
    while (slotsGroup.firstChild) {
      slotsGroup.removeChild(slotsGroup.firstChild);
    }
  }

  function isLetter(character) {
    return character.toLocaleLowerCase('pt-BR') !== character.toLocaleUpperCase('pt-BR');
  }

  function normalizeLetter(character) {
    return character.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleUpperCase('pt-BR');
  }

  function createRound(input) {
    var rawWord = '';
    var hint = '';
    var topic = '';

    if (typeof input === 'string') {
      rawWord = input;
    } else if (input && typeof input === 'object') {
      rawWord = typeof input.word === 'string' ? input.word :
        (typeof input.palavra === 'string' ? input.palavra : '');
      hint = typeof input.hint === 'string' ? input.hint.trim() :
        (typeof input.charada === 'string' ? input.charada.trim() : '');
      topic = typeof input.topic === 'string' ? input.topic.trim() :
        (typeof input.topico === 'string' ? input.topico.trim() : '');
    } else if (typeof input !== 'undefined' && input !== null) {
      console.warn('A palavra da forca deve ser uma string ou um objeto { word, hint, topic }.');
      return null;
    }

    rawWord = rawWord.trim().replace(/\s+/g, ' ');
    if (!rawWord) {
      rawWord = DEFAULT_WORD;
      hint = hint || DEFAULT_HINT;
    }

    var characters = Array.from(rawWord.toLocaleUpperCase('pt-BR'));
    if (characters.length > MAX_WORD_CHARACTERS) {
      console.warn('A palavra da forca excede o limite de ' + MAX_WORD_CHARACTERS + ' caracteres.');
      return null;
    }

    var letters = characters.filter(isLetter);
    if (!letters.length) {
      console.warn('A palavra da forca precisa conter ao menos uma letra.');
      return null;
    }
    if (letters.length > MAX_WORD_LETTERS) {
      console.warn('A palavra da forca excede o limite de ' + MAX_WORD_LETTERS + ' letras jogáveis.');
      return null;
    }

    return {
      word: characters.join(''),
      normalizedWord: letters.map(normalizeLetter).join(''),
      hint: hint,
      topic: topic,
      characters: characters,
      letterCount: letters.length,
      isPlaceholder: false
    };
  }

  function buildSlots(slotsGroup, round) {
    clearSlots(slotsGroup);
    var safeLetterCount = Math.max(1, round.letterCount);
    /* Seis letras reproduzem exatamente o desenho aprovado: traço 20 e
       intervalo 8. Acima disso, os dois valores diminuem dentro das mesmas
       160 unidades, sem aumentar o mundo horizontal. */
    var spaceCount = round.characters.filter(function (character) {
      return character === ' ';
    }).length;
    var separatorCount = round.characters.filter(function (character) {
      return character !== '' && character !== ' ' && !isLetter(character);
    }).length;
    var spacingUnits = Math.max(0, round.characters.length - 1) +
      spaceCount * 1.5 + separatorCount * 2;
    var idealGap = Math.max(3, Math.min(
      SLOT_GAP,
      SLOT_GAP * DEFAULT_WORD_LENGTH / safeLetterCount
    ));
    var fittingGap = spacingUnits
      ? (SLOT_AREA_WIDTH - 5 * safeLetterCount) / spacingUnits
      : idealGap;
    var slotGap = Math.max(1.5, Math.min(idealGap, fittingGap));
    var spaceWidth = slotGap * 1.5;
    var separatorWidth = slotGap * 2;
    var characterWidths = round.characters.map(function (character) {
      if (isLetter(character) || character === '') return 0;
      return character === ' ' ? spaceWidth : separatorWidth;
    });
    var reservedCharacterWidth = characterWidths.reduce(function (sum, width) {
      return sum + width;
    }, 0);
    var totalGapWidth = slotGap * Math.max(0, round.characters.length - 1);
    var slotWidth = Math.min(
      REFERENCE_SLOT_WIDTH,
      (SLOT_AREA_WIDTH - reservedCharacterWidth - totalGapWidth) / safeLetterCount
    );
    slotWidth = Math.max(5, slotWidth);
    var cursorX = SLOT_START_X;
    var playableIndex = 0;

    round.characters.forEach(function (character, characterIndex) {
      var characterWidth = characterWidths[characterIndex] || slotWidth;
      if (!isLetter(character) && character !== '') {
        if (character !== ' ') {
          var separator = document.createElementNS(SVG_NS, 'text');
          separator.setAttribute('class', 'hangman-separator');
          separator.setAttribute('x', cursorX + characterWidth / 2);
          separator.setAttribute('y', SLOT_Y + 1);
          separator.setAttribute('fill', SLOT_COLOR);
          separator.setAttribute('font-size', 8);
          separator.setAttribute('font-weight', 700);
          separator.setAttribute('text-anchor', 'middle');
          separator.textContent = character;
          slotsGroup.appendChild(separator);
        }
        cursorX += characterWidth + slotGap;
        return;
      }

      var x1 = cursorX;
      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('class', 'hangman-slot');
      line.setAttribute('pathLength', '1');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', SLOT_Y);
      line.setAttribute('x2', x1 + slotWidth);
      line.setAttribute('y2', SLOT_Y);
      line.setAttribute('stroke', SLOT_COLOR);
      line.setAttribute('stroke-width', SLOT_STROKE_WIDTH);
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('fill', 'none');
      line.setAttribute('data-hangman-piece', DISASSEMBLY_ROW_ORDER[playableIndex] || '');
      line.setAttribute('data-slot-index', playableIndex);
      line.setAttribute('data-character-index', characterIndex);
      if (character) {
        line.setAttribute('data-letter', character);
        line.setAttribute('data-normalized-letter', normalizeLetter(character));
      }
      line.style.strokeDasharray = '1';
      line.style.strokeDashoffset = '1';
      slotsGroup.appendChild(line);

      /* Área transparente mais larga para clique/toque sem engrossar o traço. */
      var hitLine = document.createElementNS(SVG_NS, 'line');
      hitLine.setAttribute('class', 'hangman-slot-hit');
      hitLine.setAttribute('x1', x1);
      hitLine.setAttribute('y1', SLOT_Y);
      hitLine.setAttribute('x2', x1 + slotWidth);
      hitLine.setAttribute('y2', SLOT_Y);
      hitLine.setAttribute('stroke', 'transparent');
      hitLine.setAttribute('stroke-width', 12);
      hitLine.setAttribute('stroke-linecap', 'round');
      hitLine.setAttribute('pointer-events', 'stroke');
      hitLine.setAttribute('data-hangman-piece', DISASSEMBLY_ROW_ORDER[playableIndex] || '');
      hitLine.setAttribute('data-slot-index', playableIndex);
      hitLine.setAttribute('data-character-index', characterIndex);
      hitLine.style.cursor = 'pointer';
      slotsGroup.appendChild(hitLine);
      playableIndex += 1;
      cursorX += characterWidth + slotGap;
    });

    slotsGroup.setAttribute('aria-label', round.hint
      ? round.letterCount + ' letras. Dica: ' + round.hint
      : round.letterCount + ' letras');

    return {
      areaWidth: SLOT_AREA_WIDTH,
      slotWidth: slotWidth,
      slotGap: slotGap,
      travelX: TRAVEL_X,
      cameraX: CAMERA_X,
      gallowsShiftX: 0,
      walkCycles: WALK_CYCLES,
      rowCenters: DISASSEMBLY_ROW_ORDER.map(function (_pieceId, index) {
        var firstCenter = SLOT_START_X + REFERENCE_SLOT_WIDTH / 2;
        var lastCenter = SLOT_START_X + SLOT_AREA_WIDTH - REFERENCE_SLOT_WIDTH / 2;
        return firstCenter + (lastCenter - firstCenter) * index / (DISASSEMBLY_ROW_ORDER.length - 1);
      })
    };
  }

  function getFrames() {
    var data = window.MASCOT_POSES;
    return data && data.frames && data.frames.length ? data.frames : null;
  }

  function applyFrame(parts, frame) {
    frame.order.forEach(function (pieceId) {
      var piece = parts.pieceEls[pieceId];
      if (piece && piece.parentNode) {
        piece.parentNode.appendChild(piece);
      }
    });
    Object.keys(frame.paths).forEach(function (pathId) {
      var pathEl = parts.pathEls[pathId];
      if (pathEl) {
        pathEl.setAttribute('d', frame.paths[pathId]);
      }
    });
  }

  function applyOrder(parts, frame) {
    frame.order.forEach(function (pieceId) {
      var piece = parts.pieceEls[pieceId];
      if (piece && piece.parentNode) {
        piece.parentNode.appendChild(piece);
      }
    });
  }

  function tweenFrame(timeline, parts, frame, frameIndex, duration, explicitPosition) {
    var position = typeof explicitPosition === 'number' ? explicitPosition : timeline.duration();
    /* Muda apenas a ordem visual. Aplicar os paths completos aqui faria a
       pose saltar para o destino antes de o GSAP interpolar o atributo d. */
    timeline.call(function () {
      applyOrder(parts, frame);
    }, null, position);

    Object.keys(frame.paths).forEach(function (pathId) {
      var pathEl = parts.pathEls[pathId];
      if (!pathEl) return;
      timeline.to(pathEl, {
        attr: { d: frame.paths[pathId] },
        duration: duration,
        ease: (frameIndex >= 7 && frameIndex <= 16) ? 'sine.inOut' : 'power2.inOut'
      }, position);
    });

    return position;
  }

  function getHeroShiftPx(parts, cameraX) {
    var rect = parts.svg.getBoundingClientRect();
    var viewBox = parts.svg.viewBox && parts.svg.viewBox.baseVal;
    if (!viewBox || !viewBox.width || !rect.width) return 0;
    return cameraX * (rect.width / viewBox.width);
  }

  function buildTimeline(parts, frames, layout) {
    var gsap = window.gsap;
    var timeline = gsap.timeline({ paused: true });
    var heroShiftPx = getHeroShiftPx(parts, layout.cameraX);

    /* Pose inicial já aplicada de forma síncrona antes de o rig aparecer
       (ver startHangmanGame). Mantemos a pose 0 visível por sua duração
       aprovada antes de iniciar a transição para a pose seguinte. */
    timeline.to({}, { duration: frames[0].duration });

    for (var i = 1; i < WALK_FRAME_INDEXES[0]; i += 1) {
      var frameStart = tweenFrame(timeline, parts, frames[i], i, frames[i].duration);
      if (i === 1) {
        timeline.to(parts.bookShape, {
          attr: { d: BOOK_LOWERED_PATH },
          duration: frames[i].duration,
          ease: 'power2.inOut'
        }, frameStart);
      }
      if (i === STANDING_FRAME_INDEX) {
        timeline.call(function () {
          document.dispatchEvent(new CustomEvent('hangman:standing'));
        });
      }
    }

    var walkStart = timeline.duration();
    var cycleDuration = WALK_FRAME_INDEXES.reduce(function (sum, idx) {
      return sum + frames[idx].duration;
    }, 0);
    var totalWalkDuration = cycleDuration * layout.walkCycles;

    timeline.addLabel('walk-start', walkStart);
    timeline.to(parts.travel, {
      x: layout.travelX,
      duration: totalWalkDuration,
      ease: 'none'
    }, walkStart);
    timeline.to(parts.pageCamera, {
      x: -heroShiftPx,
      duration: totalWalkDuration,
      ease: 'none'
    }, walkStart);

    var topicEl = ensureTopicReveal();
    if (topicEl) {
      topicEl.textContent = (activeRound && activeRound.topic) || '';
      topicEl.style.clipPath = 'inset(0 100% 0 0)';
      var topicRevealState = { percent: 0 };
      timeline.to(topicRevealState, {
        percent: 100,
        duration: totalWalkDuration,
        ease: 'none',
        onUpdate: function () {
          topicEl.style.clipPath = 'inset(0 ' + (100 - topicRevealState.percent) + '% 0 0)';
        }
      }, walkStart);
    }

    /* Os frames da marcha usam o mesmo cursor temporal do deslocamento.
       Antes eles eram inseridos após o tween da câmera, causando o deslize
       estático denunciado por Allan. */
    var walkCursor = walkStart;
    for (var cycle = 0; cycle < layout.walkCycles; cycle += 1) {
      WALK_FRAME_INDEXES.forEach(function (idx) {
        tweenFrame(timeline, parts, frames[idx], idx, frames[idx].duration, walkCursor);
        walkCursor += frames[idx].duration;
      });
    }

    /* Cada espaço surge logo depois que o mascote passa por ele. */
    var slotNodes = Array.prototype.slice.call(parts.slots.querySelectorAll('.hangman-slot'));
    timeline.set(parts.slots, { autoAlpha: 1 }, walkStart);
    slotNodes.forEach(function (slot) {
      var slotCenter = (Number(slot.getAttribute('x1')) + Number(slot.getAttribute('x2'))) / 2;
      var passProgress = Math.max(0.12, Math.min(0.98, (slotCenter - 47) / layout.travelX));
      timeline.to(slot, {
        strokeDashoffset: 0,
        duration: 0.2,
        ease: 'power1.out'
      }, walkStart + totalWalkDuration * passProgress);
    });

    /* Primeiro termina a passada e assume a pose neutra de chegada. */
    tweenFrame(
      timeline,
      parts,
      frames[WALK_COMPLETE_FRAME_INDEX],
      WALK_COMPLETE_FRAME_INDEX,
      frames[WALK_COMPLETE_FRAME_INDEX].duration,
      walkCursor
    );

    timeline.addLabel('walk-complete');
    timeline.call(function () {
      document.dispatchEvent(new CustomEvent('hangman:walk-complete'));
      document.dispatchEvent(new CustomEvent('hangman:camera-complete'));
    }, null, 'walk-complete');

    /* A forca já está desenhada no mundo desde o começo. Ela não recebe
       fade: entra gradualmente no enquadramento pelo próprio movimento da
       câmera e está completamente revelada quando o mascote termina a
       caminhada. */
    timeline.addLabel('gallows-reveal', 'walk-complete');
    timeline.call(function () {
      document.dispatchEvent(new CustomEvent('hangman:gallows-revealed'));
    }, null, 'gallows-reveal');

    for (var j = WALK_COMPLETE_FRAME_INDEX + 1; j < frames.length; j += 1) {
      tweenFrame(timeline, parts, frames[j], j, frames[j].duration);
    }

    /* Depois da pose de desmontagem, cada uma das seis peças lógicas vai
       para o campo correspondente. Os valores são calculados somente quando
       este trecho começa, portanto getBBox() já lê as formas finais da pose
       23. Cotovelos e joelhos continuam dentro dos grupos de braço/perna.
       Todas as peças terminam com o centro na mesma altura do laço. */
    var rowTargets = activeGallowsPose.order.map(function (pieceId) {
      return parts.pieceEls[pieceId];
    });
    /* Distribui os centros conforme a largura real de cada grupo, em vez de
       usar seis posições fixas. Isso mantém uma folga visível entre peças. */
    var rowGap = 9;
    var rowWidths = rowTargets.map(function (piece) {
      var box = piece.getBBox();
      return Math.max(10, box.width);
    });
    var rowTotalWidth = rowWidths.reduce(function (sum, width) { return sum + width; }, 0) +
      rowGap * Math.max(0, rowWidths.length - 1);
    var rowCursor = SLOT_START_X + SLOT_AREA_WIDTH / 2 - rowTotalWidth / 2;
    layout.rowCenters = rowWidths.map(function (width) {
      var center = rowCursor + width / 2;
      rowCursor += width + rowGap;
      return center;
    });
    var settleOvershoot = prefersReducedMotion() ? 0.5 : 1.5;
    timeline.addLabel('pieces-row');
    timeline.to(rowTargets, {
      x: function (index, piece) {
        var box = piece.getBBox();
        return layout.rowCenters[index] - layout.travelX - (box.x + box.width / 2);
      },
      y: function (index, piece) {
        var box = piece.getBBox();
        return PIECE_ROW_CENTER_Y - (box.y + box.height / 2) - settleOvershoot;
      },
      /* O deslocamento mantém o ritmo original; só antecipamos o início
         para não existir um intervalo vazio após a desmontagem. */
      duration: 0.8,
      stagger: 0.08,
      ease: 'power2.inOut'
    }, 'pieces-row');

    timeline.to(rowTargets, {
      y: '+=' + settleOvershoot,
      duration: 0.45,
      stagger: 0.08,
      ease: 'back.out(1.4)'
    }, '>-0.05');

    timeline.call(function () {
      detachFastForwardControls();
      startFloatingPieces(rowTargets);
      document.dispatchEvent(new CustomEvent('hangman:sequence-complete'));
    });

    return timeline;
  }

  function resetPose(parts, frames) {
    var gsap = window.gsap;

    detachFastForwardControls();
    stopFloatingPieces();
    activeParts = parts;
    releaseMobileLandscapeMode();
    removeExitControl();

    if (activeTimeline) {
      activeTimeline.timeScale(1);
      activeTimeline.kill();
      activeTimeline = null;
    }

    if (parts.hero) {
      parts.hero.classList.remove('hangman-active');
    }
    if (parts.floatingCard) {
      gsap.set(parts.floatingCard, { autoAlpha: 1 });
    }

    gsap.set([parts.world, parts.travel, parts.book, parts.pageCamera], { x: 0 });
    gsap.set(parts.gallows, { x: 0 });
    gsap.set(parts.gallows, { rotation: 0, transformOrigin: '290px 194px' });
    activeRound = null;
    hideTopicReveal();

    if (frames && frames[0]) {
      applyFrame(parts, frames[0]);
    }

    gsap.set(PIECE_IDS.map(function (pieceId) {
      return parts.pieceEls[pieceId];
    }), { x: 0, y: 0, rotation: 0 });

    gsap.set(parts.rig, { autoAlpha: 0 });
    gsap.set(parts.restCharacter, { autoAlpha: 1 });
    gsap.set(parts.book, { autoAlpha: 0 });
    gsap.set(parts.bookShape, { attr: { d: BOOK_INITIAL_PATH } });

    gsap.set(parts.slots, { autoAlpha: 0 });
    clearSlots(parts.slots);
    gsap.set(parts.gallows, { autoAlpha: 1 });
    gsap.set(parts.gallowsStrokes, {
      strokeDasharray: 1,
      strokeDashoffset: 0
    });
    document.dispatchEvent(new CustomEvent('hangman:reset'));
  }

  function startHangmanGame(options) {
    var gsap = window.gsap;
    if (typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, left: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
    ensurePageCamera();
    var parts = collectParts();
    var frames = getFrames();
    var round = createRound(options);

    var requestedPose = options && typeof options === 'object' ? options.gallowsPose : null;
    var poseIndex = Number.isInteger(Number(requestedPose)) ? Number(requestedPose) : Math.floor(Math.random() * GALLOWS_POSES.length);
    activeGallowsPose = GALLOWS_POSES[Math.max(0, Math.min(GALLOWS_POSES.length - 1, poseIndex))];

    if (!gsap) {
      console.warn('A animação da forca aguarda o carregamento do GSAP.');
      return null;
    }
    if (!frames) {
      console.warn('A animação da forca não encontrou os dados das 23 poses aprovadas (mascote-pose-data.js).');
      return null;
    }
    if (!round) return null;
    if (!hasCompleteRig(parts)) {
      console.warn('A animação da forca não encontrou o rig completo do mascote no index.html.');
      return null;
    }

    resetPose(parts, frames);
    activeRound = round;
    var layout = buildSlots(parts.slots, round);
    gsap.set(parts.gallows, { x: layout.gallowsShiftX });
    document.dispatchEvent(new CustomEvent('hangman:round-ready', {
      detail: {
        word: round.word,
        normalizedWord: round.normalizedWord,
        hint: round.hint,
        topic: round.topic,
        letterCount: round.letterCount,
        isPlaceholder: round.isPlaceholder,
        gallowsPose: poseIndex,
        gallowsPoseName: activeGallowsPose.name,
        gallowsOrder: activeGallowsPose.order.slice()
      }
    }));

    if (parts.hero) {
      parts.hero.classList.add('hangman-active');
    }
    if (parts.floatingCard) {
      gsap.to(parts.floatingCard, { autoAlpha: 0, duration: 0.24, ease: 'power1.out' });
    }

    /* Troca instantânea entre a silhueta original e o rig aprovado.
       A pose 0 (sentado lendo) reproduz a mesma silhueta do mascote
       original, então a troca não gera flash nem duplicação visível. */
    gsap.set(parts.restCharacter, { autoAlpha: 0 });
    gsap.set(parts.rig, { autoAlpha: 1 });
    gsap.set(parts.book, { autoAlpha: 1 });

    activeTimeline = buildTimeline(parts, frames, layout);
    activeTimeline.timeScale(1);
    showExitControl();
    playTimelineWithMobileLandscape();
    return activeTimeline;
  }

  /* Sorteio duplo: primeiro sorteia o TOPICO (cada topico tem a mesma
     chance, nao importa quantas palavras ele tenha), depois sorteia a
     PALAVRA dentro do topico sorteado. O resultado ja vem com
     {palavra, charada, topico}, prontos pro createRound() usar como as
     duas dicas do round (topico + charada). */
  function loadWordBank() {
    if (wordBankPromise) return wordBankPromise;
    if (typeof fetch !== 'function') {
      wordBankCache = OFFLINE_FALLBACK_BANK.slice();
      wordBankPromise = Promise.resolve(wordBankCache);
      return wordBankPromise;
    }
    wordBankPromise = fetch(WORD_BANK_URL)
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        wordBankCache = Array.isArray(data) ? data : [];
        return wordBankCache;
      })
      .catch(function (err) {
        console.warn('A forca não conseguiu carregar ' + WORD_BANK_URL + ' (usando banco reserva offline):', err);
        wordBankCache = OFFLINE_FALLBACK_BANK.slice();
        return wordBankCache;
      });
    return wordBankPromise;
  }

  // Pre-carrega assim que o script roda, pra o banco ja estar pronto
  // quando o sorteio acontecer de verdade (evita esperar o fetch bem
  // na hora do clique que dispara o jogo).
  loadWordBank();

  function drawRandomWord(bank) {
    if (!bank || !bank.length) return null;
    var topics = [];
    bank.forEach(function (entry) {
      if (entry && entry.topico && topics.indexOf(entry.topico) === -1) {
        topics.push(entry.topico);
      }
    });
    if (!topics.length) return null;

    var sorteioTopico = topics[Math.floor(Math.random() * topics.length)];
    var palavrasDoTopico = bank.filter(function (entry) {
      return entry && entry.topico === sorteioTopico;
    });
    if (!palavrasDoTopico.length) return null;

    return palavrasDoTopico[Math.floor(Math.random() * palavrasDoTopico.length)];
  }

  function startRandomHangmanGame(options) {
    if (wordBankCache) {
      var sorteio = drawRandomWord(wordBankCache);
      return startHangmanGame(sorteio || options);
    }
    // Banco ainda carregando (raro, ja que o pre-carregamento comeca no
    // load do script): espera o fetch terminar e so entao inicia.
    loadWordBank().then(function (bank) {
      var sorteio = drawRandomWord(bank);
      startHangmanGame(sorteio || options);
    });
    return null;
  }

  function resetHangmanAnimation() {
    if (!window.gsap) return;
    ensurePageCamera();
    var parts = collectParts();
    var frames = getFrames();
    if (!hasCompleteRig(parts)) return;
    resetPose(parts, frames);
  }

  window.startHangmanGame = startHangmanGame;
  window.startRandomHangmanGame = startRandomHangmanGame;
  window.resetHangmanAnimation = resetHangmanAnimation;
  window.HangmanAnimation = {
    start: startHangmanGame,
    startRandom: startRandomHangmanGame,
    reset: resetHangmanAnimation,
    reactPiece: reactFloatingPiece,
    celebratePieces: function () { return animateFloatingMood('celebrate'); },
    fearAndHangPiece: fearAndHangPiece,
    hangPiece: movePieceToGallows,
    getRound: function () {
      if (!activeRound) return null;
      return {
        word: activeRound.word,
        normalizedWord: activeRound.normalizedWord,
        hint: activeRound.hint,
        topic: activeRound.topic,
        letterCount: activeRound.letterCount,
        isPlaceholder: activeRound.isPlaceholder,
        gallowsPose: GALLOWS_POSES.indexOf(activeGallowsPose),
        gallowsPoseName: activeGallowsPose.name,
        gallowsOrder: activeGallowsPose.order.slice()
      };
    },
    getTimeline: function () { return activeTimeline; },
    isActive: function () { return !!activeRound; }
  };

})();
