importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
  {label: 'Squiggles', value: 100, min: 100, max: 10000},
  {label: 'Max Length', value: 5, min: 0.1, max: 40, step: 0.1},
  {label: 'Threshold', value: 50, min: 1, max: 254},
  {label: 'Optimize route', type:'checkbox', checked:true},
])]);


onmessage = function(e) {
  const [ config, pixData ] = e.data;
  const getPixel = pixelProcessor(config, pixData)

  const w=config.width, h=config.height;
  let output=[]

  function computeEdgeMap(pixData, w, h) {
    const edgeMap = new Array(w * h).fill(0);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        // Simple gradient magnitude (Sobel-like)
        const i = y * w + x;
        const gx = (
          -getPixel(x-1, y-1) - 2*getPixel(x-1, y) - getPixel(x-1, y+1) +
          getPixel(x+1, y-1) + 2*getPixel(x+1, y) + getPixel(x+1, y+1)
        );
        const gy = (
          -getPixel(x-1, y-1) - 2*getPixel(x, y-1) - getPixel(x+1, y-1) +
          getPixel(x-1, y+1) + 2*getPixel(x, y+1) + getPixel(x+1, y+1)
        );
        edgeMap[i] = Math.sqrt(gx*gx + gy*gy);
      }
    }
    return edgeMap;
  }

  const edgeMap = computeEdgeMap(pixData, w, h);

  // Calculate grid size to evenly distribute squiggles
  const gridSize = Math.sqrt((w * h) / config.Squiggles) | 0;
  for (let y = gridSize; y < h - gridSize; y += gridSize) {
    for (let x = gridSize; x < w - gridSize; x += gridSize) {
      let i = y * w + x;
      let edgeStrength = edgeMap[i];

      // Map edge strength to length: strong edge = short, weak edge = long
      let normEdge = Math.min(edgeStrength / 255, 1);
      let length = config['Max Length'] * (1 - normEdge * 0.9); // 0.1x length at max edge

      // Map edge strength to arc angle: strong edge = more curved
      // Arc angle from 10° (weak edge) to 120° (strong edge)
      let minArc = Math.PI / 18;   // 10 degrees
      let maxArc = Math.PI * 2 / 3; // 120 degrees
      let arcAngle = minArc + (maxArc - minArc) * normEdge;

      // Orienation
      let baseAngle = (edgeStrength/255) * Math.PI * 2;

      // Arc center is at (x, y)
      let points = [];
      let numPoints = 5;
      for (let j = 0; j < numPoints; j++) {
        let t = j / (numPoints - 1); // 0..1
        let theta = baseAngle - arcAngle / 2 + arcAngle * t;
        let px = x + Math.cos(theta) * length;
        let py = y + Math.sin(theta) * length;
        points.push([px, py]);
      }
      output.push(points);
    }
  }

  if (config['Optimize route']) {
    postMessage(['msg', "Optimizing..."]);
    output = sortlines(output)
  }

  postLines(output)
  postMessage(['msg', "Done"]);
}
