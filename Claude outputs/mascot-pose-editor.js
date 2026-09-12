(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var STORAGE_KEY = 'sala-estudo-mascot-pose-editor-v1';
  var BLUE = '#0055d4';

  var PARTS = {
    head:            { label: 'Cabeça', color: '#7a5af8', kind: 'head' },
    torso:           { label: 'Tronco', color: '#0055d4', kind: 'torso' },
    'left-upper-arm':{ label: 'Braço esq.', color: '#f04438', kind: 'segment', start: 'torsoSL', end: 'leftElbow', control: 'leftUpperControl' },
    'left-forearm':  { label: 'Antebraço esq.', color: '#f79009', kind: 'segment', start: 'leftElbow', end: 'leftHand', control: 'leftLowerControl' },
    'right-upper-arm':{ label: 'Braço dir.', color: '#12b76a', kind: 'segment', start: 'torsoSR', end: 'rightElbow', control: 'rightUpperControl' },
    'right-forearm': { label: 'Antebraço dir.', color: '#06aed5', kind: 'segment', start: 'rightElbow', end: 'rightHand', control: 'rightLowerControl' },
    'left-thigh':    { label: 'Coxa esq.', color: '#ee46bc', kind: 'segment', start: 'torsoHL', end: 'leftKnee', control: 'leftThighControl' },
    'left-shin':     { label: 'Canela esq.', color: '#6172f3', kind: 'segment', start: 'leftKnee', end: 'leftFoot', control: 'leftShinControl' },
    'right-thigh':   { label: 'Coxa dir.', color: '#b54708', kind: 'segment', start: 'torsoHR', end: 'rightKnee', control: 'rightThighControl' },
    'right-shin':    { label: 'Canela dir.', color: '#039855', kind: 'segment', start: 'rightKnee', end: 'rightFoot', control: 'rightShinControl' }
  };

  var POINT_LABELS = {
    headCenter: 'Centro da cabeça',
    torsoSL: 'Ombro esquerdo', torsoSR: 'Ombro direito',
    torsoWL: 'Cintura esquerda', torsoWR: 'Cintura direita',
    torsoHL: 'Quadril esquerdo', torsoHR: 'Quadril direito',
    leftElbow: 'Cotovelo esquerdo', leftHand: 'Mão esquerda',
    rightElbow: 'Cotovelo direito', rightHand: 'Mão direita',
    leftKnee: 'Joelho esquerdo', leftFoot: 'Pé esquerdo',
    rightKnee: 'Joelho direito', rightFoot: 'Pé direito',
    leftUpperControl: 'Curva do braço esquerdo', leftLowerControl: 'Curva do antebraço esquerdo',
    rightUpperControl: 'Curva do braço direito', rightLowerControl: 'Curva do antebraço direito',
    leftThighControl: 'Curva da coxa esquerda', leftShinControl: 'Curva da canela esquerda',
    rightThighControl: 'Curva da coxa direita', rightShinControl: 'Curva da canela direita'
  };

  var POINT_PART = {
    torsoSL: 'torso', torsoSR: 'torso', torsoWL: 'torso', torsoWR: 'torso', torsoHL: 'torso', torsoHR: 'torso',
    leftElbow: 'left-upper-arm', leftHand: 'left-forearm', rightElbow: 'right-upper-arm', rightHand: 'right-forearm',
    leftKnee: 'left-thigh', leftFoot: 'left-shin', rightKnee: 'right-thigh', rightFoot: 'right-shin',
    leftUpperControl: 'left-upper-arm', leftLowerControl: 'left-forearm',
    rightUpperControl: 'right-upper-arm', rightLowerControl: 'right-forearm',
    leftThighControl: 'left-thigh', leftShinControl: 'left-shin',
    rightThighControl: 'right-thigh', rightShinControl: 'right-shin',
    headCenter: 'head'
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function midpoint(a, b, offsetX, offsetY) {
    return [(a[0] + b[0]) / 2 + (offsetX || 0), (a[1] + b[1]) / 2 + (offsetY || 0)];
  }

  function createPose(name, points, head, widths) {
    return {
      name: name,
      points: points,
      head: head,
      widths: Object.assign({
        'left-upper-arm': 4.8, 'left-forearm': 4.2,
        'right-upper-arm': 4.8, 'right-forearm': 4.2,
        'left-thigh': 6.2, 'left-shin': 5.2,
        'right-thigh': 6.2, 'right-shin': 5.2
      }, widths || {})
    };
  }

  function addControls(points, bends) {
    points.leftUpperControl = midpoint(points.torsoSL, points.leftElbow, bends.lux, bends.luy);
    points.leftLowerControl = midpoint(points.leftElbow, points.leftHand, bends.llx, bends.lly);
    points.rightUpperControl = midpoint(points.torsoSR, points.rightElbow, bends.rux, bends.ruy);
    points.rightLowerControl = midpoint(points.rightElbow, points.rightHand, bends.rlx, bends.rly);
    points.leftThighControl = midpoint(points.torsoHL, points.leftKnee, bends.ltx, bends.lty);
    points.leftShinControl = midpoint(points.leftKnee, points.leftFoot, bends.lsx, bends.lsy);
    points.rightThighControl = midpoint(points.torsoHR, points.rightKnee, bends.rtx, bends.rty);
    points.rightShinControl = midpoint(points.rightKnee, points.rightFoot, bends.rsx, bends.rsy);
    return points;
  }

  function seatedPose() {
    var points = {
      headCenter: [27, 6],
      torsoSL: [27.4, 16.9], torsoSR: [34.1, 17.2],
      torsoWL: [32.5, 27.1], torsoWR: [41.2, 27.2],
      torsoHL: [36.8, 38.6], torsoHR: [46.4, 39],
      leftElbow: [18.5, 24.5], leftHand: [9, 20],
      rightElbow: [19.3, 25.1], rightHand: [9.7, 20.8],
      leftKnee: [19, 39], leftFoot: [19, 58],
      rightKnee: [20, 40], rightFoot: [20.2, 58]
    };
    addControls(points, { lux: 0, luy: -1.2, llx: -.4, lly: .8, rux: .2, ruy: -.5, rlx: 0, rly: .8, ltx: 0, lty: 2, lsx: 0, lsy: 0, rtx: 0, rty: 1.4, rsx: .2, rsy: 0 });
    return createPose('Original sentado', points, { rx: 5.2, ry: 5.2 });
  }

  function standingPose() {
    var points = {
      headCenter: [42, 7],
      torsoSL: [37.7, 13.5], torsoSR: [46.3, 13.5],
      torsoWL: [38.2, 24], torsoWR: [45.8, 24],
      torsoHL: [36.9, 35], torsoHR: [47.1, 35],
      leftElbow: [34.5, 27], leftHand: [33, 40],
      rightElbow: [49.5, 27], rightHand: [51, 40],
      leftKnee: [36.5, 48], leftFoot: [35, 60],
      rightKnee: [47.5, 48], rightFoot: [49, 60]
    };
    addControls(points, { lux: -1, luy: 0, llx: -.5, lly: 0, rux: 1, ruy: 0, rlx: .5, rly: 0, ltx: -1, lty: 0, lsx: -.4, lsy: 0, rtx: 1, rty: 0, rsx: .4, rsy: 0 });
    return createPose('Em pé', points, { rx: 5.2, ry: 5.2 });
  }

  function stridePose(leftForward) {
    var pose = standingPose();
    pose.name = leftForward ? 'Passada esquerda' : 'Passada direita';
    pose.points.headCenter[1] = 7.7;
    if (leftForward) {
      pose.points.leftElbow = [48.5, 25.5]; pose.points.leftHand = [50.5, 37];
      pose.points.rightElbow = [35.5, 25.5]; pose.points.rightHand = [33.5, 37];
      pose.points.leftKnee = [36.5, 47.5]; pose.points.leftFoot = [31.5, 59];
      pose.points.rightKnee = [47.5, 48]; pose.points.rightFoot = [50, 59];
    } else {
      pose.points.leftElbow = [35.5, 25.5]; pose.points.leftHand = [33.5, 37];
      pose.points.rightElbow = [48.5, 25.5]; pose.points.rightHand = [50.5, 37];
      pose.points.leftKnee = [47.5, 48]; pose.points.leftFoot = [50, 59];
      pose.points.rightKnee = [36.5, 47.5]; pose.points.rightFoot = [31.5, 59];
    }
    addControls(pose.points, { lux: 0, luy: 0, llx: 0, lly: 0, rux: 0, ruy: 0, rlx: 0, rly: 0, ltx: 0, lty: 0, lsx: 0, lsy: 0, rtx: 0, rty: 0, rsx: 0, rsy: 0 });
    return pose;
  }

  var PRESETS = [
    { id: 'seated', pose: seatedPose() },
    { id: 'standing', pose: standingPose() },
    { id: 'stride-left', pose: stridePose(true) },
    { id: 'stride-right', pose: stridePose(false) }
  ];

  var svg = document.getElementById('pose-canvas');
  var modelLayer = document.getElementById('model-layer');
  var handlesLayer = document.getElementById('handles-layer');
  var referenceLayer = document.getElementById('reference-layer');
  var currentPose = clone(PRESETS[0].pose);
  ensurePoseGeometry(currentPose);
  var basePose = clone(currentPose);
  var customPoses = [];
  var selectedPart = null;
  var selectedPoint = null;
  var selectedCustomId = null;
  var multicolor = false;
  var handlesVisible = true;
  var contoursVisible = true;
  var referenceVisible = true;
  var dragging = null;
  var undoStack = [];
  var redoStack = [];
  var saveTimer = null;
  var toastTimer = null;

  function q(value) { return Number(value.toFixed(3)); }
  function average(values) { return values.reduce(function (sum, value) { return sum + Number(value); }, 0) / values.length; }

  function ensurePoseGeometry(pose) {
    pose.contours = pose.contours || {};
    Object.keys(PARTS).forEach(function (partId) {
      var part = PARTS[partId];
      if (part.kind !== 'segment' || pose.contours[partId]) return;
      var half = Number(pose.widths[partId] || 4) / 2;
      pose.contours[partId] = { left: [half, half, half, half], right: [half, half, half, half] };
    });
    pose.head.contour = pose.head.contour || [1, 1, 1, 1, 1, 1, 1, 1];
    var p = pose.points;
    if (!p.torsoUpperL) p.torsoUpperL = midpoint(p.torsoSL, p.torsoWL);
    if (!p.torsoLowerL) p.torsoLowerL = midpoint(p.torsoWL, p.torsoHL);
    if (!p.torsoLowerR) p.torsoLowerR = midpoint(p.torsoHR, p.torsoWR);
    if (!p.torsoUpperR) p.torsoUpperR = midpoint(p.torsoWR, p.torsoSR);
  }

  POINT_LABELS.torsoUpperL = 'Contorno superior esquerdo do tronco';
  POINT_LABELS.torsoLowerL = 'Contorno inferior esquerdo do tronco';
  POINT_LABELS.torsoLowerR = 'Contorno inferior direito do tronco';
  POINT_LABELS.torsoUpperR = 'Contorno superior direito do tronco';
  POINT_PART.torsoUpperL = POINT_PART.torsoLowerL = POINT_PART.torsoLowerR = POINT_PART.torsoUpperR = 'torso';

  function quadraticFrame(partId, t) {
    var part = PARTS[partId];
    var a = currentPose.points[part.start], c = currentPose.points[part.control], b = currentPose.points[part.end];
    var mt = 1 - t;
    var point = [mt * mt * a[0] + 2 * mt * t * c[0] + t * t * b[0], mt * mt * a[1] + 2 * mt * t * c[1] + t * t * b[1]];
    var dx = 2 * mt * (c[0] - a[0]) + 2 * t * (b[0] - c[0]);
    var dy = 2 * mt * (c[1] - a[1]) + 2 * t * (b[1] - c[1]);
    var length = Math.hypot(dx, dy) || 1;
    return { point: point, normal: [-dy / length, dx / length] };
  }

  function segmentOutlinePoints(partId) {
    ensurePoseGeometry(currentPose);
    var shape = currentPose.contours[partId];
    var ts = [0, .333, .667, 1];
    var left = ts.map(function (t, index) {
      var frame = quadraticFrame(partId, t);
      return [q(frame.point[0] + frame.normal[0] * shape.left[index]), q(frame.point[1] + frame.normal[1] * shape.left[index])];
    });
    var right = ts.map(function (t, index) {
      var frame = quadraticFrame(partId, t);
      return [q(frame.point[0] - frame.normal[0] * shape.right[index]), q(frame.point[1] - frame.normal[1] * shape.right[index])];
    });
    return left.concat(right.reverse());
  }

  function headOutlinePoints() {
    ensurePoseGeometry(currentPose);
    var h = currentPose.points.headCenter;
    return currentPose.head.contour.map(function (scale, index) {
      var angle = -Math.PI / 2 + index * Math.PI / 4;
      return [q(h[0] + Math.cos(angle) * currentPose.head.rx * scale), q(h[1] + Math.sin(angle) * currentPose.head.ry * scale)];
    });
  }

  function smoothClosedPath(points) {
    var count = points.length;
    if (count < 3) return '';
    var d = ['M', points[0][0], points[0][1]];
    for (var i = 0; i < count; i += 1) {
      var p0 = points[(i - 1 + count) % count], p1 = points[i], p2 = points[(i + 1) % count], p3 = points[(i + 2) % count];
      d.push('C', q(p1[0] + (p2[0] - p0[0]) / 6), q(p1[1] + (p2[1] - p0[1]) / 6), q(p2[0] - (p3[0] - p1[0]) / 6), q(p2[1] - (p3[1] - p1[1]) / 6), p2[0], p2[1]);
    }
    d.push('Z');
    return d.join(' ');
  }

  function segmentPath(partId) {
    var part = PARTS[partId];
    var p = currentPose.points;
    return 'M ' + p[part.start][0] + ' ' + p[part.start][1] + ' Q ' + p[part.control][0] + ' ' + p[part.control][1] + ' ' + p[part.end][0] + ' ' + p[part.end][1];
  }

  function torsoPath() {
    var p = currentPose.points;
    return smoothClosedPath([p.torsoSL, p.torsoUpperL, p.torsoWL, p.torsoLowerL, p.torsoHL, p.torsoHR, p.torsoLowerR, p.torsoWR, p.torsoUpperR, p.torsoSR]);
  }

  function colorFor(partId) {
    return multicolor ? PARTS[partId].color : BLUE;
  }

  function renderModel() {
    Object.keys(PARTS).forEach(function (partId) {
      var part = PARTS[partId];
      var element = document.getElementById('part-' + partId);
      var color = colorFor(partId);
      element.classList.toggle('selected', selectedPart === partId);
      if (part.kind === 'segment') {
        element.setAttribute('d', smoothClosedPath(segmentOutlinePoints(partId)));
        element.style.fill = color;
        element.style.stroke = 'none';
      } else if (part.kind === 'torso') {
        element.setAttribute('d', torsoPath());
        element.style.fill = color;
      } else {
        element.setAttribute('d', smoothClosedPath(headOutlinePoints()));
        element.style.fill = color;
      }
    });
  }

  function svgElement(name, attrs) {
    var element = document.createElementNS(SVG_NS, name);
    Object.keys(attrs).forEach(function (key) { element.setAttribute(key, attrs[key]); });
    return element;
  }

  function renderHandles() {
    handlesLayer.innerHTML = '';
    handlesLayer.style.display = handlesVisible ? '' : 'none';
    if (!handlesVisible) return;

    Object.keys(PARTS).forEach(function (partId) {
      var part = PARTS[partId];
      if (part.kind !== 'segment') return;
      var a = currentPose.points[part.start];
      var b = currentPose.points[part.end];
      var c = currentPose.points[part.control];
      handlesLayer.appendChild(svgElement('path', {
        d: 'M ' + a[0] + ' ' + a[1] + ' L ' + c[0] + ' ' + c[1] + ' L ' + b[0] + ' ' + b[1],
        class: 'handle-line'
      }));
    });

    Object.keys(currentPose.points).forEach(function (key) {
      var point = currentPose.points[key];
      var isControl = /Control$/.test(key);
      var element;
      if (isControl) {
        element = svgElement('rect', {
          x: point[0] - .65, y: point[1] - .65, width: 1.3, height: 1.3,
          transform: 'rotate(45 ' + point[0] + ' ' + point[1] + ')',
          class: 'handle curve-handle' + (selectedPoint === key ? ' selected' : ''),
          'data-point': key, 'data-part': POINT_PART[key], tabindex: '0'
        });
      } else {
        element = svgElement('circle', {
          cx: point[0], cy: point[1], r: key === 'headCenter' ? 1.05 : .78,
          class: 'handle joint-handle' + (selectedPoint === key ? ' selected' : ''),
          'data-point': key, 'data-part': POINT_PART[key] || 'torso', tabindex: '0'
        });
      }
      handlesLayer.appendChild(element);
    });

    if (contoursVisible && selectedPart && PARTS[selectedPart]) {
      var selectedDefinition = PARTS[selectedPart];
      if (selectedDefinition.kind === 'segment') {
        var ts = [0, .333, .667, 1];
        ['left', 'right'].forEach(function (side) {
          ts.forEach(function (t, index) {
            var frame = quadraticFrame(selectedPart, t);
            var direction = side === 'left' ? 1 : -1;
            var distance = currentPose.contours[selectedPart][side][index];
            var x = q(frame.point[0] + frame.normal[0] * distance * direction);
            var y = q(frame.point[1] + frame.normal[1] * distance * direction);
            handlesLayer.appendChild(svgElement('circle', {
              cx: x, cy: y, r: .56,
              class: 'handle contour-handle',
              'data-contour-part': selectedPart, 'data-contour-side': side, 'data-contour-index': index,
              'data-part': selectedPart, tabindex: '0'
            }));
          });
        });
      } else if (selectedDefinition.kind === 'head') {
        headOutlinePoints().forEach(function (point, index) {
          handlesLayer.appendChild(svgElement('circle', {
            cx: point[0], cy: point[1], r: .56,
            class: 'handle contour-handle', 'data-head-contour': index,
            'data-part': 'head', tabindex: '0'
          }));
        });
      }
    }

    var hc = currentPose.points.headCenter;
    handlesLayer.appendChild(svgElement('rect', {
      x: hc[0] + currentPose.head.rx - .65, y: hc[1] - .65, width: 1.3, height: 1.3,
      class: 'handle resize-handle', 'data-special': 'head-rx', 'data-part': 'head', tabindex: '0'
    }));
    handlesLayer.appendChild(svgElement('rect', {
      x: hc[0] - .65, y: hc[1] + currentPose.head.ry - .65, width: 1.3, height: 1.3,
      class: 'handle resize-handle', 'data-special': 'head-ry', 'data-part': 'head', tabindex: '0'
    }));
  }

  function renderInspector() {
    var name = document.getElementById('selection-name');
    var color = document.getElementById('selection-color');
    var pointControls = document.getElementById('point-controls');
    var partControls = document.getElementById('part-controls');
    var selectedDefinition = selectedPart ? PARTS[selectedPart] : null;

    if (selectedPoint) {
      name.textContent = POINT_LABELS[selectedPoint] || selectedPoint;
      color.style.background = colorFor(POINT_PART[selectedPoint] || 'torso');
      pointControls.hidden = false;
      document.getElementById('point-x').value = q(currentPose.points[selectedPoint][0]);
      document.getElementById('point-y').value = q(currentPose.points[selectedPoint][1]);
    } else {
      pointControls.hidden = true;
      name.textContent = selectedDefinition ? selectedDefinition.label : 'Nenhuma peça';
      color.style.background = selectedDefinition ? colorFor(selectedPart) : '#cbd5e1';
    }

    if (selectedDefinition && selectedDefinition.kind === 'segment') {
      partControls.hidden = false;
      document.getElementById('part-width').value = currentPose.widths[selectedPart];
      document.getElementById('width-value').value = Number(currentPose.widths[selectedPart]).toFixed(1);
    } else {
      partControls.hidden = true;
    }

    document.querySelectorAll('.part-button').forEach(function (button) {
      button.classList.toggle('selected', button.dataset.part === selectedPart);
    });
  }

  function renderLegend() {
    var legend = document.getElementById('color-legend');
    legend.hidden = !multicolor;
    if (!multicolor) return;
    legend.innerHTML = Object.keys(PARTS).map(function (id) {
      return '<span class="legend-item"><i class="legend-dot" style="background:' + PARTS[id].color + '"></i>' + PARTS[id].label + '</span>';
    }).join('');
  }

  function render() {
    renderModel();
    renderHandles();
    renderInspector();
    renderLegend();
    updateHistoryButtons();
    scheduleDraftSave();
  }

  function selectPart(partId, pointKey) {
    selectedPart = partId;
    selectedPoint = pointKey || null;
    render();
  }

  function pointerToSvg(event) {
    var point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    var transformed = point.matrixTransform(svg.getScreenCTM().inverse());
    return [q(transformed.x), q(transformed.y)];
  }

  function recordHistory() {
    undoStack.push(clone(currentPose));
    if (undoStack.length > 80) undoStack.shift();
    redoStack = [];
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    document.getElementById('undo').disabled = undoStack.length === 0;
    document.getElementById('redo').disabled = redoStack.length === 0;
  }

  function connectedControls(pointKey) {
    var matches = [];
    Object.keys(PARTS).forEach(function (id) {
      var part = PARTS[id];
      if (part.kind === 'segment' && (part.start === pointKey || part.end === pointKey)) matches.push(part.control);
    });
    return matches;
  }

  handlesLayer.addEventListener('pointerdown', function (event) {
    var target = event.target.closest('.handle');
    if (!target) return;
    event.preventDefault();
    recordHistory();
    var key = target.dataset.point || null;
    var special = target.dataset.special || null;
    selectPart(target.dataset.part || POINT_PART[key] || 'torso', key);
    dragging = {
      key: key,
      special: special,
      contourPart: target.dataset.contourPart || null,
      contourSide: target.dataset.contourSide || null,
      contourIndex: target.dataset.contourIndex === undefined ? null : Number(target.dataset.contourIndex),
      headContour: target.dataset.headContour === undefined ? null : Number(target.dataset.headContour),
      pointerId: event.pointerId
    };
    svg.setPointerCapture(event.pointerId);
  });

  svg.addEventListener('pointermove', function (event) {
    var position = pointerToSvg(event);
    document.getElementById('canvas-coordinates').textContent = 'x ' + position[0].toFixed(1) + ' · y ' + position[1].toFixed(1);
    if (!dragging) return;
    if (dragging.key) {
      var old = currentPose.points[dragging.key];
      var dx = position[0] - old[0];
      var dy = position[1] - old[1];
      currentPose.points[dragging.key] = position;
      if (!/Control$/.test(dragging.key)) {
        connectedControls(dragging.key).forEach(function (controlKey) {
          currentPose.points[controlKey][0] = q(currentPose.points[controlKey][0] + dx * .5);
          currentPose.points[controlKey][1] = q(currentPose.points[controlKey][1] + dy * .5);
        });
      }
    } else if (dragging.special === 'head-rx') {
      currentPose.head.rx = Math.max(1.5, q(Math.abs(position[0] - currentPose.points.headCenter[0])));
    } else if (dragging.special === 'head-ry') {
      currentPose.head.ry = Math.max(1.5, q(Math.abs(position[1] - currentPose.points.headCenter[1])));
    } else if (dragging.contourPart) {
      var t = [0, .333, .667, 1][dragging.contourIndex];
      var frame = quadraticFrame(dragging.contourPart, t);
      var vx = position[0] - frame.point[0], vy = position[1] - frame.point[1];
      var projection = vx * frame.normal[0] + vy * frame.normal[1];
      var signed = dragging.contourSide === 'left' ? projection : -projection;
      currentPose.contours[dragging.contourPart][dragging.contourSide][dragging.contourIndex] = Math.max(.25, q(signed));
      currentPose.widths[dragging.contourPart] = q((average(currentPose.contours[dragging.contourPart].left) + average(currentPose.contours[dragging.contourPart].right)));
    } else if (dragging.headContour !== null) {
      var headCenter = currentPose.points.headCenter;
      var angle = -Math.PI / 2 + dragging.headContour * Math.PI / 4;
      var ux = Math.cos(angle), uy = Math.sin(angle);
      var baseX = ux * currentPose.head.rx, baseY = uy * currentPose.head.ry;
      var baseLengthSq = baseX * baseX + baseY * baseY || 1;
      var scale = ((position[0] - headCenter[0]) * baseX + (position[1] - headCenter[1]) * baseY) / baseLengthSq;
      currentPose.head.contour[dragging.headContour] = Math.max(.25, q(scale));
    }
    markDirty();
    render();
  });

  function finishDrag(event) {
    if (!dragging) return;
    if (event && svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    dragging = null;
    markDirty();
  }
  svg.addEventListener('pointerup', finishDrag);
  svg.addEventListener('pointercancel', finishDrag);

  modelLayer.addEventListener('click', function (event) {
    var part = event.target.closest('.editable-part');
    if (part) selectPart(part.dataset.part);
  });

  function markDirty() {
    document.getElementById('save-status').textContent = 'Alterações ainda não salvas';
  }

  function markSaved(message) {
    document.getElementById('save-status').textContent = message || 'Pose salva neste navegador';
  }

  function scheduleDraftSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      persist({ draft: currentPose, customPoses: customPoses });
    }, 180);
  }

  function persist(value) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch (error) { /* ferramenta continua sem persistência */ }
  }

  function restoreStorage() {
    try {
      var stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (stored && Array.isArray(stored.customPoses)) customPoses = stored.customPoses;
    } catch (error) {
      customPoses = [];
    }
  }

  function loadPose(pose, customId) {
    currentPose = clone(pose);
    ensurePoseGeometry(currentPose);
    basePose = clone(pose);
    selectedCustomId = customId || null;
    selectedPart = null;
    selectedPoint = null;
    undoStack = [];
    redoStack = [];
    document.getElementById('pose-name').value = currentPose.name;
    document.getElementById('delete-pose').disabled = !selectedCustomId;
    renderPoseLists();
    render();
    markSaved(customId ? 'Pose salva carregada' : 'Referência carregada');
  }

  function renderPoseLists() {
    var presetList = document.getElementById('preset-list');
    presetList.innerHTML = '';
    PRESETS.forEach(function (preset) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'pose-button';
      button.textContent = preset.pose.name;
      button.addEventListener('click', function () { loadPose(preset.pose, null); });
      presetList.appendChild(button);
    });

    var customList = document.getElementById('custom-pose-list');
    customList.innerHTML = '';
    if (!customPoses.length) {
      customList.innerHTML = '<p class="empty-state">Suas poses salvas aparecerão aqui.</p>';
    } else {
      customPoses.forEach(function (entry) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'pose-button' + (entry.id === selectedCustomId ? ' selected' : '');
        button.textContent = entry.pose.name;
        button.addEventListener('click', function () { loadPose(entry.pose, entry.id); });
        customList.appendChild(button);
      });
    }
    document.getElementById('pose-count').textContent = customPoses.length;
  }

  function renderPartsList() {
    var list = document.getElementById('parts-list');
    list.innerHTML = '';
    Object.keys(PARTS).forEach(function (partId) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'part-button';
      button.dataset.part = partId;
      button.innerHTML = '<i class="part-swatch" style="background:' + PARTS[partId].color + '"></i><span>' + PARTS[partId].label + '</span>';
      button.addEventListener('click', function () { selectPart(partId); });
      list.appendChild(button);
    });
  }

  function poseName() {
    return document.getElementById('pose-name').value.trim() || 'Pose sem nome';
  }

  document.getElementById('save-pose').addEventListener('click', function () {
    currentPose.name = poseName();
    if (selectedCustomId) {
      var existing = customPoses.find(function (entry) { return entry.id === selectedCustomId; });
      if (existing) existing.pose = clone(currentPose);
    } else {
      selectedCustomId = 'pose-' + Date.now();
      customPoses.push({ id: selectedCustomId, pose: clone(currentPose) });
    }
    basePose = clone(currentPose);
    persist({ draft: currentPose, customPoses: customPoses });
    document.getElementById('delete-pose').disabled = false;
    renderPoseLists();
    markSaved();
    showToast('Pose salva neste navegador');
  });

  document.getElementById('duplicate-pose').addEventListener('click', function () {
    currentPose.name = poseName() + ' — cópia';
    document.getElementById('pose-name').value = currentPose.name;
    selectedCustomId = 'pose-' + Date.now();
    customPoses.push({ id: selectedCustomId, pose: clone(currentPose) });
    basePose = clone(currentPose);
    persist({ draft: currentPose, customPoses: customPoses });
    document.getElementById('delete-pose').disabled = false;
    renderPoseLists();
    markSaved();
    showToast('Cópia criada');
  });

  document.getElementById('delete-pose').addEventListener('click', function () {
    if (!selectedCustomId) return;
    customPoses = customPoses.filter(function (entry) { return entry.id !== selectedCustomId; });
    persist({ draft: PRESETS[0].pose, customPoses: customPoses });
    showToast('Pose excluída');
    loadPose(PRESETS[0].pose, null);
  });

  document.getElementById('reset-pose').addEventListener('click', function () {
    recordHistory();
    currentPose = clone(basePose);
    document.getElementById('pose-name').value = currentPose.name;
    selectedPoint = null;
    render();
    markDirty();
    showToast('Pose restaurada');
  });

  document.getElementById('undo').addEventListener('click', function () {
    if (!undoStack.length) return;
    redoStack.push(clone(currentPose));
    currentPose = undoStack.pop();
    render();
    markDirty();
  });

  document.getElementById('redo').addEventListener('click', function () {
    if (!redoStack.length) return;
    undoStack.push(clone(currentPose));
    currentPose = redoStack.pop();
    render();
    markDirty();
  });

  document.addEventListener('keydown', function (event) {
    if (!(event.ctrlKey || event.metaKey)) return;
    if (event.key.toLowerCase() === 'z') {
      event.preventDefault();
      document.getElementById(event.shiftKey ? 'redo' : 'undo').click();
    } else if (event.key.toLowerCase() === 'y') {
      event.preventDefault();
      document.getElementById('redo').click();
    }
  });

  document.getElementById('toggle-reference').addEventListener('click', function () {
    referenceVisible = !referenceVisible;
    referenceLayer.style.display = referenceVisible ? '' : 'none';
    this.classList.toggle('active', referenceVisible);
    this.setAttribute('aria-pressed', String(referenceVisible));
  });

  document.getElementById('toggle-colors').addEventListener('click', function () {
    multicolor = !multicolor;
    this.classList.toggle('active', multicolor);
    this.setAttribute('aria-pressed', String(multicolor));
    render();
  });

  document.getElementById('toggle-handles').addEventListener('click', function () {
    handlesVisible = !handlesVisible;
    this.classList.toggle('active', handlesVisible);
    this.setAttribute('aria-pressed', String(handlesVisible));
    renderHandles();
  });

  document.getElementById('toggle-contours').addEventListener('click', function () {
    contoursVisible = !contoursVisible;
    this.classList.toggle('active', contoursVisible);
    this.setAttribute('aria-pressed', String(contoursVisible));
    renderHandles();
  });

  document.getElementById('reference-opacity').addEventListener('input', function () {
    referenceLayer.setAttribute('opacity', Number(this.value) / 100);
  });

  document.getElementById('pose-name').addEventListener('input', function () {
    currentPose.name = this.value;
    markDirty();
    scheduleDraftSave();
  });

  ['point-x', 'point-y'].forEach(function (id, index) {
    document.getElementById(id).addEventListener('change', function () {
      if (!selectedPoint) return;
      recordHistory();
      currentPose.points[selectedPoint][index] = Number(this.value);
      render();
      markDirty();
    });
  });

  var widthInput = document.getElementById('part-width');
  widthInput.addEventListener('pointerdown', recordHistory);
  widthInput.addEventListener('input', function () {
    if (!selectedPart || PARTS[selectedPart].kind !== 'segment') return;
    currentPose.widths[selectedPart] = Number(this.value);
    ensurePoseGeometry(currentPose);
    var half = Number(this.value) / 2;
    currentPose.contours[selectedPart].left = [half, half, half, half];
    currentPose.contours[selectedPart].right = [half, half, half, half];
    document.getElementById('width-value').value = Number(this.value).toFixed(1);
    renderModel();
    renderHandles();
    markDirty();
    scheduleDraftSave();
  });

  function exportData() {
    return {
      format: 'sala-estudo-mascot-pose',
      version: 2,
      coordinateSystem: { viewBox: '0 0 51.821 62.332', units: 'SVG user units' },
      pose: clone(currentPose)
    };
  }

  function downloadBlob(content, mime, filename) {
    var url = URL.createObjectURL(new Blob([content], { type: mime }));
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 200);
  }

  function safeFilename(name) {
    return (name || 'pose').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'pose';
  }

  document.getElementById('copy-pose').addEventListener('click', function () {
    var text = JSON.stringify(exportData(), null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { showToast('Dados da pose copiados'); });
    } else {
      showToast('Use “Baixar JSON” neste navegador');
    }
  });

  document.getElementById('export-json').addEventListener('click', function () {
    downloadBlob(JSON.stringify(exportData(), null, 2), 'application/json', safeFilename(currentPose.name) + '.json');
    showToast('JSON preparado para download');
  });

  function escapeXml(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function buildSvg() {
    var parts = [];
    ['right-thigh','right-shin','right-upper-arm','right-forearm','left-thigh','left-shin'].forEach(function (id) {
      parts.push('<path id="' + id + '" d="' + smoothClosedPath(segmentOutlinePoints(id)) + '" fill="' + colorFor(id) + '"/>');
    });
    parts.push('<path id="torso" d="' + torsoPath() + '" fill="' + colorFor('torso') + '"/>');
    ['left-upper-arm','left-forearm'].forEach(function (id) {
      parts.push('<path id="' + id + '" d="' + smoothClosedPath(segmentOutlinePoints(id)) + '" fill="' + colorFor(id) + '"/>');
    });
    parts.push('<path id="head" d="' + smoothClosedPath(headOutlinePoints()) + '" fill="' + colorFor('head') + '"/>');
    return '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 51.821 62.332" role="img">\n<title>' + escapeXml(currentPose.name) + '</title>\n<g id="mascot-pose">\n  ' + parts.join('\n  ') + '\n</g>\n</svg>\n';
  }

  document.getElementById('export-svg').addEventListener('click', function () {
    downloadBlob(buildSvg(), 'image/svg+xml', safeFilename(currentPose.name) + '.svg');
    showToast('SVG preparado para download');
  });

  document.getElementById('import-json').addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        var imported = data.pose || data;
        if (!imported.points || !imported.widths || !imported.head) throw new Error('Formato inválido');
        ensurePoseGeometry(imported);
        imported.name = imported.name || file.name.replace(/\.json$/i, '');
        loadPose(imported, null);
        markDirty();
        showToast('Pose importada');
      } catch (error) {
        showToast('O arquivo não contém uma pose válida');
      }
    };
    reader.readAsText(file);
    this.value = '';
  });

  function showToast(message) {
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('visible'); }, 2200);
  }

  restoreStorage();
  renderPartsList();
  renderPoseLists();
  render();
})();
