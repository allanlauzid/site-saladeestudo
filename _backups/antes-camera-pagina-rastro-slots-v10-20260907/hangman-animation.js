/* ========================================================================
   Easter egg da forca — coreografia do mascote.
   Integração corrigida da coreografia aprovada, livro, slots e forca.

   O rig provisório baseado em linhas foi substituído pelas 23 poses
   aprovadas em mascote-pose-data.js (paths interpoláveis por GSAP),
   seguindo exatamente a coreografia validada em
   animacao-continua-mascote.html: sentado -> livro abaixado -> cabeça
   levantada -> apoio -> meio levantado -> em pé -> giro -> caminhada
   (2 ciclos) -> chegada neutra -> horror lateral -> horror frontal ->
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

  var WALK_FRAME_INDEXES = [8, 9, 10, 11, 12, 13, 14, 15];
  var WALK_CYCLES = 2;
  var STANDING_FRAME_INDEX = 5; /* "06 · Em pé neutro" */
  var WALK_COMPLETE_FRAME_INDEX = 16; /* "17 · Chegada neutra" */

  /* O personagem avança no mundo enquanto a câmera percorre a mesma
     distância. Assim ele caminha de verdade e o cenário desliza para a
     esquerda, revelando a área que estava fora da tela à direita. */
  var TRAVEL_X = 55;
  var WORLD_X = -55;

  var BOOK_INITIAL_PATH = 'M9 20 L3 12';
  var BOOK_LOWERED_PATH = 'M17 29 L7 29';

  /* Slots da palavra. Placeholder visual: o comprimento real
     da palavra e a lógica de acerto/erro pertencem ao checkpoint de
     gameplay. Coordenadas em espaço de #hangman-world (mesma unidade do
     viewBox original), posicionadas à frente do personagem, no espaço que
     a câmera abre ao final da caminhada. */
  var DEFAULT_WORD_LENGTH = 6;
  /* Elementos do cenário são posicionados já compensando o pan de -55.
     Ao fim da caminhada, os slots ocupam x=48..76 na tela e deixam a
     forca inteira enquadrada à direita. */
  var SLOT_START_X = 103;
  var SLOT_AREA_WIDTH = 28;
  var SLOT_GAP = 2;
  var SLOT_Y = 90;
  var SLOT_COLOR = '#0055d4';
  var SLOT_STROKE_WIDTH = 2.4;

  var activeTimeline = null;

  function collectParts() {
    var parts = {
      restCharacter: document.getElementById('rest-character'),
      rig: document.getElementById('character-rig'),
      world: document.getElementById('hangman-world'),
      travel: document.getElementById('character-travel'),
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
      line.style.strokeDasharray = '1';
      line.style.strokeDashoffset = '1';
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

  function buildTimeline(parts, frames) {
    var gsap = window.gsap;
    var timeline = gsap.timeline({ paused: true });

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
    timeline.to(parts.world, {
      x: WORLD_X,
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

    /* Cada espaço é desenhado durante uma fração da caminhada, sob a
       trajetória do mascote, em vez de todos surgirem no final. */
    var slotNodes = Array.prototype.slice.call(parts.slots.children);
    var slotStepDuration = totalWalkDuration / Math.max(1, slotNodes.length);
    timeline.set(parts.slots, { autoAlpha: 1 }, walkStart);
    slotNodes.forEach(function (slot, index) {
      timeline.to(slot, {
        strokeDashoffset: 0,
        duration: Math.min(0.3, slotStepDuration * 0.72),
        ease: 'power1.out'
      }, walkStart + index * slotStepDuration + slotStepDuration * 0.18);
    });

    timeline.addLabel('walk-complete');
    timeline.call(function () {
      document.dispatchEvent(new CustomEvent('hangman:walk-complete'));
      document.dispatchEvent(new CustomEvent('hangman:camera-complete'));
    }, null, 'walk-complete');

    timeline.addLabel('gallows-draw');
    timeline.set(parts.gallows, { autoAlpha: 1 }, 'gallows-draw');
    parts.gallowsStrokes.forEach(function (stroke) {
      timeline.to(stroke, {
        strokeDashoffset: 0,
        duration: 0.42,
        ease: 'power1.inOut'
      });
    });

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
    if (parts.floatingCard) {
      gsap.set(parts.floatingCard, { autoAlpha: 1 });
    }

    gsap.set([parts.world, parts.travel, parts.book], { x: 0 });

    if (frames && frames[0]) {
      applyFrame(parts, frames[0]);
    }

    gsap.set(parts.rig, { autoAlpha: 0 });
    gsap.set(parts.restCharacter, { autoAlpha: 1 });
    gsap.set(parts.book, { autoAlpha: 0 });
    gsap.set(parts.bookShape, { attr: { d: BOOK_INITIAL_PATH } });

    gsap.set(parts.slots, { autoAlpha: 0 });
    clearSlots(parts.slots);
    gsap.set(parts.gallows, { autoAlpha: 0 });
    gsap.set(parts.gallowsStrokes, {
      strokeDasharray: 1,
      strokeDashoffset: 1
    });
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
