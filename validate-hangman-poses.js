const fs = require('fs');

const source = fs.readFileSync('hangman-animation.js', 'utf8');
const marker = '/* v29:';
const start = source.indexOf(marker);
const assignment = source.indexOf('GALLOWS_POSES = [', start);
if (start < 0 || assignment < 0) throw new Error('Matriz v29 não encontrada');

const arrayStart = source.indexOf('[', assignment);
const arrayEnd = source.indexOf('\n  ];', arrayStart);
if (arrayStart < 0 || arrayEnd < 0) throw new Error('Bloco de poses incompleto');

const poses = Function('return ' + source.slice(arrayStart, arrayEnd + 4))();
const ids = ['head', 'torso', 'arm-left', 'arm-right', 'leg-left', 'leg-right'];
const errors = [];

if (poses.length !== 5) errors.push('esperadas 5 poses, encontradas ' + poses.length);
poses.forEach((pose, poseIndex) => {
  if (!pose || !pose.targets) {
    errors.push('pose ' + poseIndex + ' sem targets');
    return;
  }
  ids.forEach((id) => {
    const target = pose.targets[id];
    if (!target || !Array.isArray(target.matrix) || target.matrix.length !== 4) {
      errors.push('pose ' + poseIndex + ': matriz ausente em ' + id);
      return;
    }
    if (![target.x, target.y, ...target.matrix].every(Number.isFinite)) {
      errors.push('pose ' + poseIndex + ': valor não numérico em ' + id);
    }
    const determinant = target.matrix[0] * target.matrix[3] - target.matrix[1] * target.matrix[2];
    if (Math.abs(determinant) < 0.01) errors.push('pose ' + poseIndex + ': matriz singular em ' + id);
    if (target.x < 200 || target.x > 370 || target.y < -80 || target.y > 90) {
      errors.push('pose ' + poseIndex + ': centro fora da forca em ' + id);
    }
  });
  if (!Array.isArray(pose.order) || pose.order.length !== ids.length ||
      new Set(pose.order).size !== ids.length || pose.order.some((id) => !ids.includes(id))) {
    errors.push('pose ' + poseIndex + ': ordem precisa conter as seis peças uma vez');
  }
});

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('OK: 5 poses, 30 matrizes invertíveis, seis peças únicas por pose.');
}
