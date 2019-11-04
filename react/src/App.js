import React from 'react';
import './App.css';

import { userEventTypes, makeTestingNodes } from './modules/PatchbayUtils'
import { Patchbay } from './modules/Patchbay'

// TODO: get screen values from React-Native methods when on mobile
const screenTestScaler = 0.8;
const canvasWidth = Math.floor(736 * screenTestScaler);
const canvasHeight = Math.floor(414 * screenTestScaler);


class App extends React.Component {
  render() {
    return <div>
      <Animation></Animation>
    </div>;
  }
}

class Animation extends React.Component {
  constructor (props) {
    super(props);
    this.canvasRef = React.createRef();
    this.patchbay = undefined;
  }

  componentDidMount () {
    const canvas = this.canvasRef.current;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    this.patchbay = new Patchbay(canvas.getContext('2d'));
    this.patchbay.setSize(canvas.width, canvas.height);
    makeTestingNodes(this.patchbay);
    this.patchbay.drawLoop();
  }

  handleUserEvent (event, type) {
    if (this.patchbay) {
      this.patchbay.handleUserEvent(type, event.clientX, event.clientY);
    }
  }

  render() {
    return (
      <div>
        <canvas
          ref={this.canvasRef}
          // TODO: these events will need to change for when in React-Native
          onMouseDown={(event) => this.handleUserEvent(event, userEventTypes.touch)}
          onMouseMove={(event) => this.handleUserEvent(event, userEventTypes.move)}
          onMouseLeave={(event) => this.handleUserEvent(event, userEventTypes.release)}
          onMouseUp={(event) => this.handleUserEvent(event, userEventTypes.release)}
        />
      </div>
    );
  }
}


export default App;
