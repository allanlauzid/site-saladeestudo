const fs = require('fs');

// We can just dump the GSAP transform behavior by testing it in browser
const html = `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
</head>
<body>
  <svg width="500" height="500">
    <g id="test-group">
      <rect x="100" y="100" width="50" height="50" />
    </g>
  </svg>
  <script>
    const el = document.getElementById('test-group');
    // Bbox is x=100, y=100, w=50, h=50. center is 125, 125.
    gsap.set(el, { transformOrigin: "125px 125px", rotation: 90 });
    const ctm = el.getCTM();
    // If GSAP uses bbox-relative, then origin is at box.x + 125 = 225!
    // Let's see what CSS it applied
    const css = el.style.transformOrigin;
    document.body.innerHTML += '<div id="res">' + css + ' | ' + el.getAttribute('data-svg-origin') + '</div>';
  </script>
</body>
</html>`;

fs.writeFileSync('gsap-test.html', html);
console.log("Created gsap-test.html");
