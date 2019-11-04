const inType = 'in';
const outType = 'out';

const userEventTypes = {
  touch: 'touch',
  move: 'move',
  release: 'release'
};

const PI = Math.PI;
const PI2 = Math.PI * 2;

const clipValue = (value, min = -Infinity, max = Infinity) => {
  return Math.min(Math.max(value, min), max);
}

const colors = {
  black: (opacity = 1.0) => `rgba(0, 0, 0, ${clipValue(opacity, 0, 1)})`,
  white: (opacity = 1.0) => `rgba(255, 255, 255, ${clipValue(opacity, 0, 1)})`,
  delete: (opacity = 1.0) => `rgba(226, 39, 39, ${clipValue(opacity, 0, 1)})`,
  highlight: (opacity = 1.0) => `rgba(100, 255, 100, ${clipValue(opacity, 0, 1)})`,
  background: (opacity = 1.0) => `rgba(79, 79, 79, ${clipValue(opacity, 0, 1)})`, // grey
  palette: [
    (opacity = 1.0) => `rgba(176, 79, 79, ${clipValue(opacity, 0, 1)})`,
    (opacity = 1.0) => `rgba(176, 79, 176, ${clipValue(opacity, 0, 1)})`,
    (opacity = 1.0) => `rgba(43, 211, 252, ${clipValue(opacity, 0, 1)})`,
    (opacity = 1.0) => `rgba(176, 176, 79, ${clipValue(opacity, 0, 1)})`,
    (opacity = 1.0) => `rgba(252, 120, 43, ${clipValue(opacity, 0, 1)})`,
    (opacity = 1.0) => `rgba(176, 176, 176, ${clipValue(opacity, 0, 1)})`,
    (opacity = 1.0) => `rgba(30, 147, 175, ${clipValue(opacity, 0, 1)})`
  ]
}

const font = (size = 0, family = 'Helvetica') => {
  return `${Math.floor(size)}px ${family}`;
}

const drawLine = (context, x1, y1, x2, y2, width, stroke = undefined) => {
  context.beginPath();
  continueLine(context, x1, y1, x2, y2, width, stroke);
}

const continueLine = (context, x1, y1, x2, y2, width, stroke = undefined) => {
  if (width) {
    context.lineWidth = width;
  }
  if (stroke) {
    context.strokeStyle = stroke;
  }
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  if (stroke) {
    context.stroke();
  }
}

const drawCircle = (context, x, y, radius, width, stroke = undefined, fill = undefined) => {
  drawArc(context, x, y, radius, 0, PI2, width, stroke, fill);
}

const drawArc = (context, x, y, radius, start, end, width, stroke = undefined, fill = undefined) => {
  context.beginPath();
  if (stroke) context.strokeStyle = stroke;
  if (fill) context.fillStyle = fill;
  context.lineWidth = width;
  context.arc(x, y, radius, start, end, false);
  if (stroke) context.stroke();
  if (fill) context.fill();
}

const getDistance = (x1, y1, x2, y2) => {
  var xDiff = x1 - x2;
  var yDiff = y1 - y2;
  return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
}

const fakeContext = {
  restore: () => {},
  translate: () => {},
  rotate: () => {},
  beginPath: () => {},
  closePath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  arc: () => {},
  fillRect: () => {},
  fillText: () => {},
  save: () => {},
  fill: () => {},
  stroke: () => {}
};

const testingNodes = [
  {
    'name': 'Phone',
    'inputs': ['Dial', 'Mic'],
    'outputs': ['Bell']
  },
  {
    'name': 'Biggie',
    'inputs': [],
    'outputs': ['Nod', 'Position']
  },
  {
    'name': 'Switch',
    'inputs': ['State'],
    'outputs': []
  },
  {
    'name': 'Toy-Pony',
    'inputs': [],
    'outputs': ['speed']
  },
  {
    'name': 'Maraca',
    'inputs': ['Intensity', 'Beat'],
    'outputs': []
  },
  {
    'name': 'Guitar',
    'inputs': ['Volume', 'Speed', 'Pitch'],
    'outputs': []
  },
  {
    'name': 'Lamp',
    'inputs': [],
    'outputs': ['Brightness', 'State']
  },
  {
    'name': 'Boombox',
    'inputs': ['Beat', 'Volume'],
    'outputs': ['Volume', 'Song']
  },
  {
    'name': 'Snare',
    'inputs': ['Beat', 'Volume'],
    'outputs': ['Volume']
  },
  {
    'name': 'Monome',
    'inputs': ['Pitch', 'State'],
    'outputs': []
  },
  {
    'name': 'Drawing-Bot',
    'inputs': [],
    'outputs': ['Speed', 'Direction', 'Pen-Height']
  }
];

function makeTestingNodes(patchbay) {
  // test nodes for playing with patchbay
  // create a new arc for the Tester
  const inCircle = patchbay.inCircle;
  const outCircle = patchbay.outCircle;
  for (let i = 0; i < testingNodes.length; i++) {
    const node = testingNodes[i];
    const color = colors.palette[i % colors.palette.length];
    const nodeID = `testNode${i}`;
    const inArc = inCircle.createArc(node.name, color, nodeID);
    const outArc = outCircle.createArc(node.name, color, nodeID);
    inCircle.addArc(inArc);
    outCircle.addArc(outArc);
    for (let o = 0; o < node.outputs.length; o++) {
      outArc.addPort(outArc.createPort(o, node.outputs[o]));
    }
    for (let o = 0; o < node.inputs.length; o++) {
      inArc.addPort(inArc.createPort(o, node.inputs[o]));
    }
  }
  // create some random connections between all the ports
  for (let inArc of inCircle.arcs) {
    if(inArc.ports.length > 0) {
      for (let d = 0; d < 20; d++) {
        const outArcIndex = Math.floor(Math.random() * outCircle.arcs.length);
        const outArc = outCircle.arcs[outArcIndex];
        if(outArc.ports.length > 0) {
          const inPortIndex = Math.floor(Math.random() * inArc.ports.length);
          const outPortIndex = Math.floor(Math.random() * outArc.ports.length);
          patchbay.createAndSaveConnection(
            inArc.ports[inPortIndex], outArc.ports[outPortIndex]);
        }
      }
    }
  }
}

export {
  inType,
  outType,
  userEventTypes,
  PI,
  PI2,
  clipValue,
  colors,
  font,
  drawLine,
  continueLine,
  drawCircle,
  drawArc,
  getDistance,
  fakeContext,
  makeTestingNodes
}
