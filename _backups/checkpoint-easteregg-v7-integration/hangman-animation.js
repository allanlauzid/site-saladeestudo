/* ========================================================================
   Easter egg da forca — coreografia do mascote.
   Checkpoints 4 a 6: livro -> cabeça -> apoio -> levantar -> caminhar,
   preservando a silhueta preenchida e acompanhando o mundo com uma câmera.

   Não há listener de ativação neste arquivo. A sequência é iniciada apenas
   por uma chamada externa a window.startHangmanGame().
   ======================================================================== */
(function () {
  'use strict';

  var activeTimeline = null;
  var skinFrame = null;

  var PART_IDS = [
    'character-rig', 'head', 'torso',
    'arm-left', 'forearm-left', 'arm-right', 'forearm-right',
    'leg-left', 'shin-left', 'leg-right', 'shin-right', 'book'
  ];

  var INITIAL_LINES = {
    'torso':        { x1: 31,   y1: 18,   x2: 42,   y2: 39 },
    'arm-left':     { x1: 31,   y1: 18,   x2: 18.5, y2: 24.5 },
    'forearm-left': { x1: 18.5, y1: 24.5, x2: 9,    y2: 20 },
    'arm-right':    { x1: 31,   y1: 18,   x2: 18.5, y2: 24.5 },
    'forearm-right':{ x1: 18.5, y1: 24.5, x2: 9,    y2: 20 },
    'leg-left':     { x1: 42,   y1: 39,   x2: 19,   y2: 39 },
    'shin-left':    { x1: 19,   y1: 39,   x2: 19,   y2: 58 },
    'leg-right':    { x1: 42,   y1: 39,   x2: 19,   y2: 39 },
    'shin-right':   { x1: 19,   y1: 39,   x2: 19,   y2: 58 },
    'book':         { x1: 9,    y1: 20,   x2: 3,    y2: 12 }
  };

  var WALK_POSES = {
    strideLeft: {
      head:          { cx: 42, cy: 7.7 },
      torso:         { x1: 42, y1: 13.7, x2: 42, y2: 35.7 },
      'arm-left':    { x1: 42, y1: 15.7, x2: 48.5, y2: 25.5 },
      'forearm-left':{ x1: 48.5, y1: 25.5, x2: 50.5, y2: 37 },
      'arm-right':   { x1: 42, y1: 15.7, x2: 35.5, y2: 25.5 },
      'forearm-right':{ x1: 35.5, y1: 25.5, x2: 33.5, y2: 37 },
      'leg-left':    { x1: 42, y1: 35.7, x2: 36.5, y2: 47.5 },
      'shin-left':   { x1: 36.5, y1: 47.5, x2: 31.5, y2: 59 },
      'leg-right':   { x1: 42, y1: 35.7, x2: 47.5, y2: 48 },
      'shin-right':  { x1: 47.5, y1: 48, x2: 50, y2: 59 }
    },
    passLeft: {
      head:          { cx: 42, cy: 6.6 },
      torso:         { x1: 42, y1: 12.6, x2: 42, y2: 34.6 },
      'arm-left':    { x1: 42, y1: 14.6, x2: 44.5, y2: 26 },
      'forearm-left':{ x1: 44.5, y1: 26, x2: 43.5, y2: 38 },
      'arm-right':   { x1: 42, y1: 14.6, x2: 39.5, y2: 26 },
      'forearm-right':{ x1: 39.5, y1: 26, x2: 40.5, y2: 38 },
      'leg-left':    { x1: 42, y1: 34.6, x2: 44, y2: 45.5 },
      'shin-left':   { x1: 44, y1: 45.5, x2: 39, y2: 58.8 },
      'leg-right':   { x1: 42, y1: 34.6, x2: 43.5, y2: 47.5 },
      'shin-right':  { x1: 43.5, y1: 47.5, x2: 47.5, y2: 59 }
    },
    strideRight: {
      head:          { cx: 42, cy: 7.7 },
      torso:         { x1: 42, y1: 13.7, x2: 42, y2: 35.7 },
      'arm-left':    { x1: 42, y1: 15.7, x2: 35.5, y2: 25.5 },
      'forearm-left':{ x1: 35.5, y1: 25.5, x2: 33.5, y2: 37 },
      'arm-right':   { x1: 42, y1: 15.7, x2: 48.5, y2: 25.5 },
      'forearm-right':{ x1: 48.5, y1: 25.5, x2: 50.5, y2: 37 },
      'leg-left':    { x1: 42, y1: 35.7, x2: 47.5, y2: 48 },
      'shin-left':   { x1: 47.5, y1: 48, x2: 50, y2: 59 },
      'leg-right':   { x1: 42, y1: 35.7, x2: 36.5, y2: 47.5 },
      'shin-right':  { x1: 36.5, y1: 47.5, x2: 31.5, y2: 59 }
    },
    passRight: {
      head:          { cx: 42, cy: 6.6 },
      torso:         { x1: 42, y1: 12.6, x2: 42, y2: 34.6 },
      'arm-left':    { x1: 42, y1: 14.6, x2: 39.5, y2: 26 },
      'forearm-left':{ x1: 39.5, y1: 26, x2: 40.5, y2: 38 },
      'arm-right':   { x1: 42, y1: 14.6, x2: 44.5, y2: 26 },
      'forearm-right':{ x1: 44.5, y1: 26, x2: 43.5, y2: 38 },
      'leg-left':    { x1: 42, y1: 34.6, x2: 43.5, y2: 47.5 },
      'shin-left':   { x1: 43.5, y1: 47.5, x2: 47.5, y2: 59 },
      'leg-right':   { x1: 42, y1: 34.6, x2: 44, y2: 45.5 },
      'shin-right':  { x1: 44, y1: 45.5, x2: 39, y2: 58.8 }
    },
    neutral: {
      head:          { cx: 42, cy: 7 },
      torso:         { x1: 42, y1: 13, x2: 42, y2: 35 },
      'arm-left':    { x1: 42, y1: 15, x2: 34.5, y2: 27 },
      'forearm-left':{ x1: 34.5, y1: 27, x2: 33, y2: 40 },
      'arm-right':   { x1: 42, y1: 15, x2: 49.5, y2: 27 },
      'forearm-right':{ x1: 49.5, y1: 27, x2: 51, y2: 40 },
      'leg-left':    { x1: 42, y1: 35, x2: 36.5, y2: 48 },
      'shin-left':   { x1: 36.5, y1: 48, x2: 35, y2: 60 },
      'leg-right':   { x1: 42, y1: 35, x2: 47.5, y2: 48 },
      'shin-right':  { x1: 47.5, y1: 48, x2: 49, y2: 60 }
    }
  };

  function collectParts() {
    var parts = {};
    PART_IDS.forEach(function (id) {
      parts[id] = document.getElementById(id);
    });
    parts.restCharacter = document.getElementById('rest-character');
    parts.torsoSkin = document.getElementById('torso-shape');
    parts.world = document.getElementById('hangman-world');
    parts.travel = document.getElementById('character-travel');
    return parts;
  }

  function hasCompleteRig(parts) {
    return !!parts.restCharacter && !!parts.torsoSkin && !!parts.world && !!parts.travel && PART_IDS.every(function (id) {
      return !!parts[id];
    });
  }

  function lineOf(parts, id) {
    return parts[id].querySelector('line');
  }

  function nodeOf(parts, id) {
    return id === 'head' ? parts.head.querySelector('circle') : lineOf(parts, id);
  }

  function readNumber(node, attribute) {
    return parseFloat(node.getAttribute(attribute));
  }

  function syncTorsoSkin(parts) {
    var torso = lineOf(parts, 'torso');
    var x1 = readNumber(torso, 'x1');
    var y1 = readNumber(torso, 'y1');
    var x2 = readNumber(torso, 'x2');
    var y2 = readNumber(torso, 'y2');
    var dx = x2 - x1;
    var dy = y2 - y1;
    var length = Math.sqrt(dx * dx + dy * dy) || 1;
    var tx = dx / length;
    var ty = dy / length;
    var nx = -ty;
    var ny = tx;
    var shoulderRadius = 4.3;
    var hipRadius = 5.1;
    var shoulderLeft = [x1 + nx * shoulderRadius, y1 + ny * shoulderRadius];
    var shoulderRight = [x1 - nx * shoulderRadius, y1 - ny * shoulderRadius];
    var hipLeft = [x2 + nx * hipRadius, y2 + ny * hipRadius];
    var hipRight = [x2 - nx * hipRadius, y2 - ny * hipRadius];
    var shoulderCap = [x1 - tx * shoulderRadius, y1 - ty * shoulderRadius];
    var hipCap = [x2 + tx * hipRadius, y2 + ty * hipRadius];

    parts.torsoSkin.setAttribute('d', [
      'M', shoulderLeft[0], shoulderLeft[1],
      'L', hipLeft[0], hipLeft[1],
      'Q', hipCap[0], hipCap[1], hipRight[0], hipRight[1],
      'L', shoulderRight[0], shoulderRight[1],
      'Q', shoulderCap[0], shoulderCap[1], shoulderLeft[0], shoulderLeft[1],
      'Z'
    ].join(' '));
  }

  function stopSkinSync() {
    if (skinFrame !== null) {
      cancelAnimationFrame(skinFrame);
      skinFrame = null;
    }
  }

  function startSkinSync(parts) {
    stopSkinSync();

    function updateSkin() {
      syncTorsoSkin(parts);
      if (activeTimeline && activeTimeline.isActive()) {
        skinFrame = requestAnimationFrame(updateSkin);
      } else {
        skinFrame = null;
      }
    }

    skinFrame = requestAnimationFrame(updateSkin);
  }

  function addPose(timeline, parts, pose, position, duration, ease) {
    Object.keys(pose).forEach(function (id) {
      timeline.to(nodeOf(parts, id), {
        attr: pose[id],
        duration: duration,
        ease: ease || 'power1.inOut'
      }, position);
    });
  }

  function appendWalkCycle(timeline, parts) {
    var cursor = timeline.duration() + 0.3;
    var walkStart = cursor;
    var steps = [
      { pose: WALK_POSES.strideLeft, duration: 0.32 },
      { pose: WALK_POSES.passLeft, duration: 0.26 },
      { pose: WALK_POSES.strideRight, duration: 0.32 },
      { pose: WALK_POSES.passRight, duration: 0.26 }
    ];

    timeline.addLabel('walk-start', cursor);

    /* O personagem avança 24 unidades no mundo. A câmera percorre 30,
       ultrapassando-o levemente para revelar o espaço à frente. */
    timeline.to(parts.travel, {
      x: 24,
      duration: 2.6,
      ease: 'none'
    }, walkStart);
    timeline.to(parts.book, {
      x: -24,
      duration: 2.6,
      ease: 'none'
    }, walkStart);
    timeline.to(parts.world, {
      x: -30,
      duration: 2.6,
      ease: 'power1.inOut'
    }, walkStart + 0.08);

    for (var cycle = 0; cycle < 2; cycle += 1) {
      steps.forEach(function (step) {
        addPose(timeline, parts, step.pose, cursor, step.duration, 'power1.inOut');
        cursor += step.duration;
      });
    }

    addPose(timeline, parts, WALK_POSES.neutral, cursor, 0.28, 'power2.out');
    cursor += 0.28;
    timeline.addLabel('walk-complete', cursor).call(function () {
      document.dispatchEvent(new CustomEvent('hangman:walk-complete'));
      document.dispatchEvent(new CustomEvent('hangman:camera-complete'));
    }, null, cursor);
  }

  function resetPose(parts) {
    var gsap = window.gsap;

    if (activeTimeline) {
      activeTimeline.kill();
      activeTimeline = null;
    }
    stopSkinSync();

    gsap.set(PART_IDS.map(function (id) { return parts[id]; }), {
      clearProps: 'transform,transformOrigin,opacity,visibility'
    });

    Object.keys(INITIAL_LINES).forEach(function (id) {
      gsap.set(lineOf(parts, id), { attr: INITIAL_LINES[id] });
    });
    gsap.set(parts.head.querySelector('circle'), { attr: { cx: 27, cy: 6 } });
    gsap.set([parts.world, parts.travel], { x: 0 });
    syncTorsoSkin(parts);
    gsap.set(parts.restCharacter, { autoAlpha: 1 });
    gsap.set(parts['character-rig'], { autoAlpha: 0 });
  }

  function createStandUpTimeline(parts) {
    var gsap = window.gsap;
    var rig = parts['character-rig'];
    var head = parts.head.querySelector('circle');
    var torso = lineOf(parts, 'torso');
    var book = lineOf(parts, 'book');
    var leftArm = lineOf(parts, 'arm-left');
    var leftForearm = lineOf(parts, 'forearm-left');
    var rightArm = lineOf(parts, 'arm-right');
    var rightForearm = lineOf(parts, 'forearm-right');
    var leftLeg = lineOf(parts, 'leg-left');
    var leftShin = lineOf(parts, 'shin-left');
    var rightLeg = lineOf(parts, 'leg-right');
    var rightShin = lineOf(parts, 'shin-right');

    var timeline = gsap.timeline({
      paused: true,
      defaults: { overwrite: 'auto' }
    });

    timeline
      .to(parts.restCharacter, { autoAlpha: 0, duration: 0.12, ease: 'none' }, 0)
      .to(rig, { autoAlpha: 1, duration: 0.12, ease: 'none' }, 0)

      .addLabel('lower-book')
      .to(book, {
        attr: { x1: 17, y1: 29, x2: 7, y2: 29 },
        duration: 0.62,
        ease: 'power2.inOut'
      }, 'lower-book')
      .to(leftForearm, {
        attr: { x1: 18.5, y1: 24.5, x2: 17, y2: 29 },
        duration: 0.62,
        ease: 'power2.inOut'
      }, 'lower-book')

      .addLabel('look-up', 'lower-book+=0.3')
      .to(head, {
        attr: { cx: 28, cy: 4.7 },
        duration: 0.58,
        ease: 'power3.out'
      }, 'look-up')
      .to(torso, {
        attr: { x1: 30, y1: 17.2, x2: 42, y2: 39 },
        duration: 0.58,
        ease: 'power2.out'
      }, 'look-up+=0.06')

      .addLabel('find-support', 'look-up+=0.5')
      .to(rightArm, {
        attr: { x1: 29.5, y1: 18, x2: 25, y2: 27 },
        duration: 0.62,
        ease: 'power2.inOut'
      }, 'find-support')
      .to(rightForearm, {
        attr: { x1: 25, y1: 27, x2: 22, y2: 30 },
        duration: 0.62,
        ease: 'power2.inOut'
      }, 'find-support')
      .to(torso, {
        attr: { x1: 29.5, y1: 18, x2: 42, y2: 39 },
        duration: 0.52,
        ease: 'power2.inOut'
      }, 'find-support+=0.08')
      .to(head, {
        attr: { cx: 27.4, cy: 5.2 },
        duration: 0.52,
        ease: 'power2.inOut'
      }, 'find-support+=0.08')

      .addLabel('push-up', 'find-support+=0.58')
      .to(torso, {
        attr: { x1: 42, y1: 13, x2: 42, y2: 35 },
        duration: 1.08,
        ease: 'power3.inOut'
      }, 'push-up')
      .to(head, {
        attr: { cx: 42, cy: 7 },
        duration: 1.02,
        ease: 'power3.inOut'
      }, 'push-up+=0.04')
      .to(leftLeg, {
        attr: { x1: 42, y1: 35, x2: 36.5, y2: 48 },
        duration: 1.04,
        ease: 'power3.inOut'
      }, 'push-up')
      .to(leftShin, {
        attr: { x1: 36.5, y1: 48, x2: 35, y2: 60 },
        duration: 1.04,
        ease: 'power3.inOut'
      }, 'push-up')
      .to(rightLeg, {
        attr: { x1: 42, y1: 35, x2: 47.5, y2: 48 },
        duration: 1.04,
        ease: 'power3.inOut'
      }, 'push-up+=0.05')
      .to(rightShin, {
        attr: { x1: 47.5, y1: 48, x2: 49, y2: 60 },
        duration: 1.04,
        ease: 'power3.inOut'
      }, 'push-up+=0.05')
      .to(leftArm, {
        attr: { x1: 42, y1: 15, x2: 34.5, y2: 27 },
        duration: 0.84,
        ease: 'power2.inOut'
      }, 'push-up+=0.24')
      .to(leftForearm, {
        attr: { x1: 34.5, y1: 27, x2: 33, y2: 40 },
        duration: 0.84,
        ease: 'power2.inOut'
      }, 'push-up+=0.24')
      .to(rightArm, {
        attr: { x1: 42, y1: 15, x2: 49.5, y2: 27 },
        duration: 0.84,
        ease: 'power2.inOut'
      }, 'push-up+=0.28')
      .to(rightForearm, {
        attr: { x1: 49.5, y1: 27, x2: 51, y2: 40 },
        duration: 0.84,
        ease: 'power2.inOut'
      }, 'push-up+=0.28')

      .addLabel('standing')
      .call(function () {
        document.dispatchEvent(new CustomEvent('hangman:standing'));
      });

    appendWalkCycle(timeline, parts);

    return timeline;
  }

  function startHangmanGame() {
    var parts = collectParts();

    if (!window.gsap) {
      console.warn('A animação da forca aguarda o carregamento do GSAP.');
      return null;
    }
    if (!hasCompleteRig(parts)) {
      console.warn('A animação da forca não encontrou o rig completo do mascote.');
      return null;
    }

    resetPose(parts);
    activeTimeline = createStandUpTimeline(parts);
    activeTimeline.play(0);
    startSkinSync(parts);
    return activeTimeline;
  }

  function resetHangmanAnimation() {
    if (!window.gsap) return;
    var parts = collectParts();
    if (!hasCompleteRig(parts)) return;
    resetPose(parts);
  }

  window.startHangmanGame = startHangmanGame;
  window.resetHangmanAnimation = resetHangmanAnimation;
  window.HangmanAnimation = {
    start: startHangmanGame,
    reset: resetHangmanAnimation,
    getTimeline: function () { return activeTimeline; }
  };
})();
