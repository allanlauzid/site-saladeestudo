const fs = require('fs');
const html = `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
</head>
<body>
  <svg width="500" height="500">
    <g id="test-group1"><rect x="100" y="100" width="50" height="50" /></g>
    <g id="test-group2"><rect x="100" y="100" width="50" height="50" /></g>
  </svg>
  <script>
    // Test 1: Using transformOrigin relative to bbox
    const el1 = document.getElementById('test-group1');
    const box1 = el1.getBBox();
    const cx1 = 125; // Absolute local coordinate we want as origin
    const cy1 = 125;
    gsap.set(el1, { 
      transformOrigin: (cx1 - box1.x) + "px " + (cy1 - box1.y) + "px", 
      x: 200 - cx1, 
      y: 200 - cy1, 
      rotation: 90 
    });
    
    // Test 2: Using svgOrigin
    const el2 = document.getElementById('test-group2');
    gsap.set(el2, { 
      svgOrigin: "125 125", 
      x: 200 - 125, 
      y: 200 - 125, 
      rotation: 90 
    });

    const bbox1 = el1.getBoundingClientRect();
    const bbox2 = el2.getBoundingClientRect();
    const match = bbox1.x === bbox2.x && bbox1.y === bbox2.y;
    document.body.innerHTML += '<div id="res">' + match + ' | ' + el1.getAttribute('transform') + ' | ' + el2.getAttribute('transform') + '</div>';
  </script>
</body>
</html>`;
fs.writeFileSync('gsap-test.html', html);
console.log("Created gsap-test.html");
