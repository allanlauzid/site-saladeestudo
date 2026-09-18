const fs = require('fs');
const svg = fs.readFileSync('_backups/mascote-montagem-5-poses-forca-feito.svg', 'utf-8');

const regex = /<g[^>]*id="([^"]+)"(?:[^>]*inkscape:label="([^"]*)")?[^>]*transform="matrix\(([^)]+)\)"/g;
let match;
const pieces = [];

while ((match = regex.exec(svg)) !== null) {
  const id = match[1];
  const label = match[2] || 'NO_LABEL';
  const matrix = match[3].split(',').map(Number);
  pieces.push({ id, label, matrix });
}

// Group by X position to find which pose they belong to
pieces.forEach(p => {
  const x = p.matrix[4];
  let pose = 0;
  if (x > 50 && x < 400) pose = 1;
  else if (x > 400 && x < 700) pose = 2;
  else if (x > 700 && x < 1050) pose = 3;
  else if (x > 1050 && x < 1450) pose = 4;
  else if (x > 1450 && x < 1800) pose = 5;
  p.pose = pose;
});

const filtered = pieces.filter(p => p.pose > 0);
filtered.sort((a, b) => a.pose - b.pose || a.id.localeCompare(b.id));

// To calculate the coordinates from matrix:
// target.x = matrix[4], target.y = matrix[5]
// target.scaleX = Math.sqrt(matrix[0]*matrix[0] + matrix[1]*matrix[1]) * Math.sign(matrix[0])
// target.scaleY = Math.sqrt(matrix[2]*matrix[2] + matrix[3]*matrix[3]) * Math.sign(matrix[3])
// target.rotation = Math.atan2(matrix[1], matrix[0]) * 180 / Math.PI
// Actually, Inkscape matrices might include skew/flips.
// Let's compute these values and print them!

filtered.forEach(p => {
  const [a, b, c, d, e, f] = p.matrix;
  // Calculate scale
  const scaleX = Math.sqrt(a * a + b * b) * (a < 0 ? -1 : 1);
  const scaleY = Math.sqrt(c * c + d * d) * (d < 0 ? -1 : 1);
  // Calculate rotation (in radians)
  let rotation = Math.atan2(b, a);
  // If scaleX < 0, atan2 might be flipped, but since we preserve scaleX, it's ok.
  if (a < 0) {
      rotation = Math.atan2(-b, -a);
  }
  const rotationDeg = rotation * 180 / Math.PI;

  p.calc = {
    x: e,
    y: f,
    scaleX: +(scaleX / 2.1847007).toFixed(3), // Normalize to base scale 2.1847007
    scaleY: +(scaleY / 2.1847007).toFixed(3),
    rotation: +rotationDeg.toFixed(3)
  };
});

console.log(JSON.stringify(filtered, null, 2));
