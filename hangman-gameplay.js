/* ========================================================================
   SALA DE ESTUDO - GAMEPLAY VISUAL DA FORCA v1

   Dica, teclado compacto/ampliado, voo das letras, marcações desenhadas,
   purpurina e respostas do mascote. O início da rodada continua externo:
   window.startHangmanGame({ word: 'MATEMÁTICA', hint: 'Matéria escolar' }).
   ======================================================================== */
(function () {
  'use strict';

  var ALPHABET_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  var CORRECT_COLOR = '#12b76a';
  var WRONG_COLOR = '#ef4444';
  var BLUE = '#0055d4';
  var GOLD = '#ffd400';
  var round = null;
  var ui = null;
  var usedLetters = new Map();
  var errorCount = 0;
  var guessInProgress = false;
  var instructionDismissed = false;
  var activeTweens = [];
  var roundEndTimer = null;
  var roundEndListenersAttached = false;
  var roundEndOverlay = null;

  function reducedMotion() {
    return Boolean(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function track(animation) {
    if (animation) activeTweens.push(animation);
    return animation;
  }

  function clearTweens() {
    activeTweens.forEach(function (animation) {
      if (animation && typeof animation.kill === 'function') animation.kill();
    });
    activeTweens = [];
  }

  function cancelRoundEnd() {
    if (roundEndTimer !== null) {
      window.clearTimeout(roundEndTimer);
      roundEndTimer = null;
    }
    if (roundEndListenersAttached) {
      window.removeEventListener('pointerdown', finishRoundAndReset, true);
      window.removeEventListener('click', finishRoundAndReset, true);
      window.removeEventListener('keydown', finishRoundAndReset, true);
      roundEndListenersAttached = false;
    }
    if (roundEndOverlay && roundEndOverlay.parentNode) {
      roundEndOverlay.parentNode.removeChild(roundEndOverlay);
    }
    roundEndOverlay = null;
  }

  function finishRoundAndReset(event) {
    if (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    if (roundEndTimer !== null) {
      window.clearTimeout(roundEndTimer);
      roundEndTimer = null;
    }
    if (roundEndListenersAttached) {
      window.removeEventListener('pointerdown', finishRoundAndReset, true);
      window.removeEventListener('click', finishRoundAndReset, true);
      window.removeEventListener('keydown', finishRoundAndReset, true);
      roundEndListenersAttached = false;
    }
    if (!roundEndOverlay) roundEndOverlay = document.createElement('div');
    roundEndOverlay.className = 'hangman-round-eraser';
    roundEndOverlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(roundEndOverlay);
    var erase = function () {
      if (window.gsap) {
        return window.gsap.fromTo(roundEndOverlay,
          { x: '-38vw', rotation: -1.5 },
          { x: '138vw', rotation: 1.5, duration: reducedMotion() ? 0.25 : 1.1, ease: 'power1.inOut', onComplete: resetAfterRound });
      }
      resetAfterRound();
      return null;
    };
    track(erase());
  }

  function resetAfterRound() {
    cancelRoundEnd();
    if (window.resetHangmanAnimation) window.resetHangmanAnimation();
  }

  function scheduleRoundEnd() {
    cancelRoundEnd();
    window.addEventListener('pointerdown', finishRoundAndReset, true);
    window.addEventListener('click', finishRoundAndReset, true);
    window.addEventListener('keydown', finishRoundAndReset, true);
    roundEndListenersAttached = true;
    roundEndTimer = window.setTimeout(finishRoundAndReset, 15000);
  }

  function createMarkSvg() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'hangman-key-mark');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');

    var check = document.createElementNS(svg.namespaceURI, 'path');
    check.setAttribute('class', 'hangman-mark-check');
    check.setAttribute('pathLength', '1');
    check.setAttribute('d', 'M4 12.5 L9.2 17.5 L20 5.5');
    svg.appendChild(check);

    ['M5 5 L19 19', 'M19 5 L5 19'].forEach(function (pathData) {
      var cross = document.createElementNS(svg.namespaceURI, 'path');
      cross.setAttribute('class', 'hangman-mark-cross');
      cross.setAttribute('pathLength', '1');
      cross.setAttribute('d', pathData);
      svg.appendChild(cross);
    });
    return svg;
  }

  function createLetterKey(letter, interactive) {
    var key = document.createElement(interactive ? 'button' : 'span');
    key.className = 'hangman-game-key';
    key.setAttribute('data-game-letter', letter);
    if (interactive) {
      key.type = 'button';
      key.setAttribute('aria-label', 'Letra ' + letter);
      key.addEventListener('click', function (event) {
        event.preventDefault();
        chooseLetter(letter, key);
      });
    }
    var label = document.createElement('span');
    label.className = 'hangman-game-key-label';
    label.textContent = letter;
    key.appendChild(label);
    key.appendChild(createMarkSvg());
    return key;
  }

  function createKeyboard(interactive) {
    var keyboard = document.createElement('div');
    keyboard.className = interactive ? 'hangman-keyboard hangman-keyboard-large' :
      'hangman-keyboard hangman-keyboard-small';
    ALPHABET_ROWS.forEach(function (letters) {
      var rowElement = document.createElement('div');
      rowElement.className = 'hangman-keyboard-row';
      Array.from(letters).forEach(function (letter) {
        rowElement.appendChild(createLetterKey(letter, interactive));
      });
      keyboard.appendChild(rowElement);
    });
    return keyboard;
  }

  function ensureStyles() {
    if (document.getElementById('hangman-gameplay-styles')) return;
    var style = document.createElement('style');
    style.id = 'hangman-gameplay-styles';
    style.textContent = [
      '#hangman-gameplay-ui{position:fixed;inset:0;z-index:2147482000;pointer-events:none;font-family:Montserrat,Arial,sans-serif;color:#07101f}',
      '.hangman-game-hud{position:absolute;left:50%;bottom:calc(clamp(92px,14vh,180px) + 100px);transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:12px;pointer-events:auto}',
      '.hangman-game-hint-row{display:flex;flex-direction:column;align-items:center;gap:6px;max-width:94vw}',
      
      '.hangman-game-hint-label{color:' + BLUE + ';font-size:19px;font-weight:800;letter-spacing:.08em;white-space:nowrap}',
      '.hangman-game-hint{max-width:min(82vw,700px);padding:10px 18px;border:3px solid ' + BLUE + ';border-radius:999px;background:' + GOLD + ';color:' + BLUE + ';font-size:25px;font-weight:800;text-align:center;box-shadow:0 7px 0 rgba(0,85,212,.18)}',
      '.hangman-mini-trigger{border:2px solid ' + BLUE + ';border-radius:14px;background:rgba(255,255,255,.94);padding:6px 8px;box-shadow:0 7px 20px rgba(0,24,80,.18);cursor:pointer;color:inherit}',
      '.hangman-mini-trigger:focus-visible,.hangman-game-key:focus-visible{outline:3px solid ' + GOLD + ';outline-offset:3px}',
      '.hangman-keyboard{display:flex;flex-direction:column;align-items:center}',
      '.hangman-keyboard-row{display:flex;justify-content:center}',
      '.hangman-keyboard-small{gap:2px}',
      '.hangman-keyboard-small .hangman-keyboard-row{gap:2px}',
      '.hangman-keyboard-small .hangman-game-key{width:18px;height:15px;font-size:8px}',
      '.hangman-game-key{position:relative;display:grid;place-items:center;padding:0;border:0;border-radius:7px;background:#fff;color:' + BLUE + ';font-weight:900;line-height:1;box-shadow:0 2px 0 rgba(0,85,212,.22)}',
      '.hangman-game-key-label{position:relative;z-index:1}',
      '.hangman-key-mark{position:absolute;inset:-16%;width:132%;height:132%;overflow:visible;pointer-events:none}',
      '.hangman-key-mark path{fill:none;stroke-width:3.1;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;opacity:0}',
      '.hangman-mark-check{stroke:' + CORRECT_COLOR + '}',
      '.hangman-mark-cross{stroke:' + WRONG_COLOR + '}',
      '.hangman-game-key.is-correct .hangman-mark-check,.hangman-game-key.is-wrong .hangman-mark-cross{opacity:1;stroke-dashoffset:0}',
      '.hangman-game-key.is-used{background:#eef2f7;color:#667085;cursor:default}',
      '.hangman-game-status{min-height:24px;padding:6px 14px;border-radius:999px;background:rgba(255,255,255,.9);color:' + BLUE + ';font-size:23px;font-weight:800;text-align:center;transition:opacity .22s ease}',
      '.hangman-keyboard-overlay{position:absolute;inset:0;display:grid;place-items:center;padding:20px;background:rgba(244,247,252,.64);backdrop-filter:blur(11px);-webkit-backdrop-filter:blur(11px);opacity:0;visibility:hidden;pointer-events:none}',
      '#hangman-gameplay-ui.keyboard-open .hangman-keyboard-overlay{opacity:1;visibility:visible;pointer-events:auto}',
      '#hangman-gameplay-ui.keyboard-open .hangman-game-hud{pointer-events:none}',
      '#hangman-gameplay-ui.keyboard-open .hangman-mini-trigger{opacity:0}',
      '.hangman-keyboard-panel{width:min(94vw,760px);padding:24px 16px 26px;border:3px solid ' + BLUE + ';border-radius:28px;background:rgba(255,255,255,.97);box-shadow:0 30px 90px rgba(0,30,90,.3);transform:scale(.35) translateY(40px);opacity:0}',
      '#hangman-gameplay-ui.keyboard-open .hangman-keyboard-panel{transform:scale(1) translateY(0);opacity:1}',
      '.hangman-keyboard-title{text-align:center;color:' + BLUE + ';font-size:clamp(15px,3vw,23px);font-weight:900;margin-bottom:18px;letter-spacing:.06em}',
      '.hangman-keyboard-large{gap:clamp(7px,1.5vw,12px)}',
      '.hangman-keyboard-large .hangman-keyboard-row{gap:clamp(5px,1.2vw,11px)}',
      '.hangman-keyboard-large .hangman-game-key{width:clamp(30px,7vw,58px);height:clamp(38px,8vw,66px);font-size:clamp(15px,3.5vw,28px);cursor:pointer;transition:transform .14s ease,background .2s ease}',
      '.hangman-keyboard-large .hangman-game-key:not(.is-used):hover{transform:translateY(-4px) scale(1.06);background:' + GOLD + '}',
      '.hangman-flying-letter{position:fixed;z-index:2147482500;display:grid;place-items:center;width:48px;height:58px;color:' + BLUE + ';font:900 42px/1 Montserrat,Arial,sans-serif;pointer-events:none;text-shadow:0 4px 0 #fff,0 8px 18px rgba(0,48,130,.25)}',
      '.hangman-flying-letter.is-wrong:before,.hangman-flying-letter.is-wrong:after{content:"";position:absolute;width:58px;height:6px;border-radius:999px;background:' + WRONG_COLOR + ';box-shadow:0 2px 0 rgba(255,255,255,.8)}',
      '.hangman-flying-letter.is-wrong:before{transform:rotate(45deg)}',
      '.hangman-flying-letter.is-wrong:after{transform:rotate(-45deg)}',
      '.hangman-glitter{position:fixed;z-index:2147482600;width:7px;height:7px;border-radius:2px;pointer-events:none}',
      '.hangman-revealed-letter{fill:' + BLUE + ';font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:900;text-anchor:middle}',
      'body.hangman-keyboard-open #hangman-page-camera{filter:blur(7px)}',
      '#hangman-page-camera{transition:filter .28s ease}',
      '.hangman-round-eraser{position:fixed;inset:-8vh -20vw;z-index:2147482900;pointer-events:none;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.9) 18%,#fff 42%,#fff 58%,rgba(255,255,255,.9) 82%,transparent 100%);box-shadow:0 0 34px rgba(255,255,255,.9)}',
      '.hangman-missing-letter{fill:' + WRONG_COLOR + ';opacity:.7;font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:900;text-anchor:middle}',
      '@media(max-width:700px){.hangman-game-hud{bottom:calc(clamp(74px,12vh,130px) + 100px);gap:8px}.hangman-game-hint-row{gap:7px;max-width:96vw}.hangman-game-hint{max-width:78vw;font-size:21px;padding:8px 12px}.hangman-game-hint-label{font-size:15px}.hangman-game-status{font-size:20px;min-height:22px;padding:5px 10px;max-width:94vw}.hangman-keyboard-small .hangman-game-key{width:15px;height:13px;font-size:7px}.hangman-keyboard-panel{padding:15px 8px 17px;border-radius:18px}.hangman-keyboard-title{margin-bottom:10px}}',
      '@media(prefers-reduced-motion:reduce){#hangman-page-camera,.hangman-keyboard-overlay,.hangman-keyboard-panel{transition:none!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  function destroyUi() {
    clearTweens();
    cancelRoundEnd();
    document.body.classList.remove('hangman-keyboard-open');
    if (ui && ui.root && ui.root.parentNode) ui.root.parentNode.removeChild(ui.root);
    ui = null;
    usedLetters = new Map();
    errorCount = 0;
    guessInProgress = false;
    instructionDismissed = false;
  }

  function setStatus(message) {
    if (ui && ui.status) ui.status.textContent = message || '';
  }

  function dismissInstruction() {
    if (instructionDismissed || !ui || !ui.status) return;
    instructionDismissed = true;
    if (window.gsap) {
      track(window.gsap.to(ui.status, {
        autoAlpha: 0,
        duration: reducedMotion() ? 0.05 : 0.28,
        ease: 'power1.out',
        onComplete: function () {
          if (ui && ui.status) ui.status.style.display = 'none';
        }
      }));
    } else {
      ui.status.style.display = 'none';
    }
  }

  function showFinalStatus(message) {
    if (!ui || !ui.status) return;
    ui.status.textContent = message;
    ui.status.style.display = 'block';
    if (window.gsap) window.gsap.set(ui.status, { autoAlpha: 1 });
    else ui.status.style.opacity = '1';
  }

  function syncLetterState(letter, result) {
    if (!ui) return;
    ui.root.querySelectorAll('[data-game-letter="' + letter + '"]').forEach(function (key) {
      key.classList.add('is-used', result === 'correct' ? 'is-correct' : 'is-wrong');
      if (key.tagName === 'BUTTON') key.disabled = true;
    });
  }

  function animateMarks(letter, result) {
    if (!window.gsap || !ui) return;
    var selector = result === 'correct' ? '.hangman-mark-check' : '.hangman-mark-cross';
    ui.root.querySelectorAll('[data-game-letter="' + letter + '"] ' + selector).forEach(function (path, index) {
      window.gsap.set(path, { opacity: 1, strokeDashoffset: 1 });
      track(window.gsap.to(path, {
        strokeDashoffset: 0,
        duration: reducedMotion() ? 0.08 : 0.34,
        delay: index * 0.025,
        ease: 'power2.out'
      }));
    });
  }

  function openKeyboard() {
    if (!ui || guessInProgress || ui.gameOver) return;
    ui.root.classList.add('keyboard-open');
    document.body.classList.add('hangman-keyboard-open');
    ui.overlay.setAttribute('aria-hidden', 'false');
    if (window.gsap) {
      window.gsap.fromTo(ui.panel, { scale: 0.35, y: 40, opacity: 0 }, {
        scale: 1, y: 0, opacity: 1,
        duration: reducedMotion() ? 0.08 : 0.38,
        ease: 'back.out(1.35)'
      });
    }
    var firstAvailable = ui.largeKeyboard.querySelector('.hangman-game-key:not(:disabled)');
    if (firstAvailable) firstAvailable.focus({ preventScroll: true });
  }

  function closeKeyboard() {
    if (!ui) return;
    ui.root.classList.remove('keyboard-open');
    document.body.classList.remove('hangman-keyboard-open');
    ui.overlay.setAttribute('aria-hidden', 'true');
  }

  function buildUi() {
    destroyUi();
    ensureStyles();
    var root = document.createElement('div');
    root.id = 'hangman-gameplay-ui';
    root.addEventListener('pointerdown', function (event) {
      event.stopPropagation();
    });
    root.addEventListener('click', function (event) {
      event.stopPropagation();
    });

    var hud = document.createElement('div');
    hud.className = 'hangman-game-hud';
    var hintRow = document.createElement('div');
    hintRow.className = 'hangman-game-hint-row';
    var hintLabel = document.createElement('span');
    hintLabel.className = 'hangman-game-hint-label';
    hintLabel.textContent = 'Dica:';
    var hint = document.createElement('div');
    hint.className = 'hangman-game-hint';
    hint.appendChild(document.createTextNode(round.hint || 'Descubra a palavra'));
    hintRow.appendChild(hintLabel);
    hintRow.appendChild(hint);
    hud.appendChild(hintRow);

    var miniTrigger = document.createElement('button');
    miniTrigger.type = 'button';
    miniTrigger.className = 'hangman-mini-trigger';
    miniTrigger.setAttribute('aria-label', 'Abrir teclado de letras');
    var smallKeyboard = createKeyboard(false);
    miniTrigger.appendChild(smallKeyboard);
    miniTrigger.addEventListener('click', openKeyboard);
    hud.appendChild(miniTrigger);

    var status = document.createElement('div');
    status.className = 'hangman-game-status';
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'Toque no teclado para escolher uma letra';
    hud.appendChild(status);
    root.appendChild(hud);

    var overlay = document.createElement('div');
    overlay.className = 'hangman-keyboard-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    var panel = document.createElement('div');
    panel.className = 'hangman-keyboard-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Escolha uma letra');
    var largeKeyboard = createKeyboard(true);
    panel.appendChild(largeKeyboard);
    overlay.appendChild(panel);
    root.appendChild(overlay);

    var effects = document.createElement('div');
    effects.className = 'hangman-effects-layer';
    root.appendChild(effects);
    document.body.appendChild(root);
    ui = {
      root: root,
      hud: hud,
      hint: hint,
      miniTrigger: miniTrigger,
      smallKeyboard: smallKeyboard,
      overlay: overlay,
      panel: panel,
      largeKeyboard: largeKeyboard,
      status: status,
      effects: effects,
      gameOver: false
    };

    usedLetters.forEach(function (result, letter) {
      syncLetterState(letter, result);
    });
  }

  function createFlyer(letter, center, wrong) {
    var flyer = document.createElement('div');
    flyer.className = 'hangman-flying-letter' + (wrong ? ' is-wrong' : '');
    flyer.textContent = letter;
    flyer.style.left = center.x + 'px';
    flyer.style.top = center.y + 'px';
    flyer.style.transform = 'translate(-50%,-50%)';
    document.body.appendChild(flyer);
    return flyer;
  }

  function rectCenter(rect) {
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function explodeGlitter(center) {
    if (!window.gsap || !ui) return;
    var colors = [GOLD, CORRECT_COLOR, BLUE, '#8b5cf6', '#f97316'];
    var count = reducedMotion() ? 6 : 18;
    for (var i = 0; i < count; i += 1) {
      var particle = document.createElement('span');
      particle.className = 'hangman-glitter';
      particle.style.left = center.x + 'px';
      particle.style.top = center.y + 'px';
      particle.style.background = colors[i % colors.length];
      document.body.appendChild(particle);
      var angle = Math.PI * 2 * i / count + Math.random() * 0.35;
      var distance = 24 + Math.random() * 50;
      track(window.gsap.to(particle, {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        rotation: Math.random() * 280,
        scale: 0,
        opacity: 0,
        duration: reducedMotion() ? 0.25 : 0.75 + Math.random() * 0.25,
        ease: 'power2.out',
        onComplete: function () {
          if (this.targets()[0].parentNode) this.targets()[0].parentNode.removeChild(this.targets()[0]);
        }
      }));
    }
  }

  function revealSlot(slot) {
    if (!slot || slot.getAttribute('data-revealed') === 'true') return;
    slot.setAttribute('data-revealed', 'true');
    var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    var x = (Number(slot.getAttribute('x1')) + Number(slot.getAttribute('x2'))) / 2;
    text.setAttribute('class', 'hangman-revealed-letter');
    text.setAttribute('x', x);
    text.setAttribute('y', Number(slot.getAttribute('y1')) - 4);
    text.textContent = slot.getAttribute('data-letter') || '';
    slot.parentNode.appendChild(text);
    if (window.gsap) {
      window.gsap.fromTo(text, { opacity: 0, scale: 0.25, transformOrigin: '50% 50%' }, {
        opacity: 1,
        scale: 1,
        duration: reducedMotion() ? 0.1 : 0.32,
        ease: 'back.out(1.8)'
      });
    }
  }

  function allLettersRevealed() {
    var slots = Array.prototype.slice.call(document.querySelectorAll('.hangman-slot[data-letter]'));
    return slots.length > 0 && slots.every(function (slot) {
      return slot.getAttribute('data-revealed') === 'true';
    });
  }

  function finishWin() {
    if (!ui) return;
    ui.gameOver = true;
    showFinalStatus('PARABÉNS! VOCÊ ACERTOU!');
    if (window.HangmanAnimation) window.HangmanAnimation.celebratePieces();
    var winningLetters = Array.prototype.slice.call(document.querySelectorAll('.hangman-revealed-letter'));
    if (window.gsap) {
      winningLetters.forEach(function (letter, index) {
        track(window.gsap.to(letter, {
          fill: CORRECT_COLOR,
          y: -10,
          duration: reducedMotion() ? 0.12 : 0.42,
          delay: index * 0.05,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        }));
      });
    }
    scheduleRoundEnd();
  }

  function revealMissingLetters() {
    var slots = Array.prototype.slice.call(document.querySelectorAll('.hangman-slot[data-letter]'));
    slots.forEach(function (slot) {
      if (slot.getAttribute('data-revealed') === 'true') return;
      var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      var x = (Number(slot.getAttribute('x1')) + Number(slot.getAttribute('x2'))) / 2;
      text.setAttribute('class', 'hangman-missing-letter');
      text.setAttribute('x', x);
      text.setAttribute('y', Number(slot.getAttribute('y1')) - 4);
      text.textContent = slot.getAttribute('data-letter') || '';
      slot.parentNode.appendChild(text);
    });
  }

  function finishLoss() {
    if (!ui) return;
    ui.gameOver = true;
    showFinalStatus('Dá tempo de revisar pro ENEM. Continue estudando.');
    revealMissingLetters();
    scheduleRoundEnd();
  }

  function flyCorrectLetter(letter, sourceCenter, slots, index) {
    if (!ui || !window.gsap) return;
    if (index >= slots.length) {
      guessInProgress = false;
      if (allLettersRevealed()) finishWin();
      return;
    }

    var slot = slots[index];
    var targetCenter = rectCenter(slot.getBoundingClientRect());
    var flyer = createFlyer(letter, sourceCenter, false);
    var deltaX = targetCenter.x - sourceCenter.x;
    var deltaY = targetCenter.y - sourceCenter.y;
    var timeline = window.gsap.timeline({
      onComplete: function () {
        revealSlot(slot);
        explodeGlitter(targetCenter);
        if (flyer.parentNode) flyer.parentNode.removeChild(flyer);
        flyCorrectLetter(letter, targetCenter, slots, index + 1);
      }
    });
    timeline.to(flyer, {
      x: deltaX * 0.48,
      y: deltaY * 0.48 - (reducedMotion() ? 3 : 34),
      rotation: index % 2 ? -7 : 7,
      scale: 1.12,
      duration: reducedMotion() ? 0.08 : 0.28,
      ease: 'power1.out'
    }).to(flyer, {
      x: deltaX,
      y: deltaY,
      rotation: 0,
      scale: 0.78,
      duration: reducedMotion() ? 0.12 : 0.5,
      ease: 'power2.in'
    });
    track(timeline);
  }

  function handleCorrect(letter, sourceCenter, slots) {
    closeKeyboard();
    if (window.HangmanAnimation) window.HangmanAnimation.celebratePieces();
    flyCorrectLetter(letter, sourceCenter, slots, 0);
  }

  function handleWrong(letter, sourceCenter) {
    closeKeyboard();
    var wrongIndex = errorCount;
    errorCount += 1;
    if (window.HangmanAnimation) window.HangmanAnimation.fearAndHangPiece(wrongIndex);
    var flyer = createFlyer(letter, sourceCenter, true);
    var destinationX = -sourceCenter.x - 100;
    track(window.gsap.to(flyer, {
      x: destinationX,
      y: reducedMotion() ? 0 : -45,
      rotation: -22,
      opacity: 0,
      duration: reducedMotion() ? 0.25 : 1.05,
      ease: 'power2.in',
      onComplete: function () {
        if (flyer.parentNode) flyer.parentNode.removeChild(flyer);
      }
    }));
    track(window.gsap.delayedCall(reducedMotion() ? 0.5 : 1.75, function () {
      guessInProgress = false;
      if (errorCount >= 6) finishLoss();
    }));
  }

  function chooseLetter(letter, sourceKey) {
    if (!ui || !round || guessInProgress || ui.gameOver || usedLetters.has(letter)) return;
    guessInProgress = true;
    dismissInstruction();
    var sourceCenter = rectCenter(sourceKey.getBoundingClientRect());
    var slots = Array.prototype.slice.call(document.querySelectorAll(
      '.hangman-slot[data-normalized-letter="' + letter + '"]'
    )).filter(function (slot) {
      return slot.getAttribute('data-revealed') !== 'true';
    }).sort(function (a, b) {
      return Number(a.getAttribute('data-character-index')) - Number(b.getAttribute('data-character-index'));
    });
    var result = slots.length ? 'correct' : 'wrong';
    usedLetters.set(letter, result);
    if (window.gsap) {
      track(window.gsap.fromTo(sourceKey, { scale: 1 }, {
        scale: 1.18,
        duration: reducedMotion() ? 0.05 : 0.14,
        repeat: 1,
        yoyo: true,
        ease: 'power2.out'
      }));
    }
    syncLetterState(letter, result);
    animateMarks(letter, result);

    track(window.gsap.delayedCall(reducedMotion() ? 0.1 : 0.4, function () {
      if (result === 'correct') handleCorrect(letter, sourceCenter, slots);
      else handleWrong(letter, sourceCenter);
    }));
  }

  function handleKeydown(event) {
    if (!ui) return;
    if (event.key === 'Escape' && ui.root.classList.contains('keyboard-open')) {
      closeKeyboard();
      return;
    }
    if (!ui.root.classList.contains('keyboard-open')) return;
    var letter = String(event.key || '').toLocaleUpperCase('pt-BR');
    if (!/^[A-Z]$/.test(letter)) return;
    var key = ui.largeKeyboard.querySelector('[data-game-letter="' + letter + '"]');
    if (key && !key.disabled) chooseLetter(letter, key);
  }

  document.addEventListener('hangman:round-ready', function (event) {
    destroyUi();
    round = event.detail || null;
  });

  document.addEventListener('hangman:sequence-complete', function () {
    if (!round || !round.word) return;
    buildUi();
  });

  document.addEventListener('hangman:reset', function () {
    destroyUi();
    round = null;
  });

  document.addEventListener('keydown', handleKeydown);
})();
