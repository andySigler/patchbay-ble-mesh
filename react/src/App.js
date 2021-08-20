import React from 'react';

import { userEventTypes, makeTestingNodes } from './modules/PatchbayUtils'
import { Patchbay } from './modules/Patchbay'

class App extends React.Component {

  constructor (props) {
    super(props);
    this.visibleCanvasRef = React.createRef();
    this.patchbay = undefined;
  }

  getWidthHeight () {
    // TODO: get screen values from React-Native methods when on mobile
    const screenTestScaler = 0.8;
    const canvasWidth = Math.floor(736 * screenTestScaler);
    const canvasHeight = Math.floor(414 * screenTestScaler);
    // const thisWindow = Dimensions.get('window');
    // const canvasWidth = thisWindow.width;
    // const canvasHeight = thisWindow.height;
    return [canvasWidth, canvasHeight];
  }

  setupCanvasAndGetContext (canvas, width, height) {
    canvas.width = width;
    canvas.height = height;
    return canvas.getContext('2d');
  }

  componentDidMount () {
    // get the canvas and context
    const [width, height] = this.getWidthHeight();
    const canvas = this.visibleCanvasRef.current;
    const context = this.setupCanvasAndGetContext(canvas, width, height);
    // create a Patchbay instance with the context
    this.patchbay = new Patchbay(context);
    this.patchbay.setSize(width, height);
    // add some fake nodes for testing
    makeTestingNodes(this.patchbay);
    // draw the hidden canvas to the visible canvas at the end of each frame
    this.patchbay.drawLoop(() => {
      if (context.drawImage) { // not there during react-dom tests
        context.drawImage(canvas, 0, 0);
      }
    });
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
          ref={this.visibleCanvasRef}
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
