const fs = require('fs');
const svg = fs.readFileSync('_backups/mascote-montagem-5-poses-forca-feito.svg', 'utf-8');

// Find all elements containing 'rect19' (leg-right main rect)
const regex = /<g[^>]*transform="matrix\(([^)]+)\)"[^>]*>[\s\S]*?rect19/g;
let match;
const pieces = [];

while ((match = regex.exec(svg)) !== null) {
  const matrix = match[1].split(',').map(Number);
  pieces.push({ matrix });
}

console.log('leg-right pieces:', pieces.length);
pieces.forEach(p => {
  const x = p.matrix[4];
  let pose = 0;
  if (x > 50 && x < 400) pose = 1;
  else if (x > 400 && x < 700) pose = 2;
  else if (x > 700 && x < 1050) pose = 3;
  else if (x > 1050 && x < 1450) pose = 4;
  else if (x > 1450 && x < 1800) pose = 5;
  console.log(`Pose ${pose}: x=${x}, matrix=${p.matrix.join(',')}`);
});
