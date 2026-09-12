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

  /* Slots da palavra. Placeholder visual: o comprimento real
     da palavra e a lógica de acerto/erro pertencem ao checkpoint de
     gameplay. Coordenadas em espaço de #hangman-world (mesma unidade do
     viewBox original), posicionadas à frente do personagem, no espaço que
     a câmera abre ao final da caminhada. */
  var DEFAULT_WORD_LENGTH = 6;
  /* O mascote deixa estes campos para trás enquanto caminha. Depois da
     compensação de câmera, eles terminam à esquerda dos seus pés. */
  var SLOT_START_X = 65;
  var SLOT_AREA_WIDTH = 160;
  var SLOT_GAP = 8;
  var SLOT_Y = 90;
  var SLOT_COLOR = '#0055d4';
  var SLOT_STROKE_WIDTH = 1.4;
  /* Centro vertical do laço: ele ocupa y=-25..-5. */
  var PIECE_ROW_CENTER_Y = -15;
  /* Um clique, toque ou tecla durante a sequência acelera a coreografia sem
     saltar poses. A velocidade normal volta a valer no próximo início. */
  var FAST_FORWARD_SCALE = 4;
  var MOBILE_LANDSCAPE_INTRO_MS = 2000;
  var FLOAT_DISTANCES = [2.1, 1.6, 2.4, 2.2, 2.7, 2.5];
  var FLOAT_DURATIONS = [3.6, 4.1, 4.5, 3.9, 4.7, 4.2];
  var FLOAT_ROTATIONS = [0, 0.8, 2, -2, 2.5, -2.5];

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
  var floatingAnimations = [];
  var floatingInteractionsAttached = false;

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
      y: state.baseY + state.floatY + state.waveY + state.reactY,
      rotation: state.rotation,
      transformOrigin: '50% 50%'
    });
  }

  function stopFloatingPieces() {
    var gsap = window.gsap;

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
    if (!gsap || !state) return false;

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

  function handleFloatingPieceEvent(event) {
    var detail = event.detail || {};
    var identifier = detail.pieceId !== undefined ? detail.pieceId : detail.index;
    reactFloatingPiece(identifier);
  }

  function attachFloatingInteractions() {
    if (floatingInteractionsAttached) return;
    window.addEventListener('pointerdown', handleFloatingSlotInput, true);
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
        pieceId: DISASSEMBLY_ROW_ORDER[index],
        piece: piece,
        baseY: Number(gsap.getProperty(piece, 'y')) || 0,
        floatY: 0,
        waveY: 0,
        reactY: 0,
        rotation: 0,
        reactionTimeline: null
      };
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

  function buildSlots(slotsGroup, length) {
    clearSlots(slotsGroup);
    var safeLength = Math.max(1, length);
    var slotWidth = (SLOT_AREA_WIDTH - SLOT_GAP * (safeLength - 1)) / safeLength;
    for (var i = 0; i < length; i += 1) {
      var x1 = SLOT_START_X + i * (slotWidth + SLOT_GAP);
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
      line.setAttribute('data-hangman-piece', DISASSEMBLY_ROW_ORDER[i] || '');
      line.setAttribute('data-slot-index', i);
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
      hitLine.setAttribute('data-hangman-piece', DISASSEMBLY_ROW_ORDER[i] || '');
      hitLine.setAttribute('data-slot-index', i);
      hitLine.style.cursor = 'pointer';
      slotsGroup.appendChild(hitLine);
    }
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

  function getHeroShiftPx(parts) {
    var rect = parts.svg.getBoundingClientRect();
    var viewBox = parts.svg.viewBox && parts.svg.viewBox.baseVal;
    if (!viewBox || !viewBox.width || !rect.width) return 0;
    return CAMERA_X * (rect.width / viewBox.width);
  }

  function buildTimeline(parts, frames) {
    var gsap = window.gsap;
    var timeline = gsap.timeline({ paused: true });
    var heroShiftPx = getHeroShiftPx(parts);

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
    var totalWalkDuration = cycleDuration * WALK_CYCLES;

    timeline.addLabel('walk-start', walkStart);
    timeline.to(parts.travel, {
      x: TRAVEL_X,
      duration: totalWalkDuration,
      ease: 'none'
    }, walkStart);
    timeline.to(parts.pageCamera, {
      x: -heroShiftPx,
      duration: totalWalkDuration,
      ease: 'none'
    }, walkStart);

    /* Os frames da marcha usam o mesmo cursor temporal do deslocamento.
       Antes eles eram inseridos após o tween da câmera, causando o deslize
       estático denunciado por Allan. */
    var walkCursor = walkStart;
    for (var cycle = 0; cycle < WALK_CYCLES; cycle += 1) {
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
      var passProgress = Math.max(0.12, Math.min(0.98, (slotCenter - 47) / TRAVEL_X));
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
    var rowTargets = DISASSEMBLY_ROW_ORDER.map(function (pieceId) {
      return parts.pieceEls[pieceId];
    });
    var rowSlots = Array.prototype.slice.call(parts.slots.querySelectorAll('.hangman-slot'));
    var settleOvershoot = prefersReducedMotion() ? 0.5 : 1.5;
    timeline.addLabel('pieces-row');
    timeline.to(rowTargets, {
      x: function (index, piece) {
        var box = piece.getBBox();
        var slot = rowSlots[index];
        var slotCenter = (Number(slot.getAttribute('x1')) + Number(slot.getAttribute('x2'))) / 2;
        return slotCenter - TRAVEL_X - (box.x + box.width / 2);
      },
      y: function (index, piece) {
        var box = piece.getBBox();
        return PIECE_ROW_CENTER_Y - (box.y + box.height / 2) - settleOvershoot;
      },
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
  }

  function startHangmanGame() {
    var gsap = window.gsap;
    ensurePageCamera();
    var parts = collectParts();
    var frames = getFrames();

    if (!gsap) {
      console.warn('A animação da forca aguarda o carregamento do GSAP.');
      return null;
    }
    if (!frames) {
      console.warn('A animação da forca não encontrou os dados das 23 poses aprovadas (mascote-pose-data.js).');
      return null;
    }
    if (!hasCompleteRig(parts)) {
      console.warn('A animação da forca não encontrou o rig completo do mascote no index.html.');
      return null;
    }

    resetPose(parts, frames);
    buildSlots(parts.slots, DEFAULT_WORD_LENGTH);

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

    activeTimeline = buildTimeline(parts, frames);
    activeTimeline.timeScale(1);
    showExitControl();
    playTimelineWithMobileLandscape();
    return activeTimeline;
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
  window.resetHangmanAnimation = resetHangmanAnimation;
  window.HangmanAnimation = {
    start: startHangmanGame,
    reset: resetHangmanAnimation,
    reactPiece: reactFloatingPiece,
    getTimeline: function () { return activeTimeline; }
  };

})();
