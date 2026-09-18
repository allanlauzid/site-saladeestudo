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
  var RED = '#d1273f';
  var round = null;
  var ui = null;
  var usedLetters = new Map();
  var errorCount = 0;
  var guessInProgress = false;
  var instructionDismissed = false;
  var helpEliminateUsed = 0;
  var HELP_ELIMINATE_MAX = 3;
  var helpChoiceUsed = false;
  var helpEliminateBusy = false;
  var activeTweens = [];
  var roundEndTimer = null;
  var roundEndListenersAttached = false;
  var roundEndOverlay = null;

  function reducedMotion() {
    return Boolean(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function getPageCamera() {
    return document.getElementById('hangman-page-camera');
  }

  function getCameraCompensation() {
    var camera = getPageCamera();
    if (!camera) return 0;
    if (window.gsap) return -(Number(window.gsap.getProperty(camera, 'x')) || 0);
    var transform = window.getComputedStyle(camera).transform;
    if (!transform || transform === 'none') return 0;
    try { return -(new DOMMatrixReadOnly(transform).m41 || 0); }
    catch (error) { return 0; }
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
    var camera = getPageCamera();
    var cameraCompensation = getCameraCompensation();
    roundEndOverlay.style.left = (cameraCompensation - window.innerWidth * 0.2) + 'px';
    roundEndOverlay.style.top = ((window.scrollY || 0) - window.innerHeight * 0.08) + 'px';
    roundEndOverlay.style.width = (window.innerWidth * 1.4) + 'px';
    roundEndOverlay.style.height = (window.innerHeight * 1.16) + 'px';
    (camera || document.body).appendChild(roundEndOverlay);
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
    roundEndTimer = window.setTimeout(finishRoundAndReset, 20000);
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
      '#hangman-gameplay-ui{position:absolute;top:0;left:var(--hangman-camera-compensation,0px);width:100vw;height:100vh;z-index:2147482000;pointer-events:none;font-family:Montserrat,Arial,sans-serif;color:#07101f}',
      '.hangman-game-hud{position:absolute;left:50%;bottom:calc(clamp(92px,14vh,180px) + 100px);transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:12px;pointer-events:auto}',
      '.hangman-game-hint-row{display:flex;flex-direction:column;align-items:center;gap:6px;max-width:94vw}',
      
      '.hangman-game-hint-label{color:' + BLUE + ';font-size:19px;font-weight:800;letter-spacing:.08em;white-space:nowrap}',
      '.hangman-game-hint{position:relative;max-width:min(82vw,700px);padding:10px 18px;border:3px solid ' + BLUE + ';border-radius:999px;background:' + GOLD + ';color:' + BLUE + ';font-size:25px;font-weight:800;text-align:center;box-shadow:0 7px 0 rgba(0,85,212,.18)}',
      '.hangman-hint2-toggle{position:absolute;top:-15px;right:-15px;width:38px;height:38px;border-radius:50%;border:3px solid #fff;background:' + RED + ';box-shadow:0 4px 0 rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer;pointer-events:auto;transition:transform .12s ease}',
      '.hangman-hint2-toggle:active{transform:scale(.9)}',
      '.hangman-hint2-toggle .hangman-hint2-plus{font-family:"Permanent Marker",cursive;color:' + GOLD + ';font-size:15px;line-height:1;transform:rotate(-12deg);display:block;pointer-events:none}',
      '.hangman-hint2-toggle svg{width:20px;height:20px;display:block;pointer-events:none}',
      '.hangman-help-toggle{position:absolute;right:-15px;width:38px;height:38px;border-radius:50%;border:3px solid #fff;box-shadow:0 4px 0 rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer;pointer-events:auto;color:#fff;font-weight:900;font-size:11px;line-height:1;transition:transform .12s ease,opacity .15s ease}',
      '.hangman-help-toggle:active{transform:scale(.9)}',
      '.hangman-help-toggle:disabled{opacity:.35;cursor:default}',
      '.hangman-help-eliminate{top:29px;background:' + BLUE + '}',
      '.hangman-help-menu{top:73px;background:#7c3aed}',
      '.hangman-help-modal-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(10,20,40,.55);padding:16px}',
      '.hangman-help-modal{width:min(94vw,760px);max-height:90vh;overflow:auto;background:#fff;border:3px solid ' + BLUE + ';border-radius:16px;padding:22px;box-shadow:0 30px 80px rgba(0,20,60,.35)}',
      '.hangman-help-modal h3{margin:0 0 5px;color:' + BLUE + ';font-size:22px;text-align:center;text-wrap:balance}',
      '.hangman-help-modal>p{margin:0 0 18px;color:#44546a;font-size:14px;text-align:center}',
      '.hangman-help-options-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}',
      '.hangman-help-option-wrap{aspect-ratio:1/1;min-width:0;display:grid;grid-template-rows:1fr 42px;border:3px solid ' + BLUE + ';border-radius:16px;overflow:hidden;background:#f4f8ff;box-shadow:0 4px 0 rgba(0,85,212,.18)}',
      '.hangman-help-option-wrap.is-disabled{border-color:#aeb9c8;background:#f1f3f6;box-shadow:0 4px 0 rgba(70,82,100,.12)}',
      '.hangman-help-option{display:flex;min-width:0;flex-direction:column;align-items:center;justify-content:center;gap:12px;border:0;background:transparent;color:' + BLUE + ';padding:16px 12px 12px;font:800 15px/1.25 Montserrat,Arial,sans-serif;text-align:center;cursor:pointer;transition:background .18s ease,transform .18s ease}',
      '.hangman-help-option:not(:disabled):hover{background:#e4efff}',
      '.hangman-help-option:not(:disabled):active{transform:scale(.97)}',
      '.hangman-help-option:focus-visible,.hangman-help-option-info:focus-visible,.hangman-help-explanation-close:focus-visible{outline:3px solid ' + GOLD + ';outline-offset:-3px}',
      '.hangman-help-option:disabled{color:#788494;cursor:not-allowed}',
      '.hangman-help-option-icon{width:64px;height:64px;line-height:1;display:grid;place-items:center;color:' + BLUE + ';filter:drop-shadow(0 3px 0 rgba(0,85,212,.13))}',
      '.hangman-help-option-icon svg,.hangman-help-explanation-icon svg{display:block;width:100%;height:100%;overflow:visible}',
      '.hangman-help-option-wrap.is-disabled .hangman-help-option-icon{filter:grayscale(1) drop-shadow(0 3px 0 rgba(70,82,100,.1));opacity:.72}',
      '.hangman-help-option-label{display:block;max-width:16ch}',
      '.hangman-help-option-info{width:100%;border:0;border-top:2px solid ' + BLUE + ';background:' + BLUE + ';color:#fff;font:800 13px/1 Montserrat,Arial,sans-serif;cursor:pointer;transition:background .18s ease}',
      '.hangman-help-option-info:hover{background:#0047b3}',
      '.hangman-help-option-wrap.is-disabled .hangman-help-option-info{border-top-color:#788494;background:#788494}',
      '.hangman-help-option-wrap.is-disabled .hangman-help-option-info:hover{background:#626e7d}',
      '.hangman-help-modal-close{display:block;margin:18px auto 0;padding:9px 14px;background:none;border:0;color:#596579;cursor:pointer;text-decoration:underline;font:700 13px Montserrat,Arial,sans-serif}',
      '.hangman-help-explanation-overlay{position:fixed;inset:0;z-index:2147483100;display:grid;place-items:center;background:rgba(7,16,31,.66);padding:18px}',
      '.hangman-help-explanation{width:min(90vw,430px);background:#fff;border:3px solid ' + BLUE + ';border-radius:16px;padding:22px;text-align:center;box-shadow:0 24px 64px rgba(0,20,60,.38)}',
      '.hangman-help-explanation-icon{display:grid;place-items:center;width:76px;height:76px;line-height:1;margin:0 auto 10px;color:' + BLUE + ';filter:drop-shadow(0 3px 0 rgba(0,85,212,.13))}',
      '.hangman-help-explanation h4{margin:0 0 10px;color:' + BLUE + ';font-size:20px;text-wrap:balance}',
      '.hangman-help-explanation p{margin:0;color:#344054;font-size:15px;line-height:1.55;text-align:left}',
      '.hangman-help-explanation-close{margin-top:18px;min-width:120px;border:0;border-radius:10px;background:' + BLUE + ';color:#fff;padding:11px 18px;font:800 14px Montserrat,Arial,sans-serif;cursor:pointer}',
      '.hangman-speech-bubble{position:absolute;left:50%;bottom:100%;transform:translateX(-50%);margin-bottom:14px;z-index:2147482800;background:#fff;border:3px solid ' + BLUE + ';border-radius:16px;padding:8px 16px;font-weight:800;color:' + BLUE + ';font-size:16px;white-space:nowrap;box-shadow:0 8px 20px rgba(0,30,90,.25)}',
      '.hangman-speech-bubble:after{content:"";position:absolute;top:100%;left:50%;transform:translateX(-50%);border-width:10px 8px 0;border-style:solid;border-color:' + BLUE + ' transparent transparent}',
      '.hangman-game-key.is-eliminated{visibility:hidden;pointer-events:none}',
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
      /* A classe apenas revela a marca; o desenho progressivo do X fica sob
         controle exclusivo de animateMarks/GSAP. Forçar dashoffset=0 aqui
         fazia o X aparecer instantaneamente. */
      '.hangman-game-key.is-correct .hangman-mark-check,.hangman-game-key.is-wrong .hangman-mark-cross{opacity:1}',
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
      '.hangman-effects-layer{position:absolute;inset:0;pointer-events:none}',
      '.hangman-flying-letter{position:absolute;z-index:2147482500;display:grid;place-items:center;width:48px;height:58px;color:' + BLUE + ';font:900 42px/1 Montserrat,Arial,sans-serif;pointer-events:none;text-shadow:0 4px 0 #fff,0 8px 18px rgba(0,48,130,.25)}',
      '.hangman-flying-letter.is-wrong:before,.hangman-flying-letter.is-wrong:after{content:"";position:absolute;width:58px;height:6px;border-radius:999px;background:' + WRONG_COLOR + ';box-shadow:0 2px 0 rgba(255,255,255,.8)}',
      '.hangman-flying-letter.is-wrong:before{transform:rotate(45deg)}',
      '.hangman-flying-letter.is-wrong:after{transform:rotate(-45deg)}',
      '.hangman-glitter{position:absolute;z-index:2147482600;width:7px;height:7px;border-radius:2px;pointer-events:none}',
      '.hangman-revealed-letter{fill:' + BLUE + ';font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:900;text-anchor:middle}',
      'body.hangman-keyboard-open #hangman-page-camera > :not(#hangman-gameplay-ui):not(#hangman-topic-reveal){filter:blur(7px)}',
      'body.hangman-help-open #hangman-page-camera > :not(#hangman-gameplay-ui):not(#hangman-topic-reveal){filter:blur(7px)}',
      '#hangman-page-camera{transition:filter .28s ease}',
      '.hangman-round-eraser{position:absolute;z-index:2147482900;pointer-events:none;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.9) 18%,#fff 42%,#fff 58%,rgba(255,255,255,.9) 82%,transparent 100%);box-shadow:0 0 34px rgba(255,255,255,.9)}',
      '.hangman-missing-letter{fill:' + WRONG_COLOR + ';opacity:.7;font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:900;text-anchor:middle}',
      '@media(max-width:700px){.hangman-game-hud{bottom:calc(clamp(74px,12vh,130px) + 100px);gap:8px}.hangman-game-hint-row{gap:7px;max-width:96vw}.hangman-game-hint{max-width:78vw;font-size:21px;padding:8px 12px}.hangman-game-hint-label{font-size:15px}.hangman-game-status{font-size:20px;min-height:22px;padding:5px 10px;max-width:94vw}.hangman-keyboard-small .hangman-game-key{width:15px;height:13px;font-size:7px}.hangman-keyboard-panel{padding:15px 8px 17px;border-radius:18px}.hangman-keyboard-title{margin-bottom:10px}.hangman-help-modal{width:min(94vw,520px);padding:16px}.hangman-help-options-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.hangman-help-option-wrap{grid-template-rows:1fr 38px;border-radius:14px}.hangman-help-option{padding:12px 8px 9px;font-size:13px}.hangman-help-option-icon{width:52px;height:52px}}',
      '@media(prefers-reduced-motion:reduce){#hangman-page-camera,.hangman-keyboard-overlay,.hangman-keyboard-panel{transition:none!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  function destroyUi() {
    clearTweens();
    cancelRoundEnd();
    document.body.classList.remove('hangman-keyboard-open');
    document.body.classList.remove('hangman-help-open');
    if (ui && ui.helpModalOverlay && ui.helpModalOverlay.parentNode) {
      ui.helpModalOverlay.parentNode.removeChild(ui.helpModalOverlay);
    }
    if (ui && ui.helpExplanationOverlay && ui.helpExplanationOverlay.parentNode) {
      ui.helpExplanationOverlay.parentNode.removeChild(ui.helpExplanationOverlay);
    }
    if (ui && ui.root && ui.root.parentNode) ui.root.parentNode.removeChild(ui.root);
    ui = null;
    usedLetters = new Map();
    errorCount = 0;
    guessInProgress = false;
    instructionDismissed = false;
    helpEliminateUsed = 0;
    helpChoiceUsed = false;
    helpEliminateBusy = false;
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

  function animateMarks(letter, result, options) {
    if (!window.gsap || !ui) return;
    var selector = result === 'correct' ? '.hangman-mark-check' : '.hangman-mark-cross';
    var customDuration = options && typeof options.duration === 'number' ? options.duration : null;
    var paths = Array.prototype.slice.call(ui.root.querySelectorAll(
      '[data-game-letter="' + letter + '"] ' + selector
    ));
    paths.forEach(function (path, index) {
      window.gsap.set(path, { opacity: 1, strokeDashoffset: 1 });
      track(window.gsap.to(path, {
        strokeDashoffset: 0,
        duration: reducedMotion() ? 0.08 : (customDuration || 0.34),
        delay: index * 0.025,
        ease: 'power2.out',
        onComplete: (options && options.onComplete && index === paths.length - 1) ? options.onComplete : undefined
      }));
    });
    if (!paths.length && options && options.onComplete) options.onComplete();
  }

  function openKeyboard() {
    if (!ui || guessInProgress || ui.gameOver) return;
    if (ui.root.classList.contains('keyboard-open')) return;
    ui.root.classList.add('keyboard-open');
    document.body.classList.add('hangman-keyboard-open');
    ui.overlay.setAttribute('aria-hidden', 'false');
    if (window.gsap) {
      window.gsap.killTweensOf(ui.overlay);
      window.gsap.killTweensOf(ui.panel);
      window.gsap.fromTo(ui.overlay, { opacity: 0 }, {
        opacity: 1,
        duration: reducedMotion() ? 0.08 : 0.26,
        ease: 'power1.out'
      });
      window.gsap.fromTo(ui.panel, { scale: 0.35, y: 40, opacity: 0 }, {
        scale: 1, y: 0, opacity: 1,
        duration: reducedMotion() ? 0.08 : 0.38,
        ease: 'back.out(1.35)'
      });
    }
    var firstAvailable = ui.largeKeyboard.querySelector('.hangman-game-key:not(:disabled)');
    if (firstAvailable) firstAvailable.focus({ preventScroll: true });
  }

  /* Fechar tinha zero animacao (sumia seco). Agora o painel encolhe/some
     e o fundo desfoca de volta suavemente, e so DEPOIS disso a classe
     "keyboard-open" sai (ela e o que aciona o blur da cena via CSS) --
     senao o blur sumiria de golpe enquanto o painel ainda estivesse
     desaparecendo. Aceita um callback opcional pra quem precisa saber
     quando o fechamento visual realmente terminou. */
  function closeKeyboard(callback) {
    if (!ui) { if (callback) callback(); return; }
    if (!ui.root.classList.contains('keyboard-open')) {
      if (callback) callback();
      return;
    }
    var finish = function () {
      if (ui) {
        ui.root.classList.remove('keyboard-open');
        ui.overlay.setAttribute('aria-hidden', 'true');
      }
      document.body.classList.remove('hangman-keyboard-open');
      if (callback) callback();
    };
    if (window.gsap) {
      window.gsap.killTweensOf(ui.overlay);
      window.gsap.killTweensOf(ui.panel);
      var closeTimeline = window.gsap.timeline({ onComplete: finish });
      closeTimeline.to(ui.panel, {
        scale: 0.35,
        y: 40,
        opacity: 0,
        duration: reducedMotion() ? 0.08 : 0.24,
        ease: 'power1.in'
      }, 0);
      closeTimeline.to(ui.overlay, {
        opacity: 0,
        duration: reducedMotion() ? 0.08 : 0.24,
        ease: 'power1.in'
      }, 0);
    } else {
      finish();
    }
  }

  /* ---------------------------------------------------------------------
     Ajudas (segundo e terceiro botao ao lado da dica)
     --------------------------------------------------------------------- */

  function getAlphabetLetters() {
    return ALPHABET_ROWS.join('').split('');
  }

  function getWrongLetterCandidates() {
    if (!round) return [];
    var wordLetters = (round.normalizedWord || '').split('');
    return getAlphabetLetters().filter(function (letter) {
      return wordLetters.indexOf(letter) === -1 && !usedLetters.has(letter);
    });
  }

  function getHiddenCorrectLetters() {
    if (!round) return [];
    var wordLetters = (round.normalizedWord || '').split('');
    var seen = {};
    return wordLetters.filter(function (letter) {
      if (seen[letter]) return false;
      seen[letter] = true;
      return !usedLetters.has(letter);
    });
  }

  function updateHelpButtonsState() {
    if (!ui) return;
    if (ui.eliminateToggle) {
      var canEliminate = helpEliminateUsed < HELP_ELIMINATE_MAX && getWrongLetterCandidates().length > 0;
      ui.eliminateToggle.disabled = !canEliminate || guessInProgress || ui.gameOver || helpEliminateBusy;
      ui.eliminateToggle.textContent = 'X' + Math.max(0, HELP_ELIMINATE_MAX - helpEliminateUsed);
    }
    if (ui.helpMenuToggle) {
      ui.helpMenuToggle.disabled = helpChoiceUsed || guessInProgress || ui.gameOver;
    }
  }

  function setAlphabetInputLocked(locked) {
    if (!ui || !ui.root) return;
    ui.root.classList.toggle('hangman-alphabet-locked', locked);
    ui.root.querySelectorAll('.hangman-keyboard-large button[data-game-letter]').forEach(function (key) {
      var letter = key.getAttribute('data-game-letter');
      if (locked) {
        if (!key.hasAttribute('data-help-lock-state')) {
          key.setAttribute('data-help-lock-state', key.disabled ? 'disabled' : 'enabled');
        }
        key.disabled = true;
        key.setAttribute('aria-disabled', 'true');
      } else {
        var wasEnabled = key.getAttribute('data-help-lock-state') === 'enabled';
        key.removeAttribute('data-help-lock-state');
        if (wasEnabled && !usedLetters.has(letter)) key.disabled = false;
        if (!key.disabled) key.removeAttribute('aria-disabled');
      }
    });
  }

  function revealLetterEverywhere(letter) {
    if (!round || usedLetters.has(letter)) return;
    usedLetters.set(letter, 'correct');
    syncLetterState(letter, 'correct');
    animateMarks(letter, 'correct');
    var slots = Array.prototype.slice.call(document.querySelectorAll(
      '.hangman-slot[data-normalized-letter="' + letter + '"]'
    ));
    slots.forEach(function (slot) {
      if (window.gsap) {
        var targetCenter = rectCenter(slot.getBoundingClientRect());
        explodeGlitter(targetCenter);
      }
      revealSlot(slot);
    });
    if (allLettersRevealed()) finishWin();
  }

  /* Sequencia pedida: abre o teclado, espera 1s, so ENTAO marca o X (com
     a animacao de "riscar" durando 2s), espera mais 1s depois de marcado,
     e fecha o teclado. Nada alem disso (nao mexe em erro/vida do jogador). */
  function eliminateWrongLetterHelper() {
    if (!ui || !round || guessInProgress || ui.gameOver || helpEliminateBusy) return;
    if (helpEliminateUsed >= HELP_ELIMINATE_MAX) return;
    var candidates = getWrongLetterCandidates();
    if (!candidates.length) return;

    helpEliminateBusy = true;
    helpEliminateUsed += 1;
    setAlphabetInputLocked(true);
    updateHelpButtonsState();

    var letter = candidates[Math.floor(Math.random() * candidates.length)];
    openKeyboard();

    window.setTimeout(function () {
      if (!ui) { helpEliminateBusy = false; return; }
      usedLetters.set(letter, 'wrong');
      syncLetterState(letter, 'wrong');

      /* Um pulinho na tecla no instante em que ela vai ser marcada, igual
         ao que acontece quando o proprio jogador aperta uma tecla -- sem
         isso a marcacao aparecia do nada, seca. */
      if (window.gsap) {
        ui.root.querySelectorAll('[data-game-letter="' + letter + '"]').forEach(function (key) {
          window.gsap.fromTo(key, { scale: 1 }, {
            scale: 1.18,
            duration: reducedMotion() ? 0.05 : 0.16,
            repeat: 1,
            yoyo: true,
            ease: 'power2.out'
          });
        });
      }

      animateMarks(letter, 'wrong', {
        duration: reducedMotion() ? 0.2 : 2,
        onComplete: function () {
          window.setTimeout(function () {
            closeKeyboard(function () {
              helpEliminateBusy = false;
              setAlphabetInputLocked(false);
              updateHelpButtonsState();
            });
          }, 1000);
        }
      });
    }, 1000);
  }

  function showSpeechBubble(text) {
    if (!ui || !ui.hint) return;
    var existing = ui.hint.querySelector('.hangman-speech-bubble');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    var bubble = document.createElement('div');
    bubble.className = 'hangman-speech-bubble';
    bubble.textContent = text;
    ui.hint.appendChild(bubble);
    window.setTimeout(function () {
      if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
    }, 4000);
  }

  function countVowelsConsonants() {
    var VOWELS = 'AEIOU';
    var letters = (round.normalizedWord || '').split('');
    var vowels = 0;
    letters.forEach(function (letter) {
      if (VOWELS.indexOf(letter) !== -1) vowels += 1;
    });
    return { vowels: vowels, consonants: letters.length - vowels };
  }

  function closeHelpExplanation() {
    if (!ui || !ui.helpExplanationOverlay) return;
    var overlay = ui.helpExplanationOverlay;
    ui.helpExplanationOverlay = null;
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  function closeHelpModal() {
    closeHelpExplanation();
    document.body.classList.remove('hangman-help-open');
    if (!ui || !ui.helpModalOverlay) return;
    if (ui.helpModalOverlay.parentNode) ui.helpModalOverlay.parentNode.removeChild(ui.helpModalOverlay);
    ui.helpModalOverlay = null;
  }

  /* Ícones autorais das seis ajudas. O desenho usa apenas formas SVG simples,
     preserva as cores do jogo e herda o cinza do cartão quando indisponível. */
  function getHelpIcon(kind) {
    var drawings = {
      reveal: [
        '<rect x="22" y="12" width="34" height="42" rx="6" fill="#ffd400"/>',
        '<text x="43" y="42" fill="currentColor" stroke="none" font-family="Montserrat,Arial,sans-serif" font-size="22" font-weight="900" text-anchor="middle">A</text>',
        '<path d="M10 20 31 14l8 39-22 5Z" fill="#dceaff"/>',
        '<path d="M31 14 39 53"/>',
        '<text x="23" y="42" fill="currentColor" stroke="none" font-family="Montserrat,Arial,sans-serif" font-size="20" font-weight="900" text-anchor="middle" transform="rotate(-11 23 42)">?</text>',
        '<path d="M11 16C13 9 19 5 26 6M22 3l5 3-3 5" stroke="#d1273f" stroke-width="3"/>'
      ],
      forgive: [
        '<g stroke="#d1273f" stroke-width="5"><path d="m5 18 11 11m0-11L5 29"/><path d="m21 18 11 11m0-11L21 29"/><path d="m46 7 11 11m0-11L46 18"/></g>',
        '<path d="M49 31v-7m-3 3 3-3 3 3M56 32v-7" stroke="currentColor" stroke-width="2.4"/>',
        '<path d="M58 59H41l-3-10H19c-4 0-7-2-7-5s3-5 7-5h17l-8-7c-3-3-2-6 0-8 2-2 5-1 7 1l14 11c5 4 7 9 8 15Z" fill="#fff" stroke="currentColor" stroke-width="2.8"/>',
        '<path d="M19 39h23M38 49h10" stroke="currentColor" stroke-width="2"/>',
        '<rect x="40" y="51" width="18" height="11" rx="3" fill="#ffd400" stroke="currentColor" stroke-width="2.8"/>'
      ],
      vowels: [
        '<circle cx="18" cy="20" r="9" fill="#ffd400"/>',
        '<circle cx="40" cy="18" r="9" fill="#dceaff"/>',
        '<circle cx="23" cy="42" r="9" fill="#dceaff"/>',
        '<circle cx="46" cy="40" r="9" fill="#ffd400"/>',
        '<circle cx="35" cy="55" r="7" fill="#fff"/>',
        '<g fill="currentColor" stroke="none" font-family="Montserrat,Arial,sans-serif" font-size="11" font-weight="900" text-anchor="middle"><text x="18" y="24">A</text><text x="40" y="22">E</text><text x="23" y="46">I</text><text x="46" y="44">O</text><text x="35" y="59">U</text></g>'
      ],
      consonants: [
        '<rect x="8" y="15" width="19" height="19" rx="5" fill="#dceaff"/>',
        '<rect x="36" y="10" width="19" height="19" rx="5" fill="#ffd400"/>',
        '<rect x="23" y="39" width="19" height="19" rx="5" fill="#dceaff"/>',
        '<g fill="currentColor" stroke="none" font-family="Montserrat,Arial,sans-serif" font-size="13" font-weight="900" text-anchor="middle"><text x="17.5" y="29">B</text><text x="45.5" y="24">C</text><text x="32.5" y="53">D</text></g>',
        '<path d="M31 13h4M29 19h4" stroke="#d1273f" stroke-width="2.4"/>'
      ],
      first: [
        '<path d="M8 45h12M25 45h12M42 45h12"/>',
        '<rect x="7" y="20" width="14" height="19" rx="4" fill="#ffd400"/>',
        '<text x="14" y="34" fill="currentColor" stroke="none" font-family="Montserrat,Arial,sans-serif" font-size="13" font-weight="900" text-anchor="middle">A</text>',
        '<path d="M14 6v9M10 11l4 4 4-4" stroke="#d1273f" stroke-width="3"/>'
      ],
      half: [
        '<rect x="7" y="18" width="50" height="34" rx="7" fill="#dceaff"/>',
        '<g fill="#fff" stroke="currentColor" stroke-width="1.5"><rect x="12" y="24" width="8" height="7" rx="2"/><rect x="23" y="24" width="8" height="7" rx="2"/><rect x="34" y="24" width="8" height="7" rx="2"/><rect x="45" y="24" width="8" height="7" rx="2"/><rect x="12" y="35" width="8" height="7" rx="2"/><rect x="23" y="35" width="8" height="7" rx="2"/><rect x="34" y="35" width="8" height="7" rx="2"/><rect x="45" y="35" width="8" height="7" rx="2"/></g>',
        '<path d="m12 24 8 7m0-7-8 7m22 4 8 7m0-7-8 7" stroke="#d1273f" stroke-width="2.5"/>',
        '<circle cx="49" cy="15" r="11" fill="#ffd400"/>',
        '<text x="49" y="19" fill="currentColor" stroke="none" font-family="Montserrat,Arial,sans-serif" font-size="11" font-weight="900" text-anchor="middle">½</text>'
      ]
    };
    var drawing = drawings[kind] || drawings.reveal;
    return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">' + drawing.join('') + '</svg>';
  }

  function openHelpExplanation(icon, label, description) {
    if (!ui) return;
    closeHelpExplanation();

    var overlay = document.createElement('div');
    overlay.className = 'hangman-help-explanation-overlay';
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) closeHelpExplanation();
    });

    var dialog = document.createElement('div');
    dialog.className = 'hangman-help-explanation';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', 'Explicação da ajuda ' + label);

    var iconEl = document.createElement('span');
    iconEl.className = 'hangman-help-explanation-icon';
    iconEl.setAttribute('aria-hidden', 'true');
    iconEl.innerHTML = getHelpIcon(icon);
    dialog.appendChild(iconEl);

    var title = document.createElement('h4');
    title.textContent = label;
    dialog.appendChild(title);

    var text = document.createElement('p');
    text.textContent = description;
    dialog.appendChild(text);

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'hangman-help-explanation-close';
    close.textContent = 'Entendi';
    close.addEventListener('click', closeHelpExplanation);
    dialog.appendChild(close);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    ui.helpExplanationOverlay = overlay;
    close.focus({ preventScroll: true });
  }

  function markHelpUsedAndClose() {
    helpChoiceUsed = true;
    closeHelpModal();
    updateHelpButtonsState();
  }

  function openHelpModal() {
    if (!ui || !round || guessInProgress || ui.gameOver || helpChoiceUsed) return;
    closeHelpModal();

    var hiddenCorrect = getHiddenCorrectLetters();
    var firstLetter = (round.normalizedWord || '')[0];
    var firstLetterAlready = firstLetter ? usedLetters.has(firstLetter) : true;
    var lastChanceCandidates = getWrongLetterCandidates();
    var isLastChance = errorCount === 5;

    var overlay = document.createElement('div');
    overlay.className = 'hangman-help-modal-overlay';
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) closeHelpModal();
    });

    var modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'hangman-help-modal-title');
    modal.className = 'hangman-help-modal';

    var title = document.createElement('h3');
    title.id = 'hangman-help-modal-title';
    title.textContent = 'Escolha uma ajuda';
    modal.appendChild(title);

    var subtitle = document.createElement('p');
    subtitle.textContent = 'Toque no cartão para usar. “Como funciona” abre a explicação. Só vale uma ajuda por palavra.';
    modal.appendChild(subtitle);

    var helpGrid = document.createElement('div');
    helpGrid.className = 'hangman-help-options-grid';
    modal.appendChild(helpGrid);

    /* O cartão possui dois alvos independentes: a área grande aplica a ajuda
       imediatamente; o rodapé abre uma explicação sem consumir a ajuda. */
    function addOption(icon, label, description, disabled, onClick) {
      var wrap = document.createElement('div');
      wrap.className = 'hangman-help-option-wrap' + (disabled ? ' is-disabled' : '');

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hangman-help-option';
      btn.disabled = !!disabled;
      btn.setAttribute('aria-label', 'Usar ajuda: ' + label);

      var iconEl = document.createElement('span');
      iconEl.className = 'hangman-help-option-icon';
      iconEl.setAttribute('aria-hidden', 'true');
      iconEl.innerHTML = getHelpIcon(icon);
      btn.appendChild(iconEl);

      var labelEl = document.createElement('span');
      labelEl.className = 'hangman-help-option-label';
      labelEl.textContent = label;
      btn.appendChild(labelEl);

      btn.addEventListener('click', function (event) {
        event.stopPropagation();
        if (disabled) return;
        onClick();
        markHelpUsedAndClose();
      });

      var infoBtn = document.createElement('button');
      infoBtn.type = 'button';
      infoBtn.className = 'hangman-help-option-info';
      infoBtn.textContent = 'Como funciona';
      infoBtn.setAttribute('aria-label', 'Explicar ajuda: ' + label);
      infoBtn.addEventListener('click', function (event) {
        event.stopPropagation();
        openHelpExplanation(icon, label, description);
      });

      wrap.appendChild(btn);
      wrap.appendChild(infoBtn);
      helpGrid.appendChild(wrap);
    }

    addOption('reveal', 'Revelar uma letra certa', 'Mostra de graça uma das letras que ainda faltam na palavra, escolhida aleatoriamente.', hiddenCorrect.length === 0, function () {
      var letter = hiddenCorrect[Math.floor(Math.random() * hiddenCorrect.length)];
      if (letter) revealLetterEverywhere(letter);
    });

    addOption('forgive', 'Perdoar um erro', 'Desfaz um dos seus erros, afastando o boneco de ser enforcado.', errorCount === 0, function () {
      if (errorCount > 0) {
        errorCount -= 1;
        if (window.HangmanAnimation && window.HangmanAnimation.celebratePieces) {
          window.HangmanAnimation.celebratePieces();
        }
      }
    });

    addOption('vowels', 'Quantidade de vogais', 'Mostra quantas vogais (A, E, I, O, U) essa palavra tem.', false, function () {
      var counts = countVowelsConsonants();
      showSpeechBubble('Essa palavra tem ' + counts.vowels + ' vogal' + (counts.vowels === 1 ? '' : 'is') + '!');
    });

    addOption('consonants', 'Quantidade de consoantes', 'Mostra quantas consoantes essa palavra tem.', false, function () {
      var counts = countVowelsConsonants();
      showSpeechBubble('Essa palavra tem ' + counts.consonants + ' consoante' + (counts.consonants === 1 ? '' : 's') + '!');
    });

    addOption('first', 'Revelar a primeira letra', 'Mostra de graça a primeira letra da palavra.', firstLetterAlready, function () {
      if (firstLetter) revealLetterEverywhere(firstLetter);
    });

    addOption('half', 'Remover 50% das teclas erradas', 'Some com metade das letras erradas do teclado. Só pode ser usada na última chance (quando só falta um erro pra perder).', !isLastChance || lastChanceCandidates.length === 0, function () {
      var half = Math.ceil(lastChanceCandidates.length / 2);
      var shuffled = lastChanceCandidates.slice().sort(function () { return Math.random() - 0.5; });
      shuffled.slice(0, half).forEach(function (letter) {
        usedLetters.set(letter, 'wrong');
        if (ui) {
          ui.root.querySelectorAll('[data-game-letter="' + letter + '"]').forEach(function (key) {
            key.classList.add('is-eliminated', 'is-used');
            if (key.tagName === 'BUTTON') key.disabled = true;
          });
        }
      });
    });

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'hangman-help-modal-close';
    closeBtn.textContent = 'Fechar sem usar ajuda';
    closeBtn.addEventListener('click', function (event) {
      event.stopPropagation();
      closeHelpModal();
    });
    modal.appendChild(closeBtn);

    overlay.appendChild(modal);
    /* Igual ao teclado: fica no <body> (nunca dentro da camera com
       transform do GSAP, senao o position:fixed quebra e o overlay so
       cobre um pedaco da tela) e usa a mesma classe de desfoque do fundo. */
    document.body.appendChild(overlay);
    document.body.classList.add('hangman-help-open');
    ui.helpModalOverlay = overlay;
    var firstAvailableHelp = modal.querySelector('.hangman-help-option:not(:disabled)');
    if (firstAvailableHelp) firstAvailableHelp.focus({ preventScroll: true });
  }

  function buildUi() {
    destroyUi();
    ensureStyles();
    var root = document.createElement('div');
    root.id = 'hangman-gameplay-ui';
    root.style.setProperty('--hangman-camera-compensation', getCameraCompensation() + 'px');
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
    var baseHintText = round.hint || 'Descubra a palavra';
    var hintText = document.createElement('span');
    hintText.className = 'hangman-game-hint-text';
    hintText.textContent = baseHintText;
    hint.appendChild(hintText);

    /* Dicas extras opcionais: um botao vermelho "+1" (estilo caneta
       permanente) no canto da pilula. No primeiro clique, mostra a
       proxima dica disponivel e o botao vira duas setas em circulo; a
       partir dai cada clique percorre em ciclo todas as dicas que a
       palavra sorteada tiver (2 ou 3 - nem toda palavra do banco reserva
       offline tem todas). */
    var extraHints = [round.hint2, round.hint3].filter(function (value) {
      return typeof value === 'string' && value.trim();
    });
    if (extraHints.length) {
      var hintCycle = [baseHintText].concat(extraHints);
      var hintCycleIndex = 0;
      var hudOffsetY = 0;
      var hint2Toggle = document.createElement('button');
      hint2Toggle.type = 'button';
      hint2Toggle.className = 'hangman-hint2-toggle';
      hint2Toggle.setAttribute('aria-label', 'Trocar de dica');
      hint2Toggle.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M4 12a8 8 0 0 1 13.65-5.65M20 4v5h-5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M20 12a8 8 0 0 1-13.65 5.65M4 20v-5h5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>';

      hint2Toggle.addEventListener('click', function (event) {
        event.stopPropagation();
        var heightBefore = hint.getBoundingClientRect().height;
        hintCycleIndex = (hintCycleIndex + 1) % hintCycle.length;
        hintText.textContent = hintCycle[hintCycleIndex];
        /* A pilula (e o proprio botao vermelho, que fica ancorado nela)
           nao pode se mexer por cima quando o texto muda de tamanho -- so
           a base da pilula deve crescer/encolher. Como o grupo inteiro
           (.hangman-game-hud) fica ancorado pelo "bottom", crescer a
           pilula empurra tudo pra cima; aqui compensamos deslocando o hud
           pra baixo na mesma medida, cancelando o movimento no topo. */
        var heightAfter = hint.getBoundingClientRect().height;
        var delta = heightAfter - heightBefore;
        if (delta && window.gsap) {
          hudOffsetY += delta;
          window.gsap.set(hud, { y: hudOffsetY });
        }
      });
      hint.appendChild(hint2Toggle);
    }

    /* Segundo botao de ajuda: elimina uma letra errada do teclado (marca
       como usada/errada, sem contar como erro real), ate 3 vezes por
       rodada. Fica logo abaixo do botao vermelho. */
    var eliminateToggle = document.createElement('button');
    eliminateToggle.type = 'button';
    eliminateToggle.className = 'hangman-help-toggle hangman-help-eliminate';
    eliminateToggle.setAttribute('aria-label', 'Eliminar uma letra errada do teclado');
    eliminateToggle.textContent = 'X3';
    eliminateToggle.addEventListener('click', function (event) {
      event.stopPropagation();
      eliminateWrongLetterHelper();
      updateHelpButtonsState();
    });
    hint.appendChild(eliminateToggle);

    /* Terceiro botao de ajuda: abre um modal com varias ajudas, das
       quais o jogador so pode escolher UMA por rodada. */
    var helpMenuToggle = document.createElement('button');
    helpMenuToggle.type = 'button';
    helpMenuToggle.className = 'hangman-help-toggle hangman-help-menu';
    helpMenuToggle.setAttribute('aria-label', 'Abrir menu de ajudas');
    helpMenuToggle.textContent = '?';
    helpMenuToggle.addEventListener('click', function (event) {
      event.stopPropagation();
      openHelpModal();
    });
    hint.appendChild(helpMenuToggle);

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
    (getPageCamera() || document.body).appendChild(root);
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
      gameOver: false,
      hintText: hintText,
      eliminateToggle: eliminateToggle,
      helpMenuToggle: helpMenuToggle
    };

    usedLetters.forEach(function (result, letter) {
      syncLetterState(letter, result);
    });
    updateHelpButtonsState();
  }

  function createFlyer(letter, center, wrong) {
    var flyer = document.createElement('div');
    flyer.className = 'hangman-flying-letter' + (wrong ? ' is-wrong' : '');
    flyer.textContent = letter;
    var effectsRect = ui && ui.effects ? ui.effects.getBoundingClientRect() : { left: 0, top: 0 };
    flyer.style.left = (center.x - effectsRect.left) + 'px';
    flyer.style.top = (center.y - effectsRect.top) + 'px';
    flyer.style.transform = 'translate(-50%,-50%)';
    (ui && ui.effects ? ui.effects : document.body).appendChild(flyer);
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
      var effectsRect = ui.effects.getBoundingClientRect();
      particle.style.left = (center.x - effectsRect.left) + 'px';
      particle.style.top = (center.y - effectsRect.top) + 'px';
      particle.style.background = colors[i % colors.length];
      ui.effects.appendChild(particle);
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
    if (window.HangmanAnimation && window.HangmanAnimation.unlockScroll) window.HangmanAnimation.unlockScroll();
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
    if (window.HangmanAnimation && window.HangmanAnimation.unlockScroll) window.HangmanAnimation.unlockScroll();
    showFinalStatus('Dá tempo de revisar pro ENEM. Continue estudando.');
    revealMissingLetters();
    scheduleRoundEnd();
  }

  function flyCorrectLetter(letter, sourceCenter, slots, index) {
    if (!ui || !window.gsap) return;
    if (index >= slots.length) {
      guessInProgress = false;
      updateHelpButtonsState();
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
      updateHelpButtonsState();
      if (errorCount >= 6) finishLoss();
    }));
  }

  function chooseLetter(letter, sourceKey) {
    if (!ui || !round || guessInProgress || ui.gameOver || helpEliminateBusy || usedLetters.has(letter)) return;
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
    if (event.key === 'Escape' && ui.helpExplanationOverlay) {
      closeHelpExplanation();
      return;
    }
    if (event.key === 'Escape' && ui.helpModalOverlay) {
      closeHelpModal();
      return;
    }
    if (helpEliminateBusy) {
      if (/^[a-zA-Z]$/.test(String(event.key || ''))) event.preventDefault();
      return;
    }
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
