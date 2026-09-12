const fs = require('fs');
let js = fs.readFileSync('hangman-animation.js', 'utf-8');
// Fix keys that have hyphens but lost their quotes: arm-left: -> 'arm-left':
js = js.replace(/([a-z]+-[a-z]+):/g, "'$1':");
fs.writeFileSync('hangman-animation.js', js);
console.log("Fixed quotes");
