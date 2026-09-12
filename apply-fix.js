const fs = require('fs');

let js = fs.readFileSync('hangman-animation.js', 'utf-8');

// Replace transformOrigin usage with svgOrigin in movePieceToGallows
const oldLogic1 = `    var localAnchor = target.localAnchor || { x: 0, y: 0 };
    state.transformOrigin = localAnchor.x + 'px ' + localAnchor.y + 'px';
    var tween = gsap.to(state, {
      baseX: target.x - TRAVEL_X - localAnchor.x,
      baseY: target.y - localAnchor.y,`;

const newLogic1 = `    var localAnchor = target.localAnchor || { x: 0, y: 0 };
    state.svgOrigin = localAnchor.x + ' ' + localAnchor.y;
    var tween = gsap.to(state, {
      baseX: target.x - TRAVEL_X - localAnchor.x,
      baseY: target.y - localAnchor.y,`;

js = js.replace(oldLogic1, newLogic1);

const oldLogic2 = `          scaleY: state.scaleY,
          transformOrigin: state.transformOrigin
        });`;

const newLogic2 = `          scaleY: state.scaleY,
          svgOrigin: state.svgOrigin
        });`;

js = js.replace(oldLogic2, newLogic2);

// And we need to fix the first gsap.set call in fearAndHangPiece, before the tween!
const oldLogic3 = `    gsap.set(state.piece, {
      x: startX,
      y: startY,
      rotation: state.rotation,
      scaleX: target.scaleX === undefined ? 1 : target.scaleX,
      scaleY: target.scaleY === undefined ? 1 : target.scaleY,
      transformOrigin: state.transformOrigin
    });`;

const newLogic3 = `    gsap.set(state.piece, {
      x: startX,
      y: startY,
      rotation: state.rotation,
      scaleX: target.scaleX === undefined ? 1 : target.scaleX,
      scaleY: target.scaleY === undefined ? 1 : target.scaleY,
      svgOrigin: state.svgOrigin
    });`;

js = js.replace(oldLogic3, newLogic3);

fs.writeFileSync('hangman-animation.js', js);
console.log("Applied svgOrigin fix");
