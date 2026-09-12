/* ========================================================================
   Easter egg da forca — coreografia do mascote.
   Checkpoint 7: slots dinâmicos da palavra.

   O rig provisório baseado em linhas foi substituído pelas 23 poses
   aprovadas em mascote-pose-data.js (paths interpoláveis por GSAP),
   seguindo exatamente a coreografia validada em
   animacao-continua-mascote.html: sentado -> livro abaixado -> cabeça
   levantada -> apoio -> meio levantado -> em pé -> giro -> caminhada
   (2 ciclos) -> chegada neutra -> horror lateral -> horror frontal ->
   resignação -> reergue -> abre os braços -> desmontagem final.

   Checkpoint 7 acrescenta apenas os slots `_` da palavra: um grupo
   #hangman-slots, ancorado a #hangman-world (não ao personagem), é
   populado dinamicamente com um traço por letra e revelado no mesmo
   instante em que a caminhada/câmera terminam, entrando naturalmente no
   enquadramento aberto pelo checkpoint 6. Não há ainda forca desenhada,
   letras, teclado ou qualquer lógica de acerto/erro — apenas os traços
   em branco existem e se comportam como um objeto do mundo.

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

  var WALK_FRAME_INDEXES = [8, 9, 10, 11, 12, 13, 14, 15];
  var WALK_CYCLES = 2;
  var STANDING_FRAME_INDEX = 5; /* "06 · Em pé neutro" */
  var WALK_COMPLETE_FRAME_INDEX = 16; /* "17 · Chegada neutra" */

  /* Deslocamento do personagem/câmera reaproveitado do checkpoint 6. */
  var TRAVEL_X = 24;
  var WORLD_X = -30;

  /* Slots da palavra (checkpoint 7). Placeholder visual: o comprimento real
     da palavra e a lógica de acerto/erro pertencem ao checkpoint de
     gameplay. Coordenadas em espaço de #hangman-world (mesma unidade do
     viewBox original), posicionadas à frente do personagem, no espaço que
     a câmera abre ao final da caminhada. */
  var DEFAULT_WORD_LENGTH = 6;
  var SLOT_START_X = 85;
  var SLOT_WIDTH = 7;
  var SLOT_GAP = 3;
  var SLOT_STEP = SLOT_WIDTH + SLOT_GAP;
  var SLOT_Y = 5;
  var SLOT_COLOR = '#0055d4';
  var SLOT_STROKE_WIDTH = 2.4;

  var activeTimeline = null;

  function collectParts() {
    var parts = {
      restCharacter: document.getElementById('rest-character'),
      rig: document.getElementById('character-rig'),
      world: document.getElementById('hangman-world'),
      travel: document.getElementById('character-travel'),
      slots: document.getElementById('hangman-slots'),
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
    if (!parts.restCharacter || !parts.rig || !parts.world || !parts.travel || !parts.slots) {
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
    for (var i = 0; i < length; i += 1) {
      var x1 = SLOT_START_X + i * SLOT_STEP;
      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('class', 'hangman-slot');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', SLOT_Y);
      line.setAttribute('x2', x1 + SLOT_WIDTH);
      line.setAttribute('y2', SLOT_Y);
      line.setAttribute('stroke', SLOT_COLOR);
      line.setAttribute('stroke-width', SLOT_STROKE_WIDTH);
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('fill', 'none');
      slotsGroup.appendChild(line);
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

  function tweenFrame(timeline, parts, frame, frameIndex, duration) {
    var position = timeline.duration();
    timeline.call(function () {
      applyFrame(parts, frame);
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
  }

  function buildTimeline(parts, frames) {
    var gsap = window.gsap;
    var timeline = gsap.timeline({ paused: true });

    /* Pose inicial já aplicada de forma síncrona antes de o rig aparecer
       (ver startHangmanGame). Mantemos a pose 0 visível por sua duração
       aprovada antes de iniciar a transição para a pose seguinte. */
    timeline.to({}, { duration: frames[0].duration });

    for (var i = 1; i < WALK_FRAME_INDEXES[0]; i += 1) {
      tweenFrame(timeline, parts, frames[i], i, frames[i].duration);
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
    timeline.to(parts.world, {
      x: WORLD_X,
      duration: totalWalkDuration,
      ease: 'power1.inOut'
    }, walkStart + 0.08);

    for (var cycle = 0; cycle < WALK_CYCLES; cycle += 1) {
      WALK_FRAME_INDEXES.forEach(function (idx) {
        tweenFrame(timeline, parts, frames[idx], idx, frames[idx].duration);
      });
    }

    timeline.addLabel('walk-complete');
    timeline.call(function () {
      document.dispatchEvent(new CustomEvent('hangman:walk-complete'));
      document.dispatchEvent(new CustomEvent('hangman:camera-complete'));
    }, null, 'walk-complete');

    /* Os slots da palavra aparecem assim que a câmera chega ao
       enquadramento final, logo antes da reação de horror. */
    timeline.to(parts.slots, {
      autoAlpha: 1,
      duration: 0.45,
      ease: 'power1.out'
    }, 'walk-complete');

    for (var j = WALK_COMPLETE_FRAME_INDEX; j < frames.length; j += 1) {
      tweenFrame(timeline, parts, frames[j], j, frames[j].duration);
    }

    timeline.call(function () {
      document.dispatchEvent(new CustomEvent('hangman:sequence-complete'));
    });

    return timeline;
  }

  function resetPose(parts, frames) {
    var gsap = window.gsap;

    if (activeTimeline) {
      activeTimeline.kill();
      activeTimeline = null;
    }

    if (parts.hero) {
      parts.hero.classList.remove('hangman-active');
    }

    gsap.set([parts.world, parts.travel], { x: 0 });

    if (frames && frames[0]) {
      applyFrame(parts, frames[0]);
    }

    gsap.set(parts.rig, { autoAlpha: 0 });
    gsap.set(parts.restCharacter, { autoAlpha: 1 });

    gsap.set(parts.slots, { autoAlpha: 0 });
    clearSlots(parts.slots);
  }

  function startHangmanGame() {
    var gsap = window.gsap;
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

    /* Troca instantânea entre a silhueta original e o rig aprovado.
       A pose 0 (sentado lendo) reproduz a mesma silhueta do mascote
       original, então a troca não gera flash nem duplicação visível. */
    gsap.set(parts.restCharacter, { autoAlpha: 0 });
    gsap.set(parts.rig, { autoAlpha: 1 });

    activeTimeline = buildTimeline(parts, frames);
    activeTimeline.play(0);
    return activeTimeline;
  }

  function resetHangmanAnimation() {
    if (!window.gsap) return;
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
    getTimeline: function () { return activeTimeline; }
  };
})();
