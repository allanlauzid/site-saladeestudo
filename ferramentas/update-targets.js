const fs = require('fs');

const hangmanJS = fs.readFileSync('hangman-animation.js', 'utf-8');

const CENTERS = {
  "head": { cx: 59.780, cy: 11.782 },
  "torso": { cx: 39.854, cy: 35.878 },
  "arm-left": { cx: 75.743, cy: 33.832 },
  "arm-right": { cx: 30.079, cy: 15.140 },
  "leg-left": { cx: 35.874, cy: 60.076 },
  "leg-right": { cx: 48.557, cy: 57.348 }
};

const DEFAULT_ANCHORS = {
  head: { x: 59.78, y: 11.78 },
  torso: { x: 45.2, y: 22.2 },
  'arm-left': { x: 61.0, y: 30.0 },
  'arm-right': { x: 28.0, y: 17.0 },
  'leg-left': { x: 52.0, y: 48.0 },
  'leg-right': { x: 52.0, y: 39.0 }
};

// Scene position of the rope where the piece is attached
const ROPE_X = 290 + 215; // 290 is scene X, + TRAVEL_X (215) = 505
const ROPE_Y = -15;

function getNewTarget(pieceId, oldTarget, isAttached) {
  const cx = CENTERS[pieceId].cx;
  const cy = CENTERS[pieceId].cy;
  const sx = oldTarget.scaleX !== undefined ? oldTarget.scaleX : 1;
  const sy = oldTarget.scaleY !== undefined ? oldTarget.scaleY : 1;
  const r = oldTarget.rotation * Math.PI / 180;

  if (isAttached) {
    // Reverse engineer the local anchor from the rope position
    const Sx = ROPE_X;
    const Sy = ROPE_Y;
    const dx3 = Sx - oldTarget.x;
    const dy3 = Sy - oldTarget.y;

    // Un-rotate:
    // dx3 = dx2 * cosR - dy2 * sinR
    // dy3 = dx2 * sinR + dy2 * cosR
    // => dx2 = dx3 * cosR + dy3 * sinR
    // => dy2 = -dx3 * sinR + dy3 * cosR
    const dx2 = dx3 * Math.cos(r) + dy3 * Math.sin(r);
    const dy2 = -dx3 * Math.sin(r) + dy3 * Math.cos(r);

    // Un-scale:
    const dx1 = dx2 / sx;
    const dy1 = dy2 / sy;

    // Un-translate:
    const anchorX = +(dx1 + cx).toFixed(3);
    const anchorY = +(dy1 + cy).toFixed(3);

    return {
      x: ROPE_X,
      y: ROPE_Y,
      rotation: oldTarget.rotation,
      scaleX: oldTarget.scaleX,
      scaleY: oldTarget.scaleY,
      localAnchor: { x: anchorX, y: anchorY }
    };
  } else {
    // Use default anchor, compute new target
    const Ax = DEFAULT_ANCHORS[pieceId].x;
    const Ay = DEFAULT_ANCHORS[pieceId].y;

    const dx1 = Ax - cx;
    const dy1 = Ay - cy;

    const dx2 = dx1 * sx;
    const dy2 = dy1 * sy;

    const dx3 = dx2 * Math.cos(r) - dy2 * Math.sin(r);
    const dy3 = dx2 * Math.sin(r) + dy2 * Math.cos(r);

    const nx = +(oldTarget.x + dx3).toFixed(3);
    const ny = +(oldTarget.y + dy3).toFixed(3);

    return {
      x: nx,
      y: ny,
      rotation: oldTarget.rotation,
      scaleX: oldTarget.scaleX,
      scaleY: oldTarget.scaleY,
      localAnchor: { x: Ax, y: Ay }
    };
  }
}

let modifiedJS = hangmanJS;

// Find the GALLOWS_POSES block
const posesRegex = /var GALLOWS_POSES = (\[[\s\S]*?\]);\s*var activeGallowsPose/m;
const posesMatch = posesRegex.exec(hangmanJS);

if (posesMatch) {
  let posesStr = posesMatch[1];
  // Using eval to parse the array of objects, since it's valid JS (not strictly JSON)
  const poses = eval('(' + posesStr + ')');
  
  poses.forEach(pose => {
    Object.keys(pose.targets).forEach(pieceId => {
      const isAttached = (pieceId === pose.attachedPiece);
      pose.targets[pieceId] = getNewTarget(pieceId, pose.targets[pieceId], isAttached);
      // Ensure scaleX and scaleY are deleted if 1, to keep it clean like original?
      // No, keep them if they exist in original. But if they are exactly 1, we can remove them if we want.
      // But keeping them is fine.
      if (pose.targets[pieceId].scaleX === 1) delete pose.targets[pieceId].scaleX;
      if (pose.targets[pieceId].scaleY === 1) delete pose.targets[pieceId].scaleY;
    });
  });

  // Convert back to string
  const newPosesStr = JSON.stringify(poses, null, 2)
    .replace(/"([^"]+)":/g, "'$1':") // wrap keys in single quotes
    .replace(/\n/g, '\n  ');

  modifiedJS = modifiedJS.replace(posesStr, newPosesStr);
}

// Now replace logic in movePieceToGallows
const oldLogic = `    var box = state.piece.getBBox();
    var center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    state.transformOrigin = center.x + 'px ' + center.y + 'px';
    var tween = gsap.to(state, {
      baseX: target.x - TRAVEL_X - center.x,
      baseY: target.y - center.y,`;

const newLogic = `    var localAnchor = target.localAnchor || { x: 0, y: 0 };
    state.transformOrigin = localAnchor.x + 'px ' + localAnchor.y + 'px';
    var tween = gsap.to(state, {
      baseX: target.x - TRAVEL_X - localAnchor.x,
      baseY: target.y - localAnchor.y,`;

modifiedJS = modifiedJS.replace(oldLogic, newLogic);

fs.writeFileSync('hangman-animation.js', modifiedJS);
console.log("Updated hangman-animation.js");
