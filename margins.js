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

  let n=0
  while (n<config.Squiggles) {

    let x = Math.floor(Math.random()*w), y = Math.floor(Math.random()*h);
    let z= getPixel(x,y)
    let angle = 1-((z/255)*Math.PI*2),
    // cos = Math.cos(angle) * (z/255) * config['Max Length'],
    // sin = Math.sin(angle) * (z/255) * config['Max Length'],
    cos = Math.cos(angle) * config['Max Length'],
    sin = Math.sin(angle) * config['Max Length'];

    output.push([[x+cos,y+sin],[x-cos,y-sin]])
    n++
    
  }

  if (config['Optimize route']) {
    postMessage(['msg', "Optimizing..."]);
    output = sortlines(output)
  }

  postLines(output)
  postMessage(['msg', "Done"]);
}

