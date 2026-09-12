const { JSDOM } = require('jsdom');
const fs = require('fs');

const svg = fs.readFileSync('_backups/mascote-montagem-5-poses-forca-feito.svg', 'utf-8');
// We need to parse SVG to get the bounds. JSDOM doesn't support getBBox fully, but we can do a crude min/max of the rects/circles if we parse the transform matrices!
// Actually, it's easier to just calculate the transformed coordinates of the known default anchors, and deduce the hands/feet visually from the SVG coordinates.

// Let's print the min/max X/Y for the default un-transformed pieces.
const pieces = [
  { id: 'fonte-cabeca', name: 'head' },
  { id: 'fonte-tronco', name: 'torso' },
  { id: 'fonte-braco-esquerdo', name: 'arm-left' },
  { id: 'fonte-braco-direito', name: 'arm-right' },
  { id: 'fonte-perna-esquerda', name: 'leg-left' },
  { id: 'fonte-perna-direita-6', name: 'leg-right' } // using the one from pose 1
];

// Let's just output the SVG fragment for these to analyze them
const regex = /<g[^>]*id="fonte-[^"]+"[^>]*>[\s\S]*?<\/g>/g;
let match;
while ((match = regex.exec(svg)) !== null) {
  if (match[0].includes('inkscape:label="BRAÇO') || match[0].includes('inkscape:label="PERNA')) {
     // console.log(match[0]);
  }
}
