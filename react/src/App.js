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
    this.hiddenCanvasRef = React.createRef();
    this.visibleCanvasRef = React.createRef();
    this.patchbay = undefined;
  }

  setupCanvasAndGetContext (canvas, width, height) {
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    return canvas.getContext('2d');
  }

  componentDidMount () {
    const hiddenCanvas = this.hiddenCanvasRef.current;
    const visibleCanvas = this.visibleCanvasRef.current;
    const hiddenContext = this.setupCanvasAndGetContext(
      hiddenCanvas, canvasWidth, canvasHeight);
    const visibleContext = this.setupCanvasAndGetContext(
      visibleCanvas, canvasWidth, canvasHeight);
    this.patchbay = new Patchbay(hiddenContext);
    this.patchbay.setSize(canvasWidth, canvasHeight);
    makeTestingNodes(this.patchbay);
    this.patchbay.drawLoop(() => {
      visibleContext.drawImage(hiddenCanvas, 0, 0);
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
          // TODO: these events will need to change for when in React-Native
          onMouseDown={(event) => this.handleUserEvent(event, userEventTypes.touch)}
          onMouseMove={(event) => this.handleUserEvent(event, userEventTypes.move)}
          onMouseLeave={(event) => this.handleUserEvent(event, userEventTypes.release)}
          onMouseUp={(event) => this.handleUserEvent(event, userEventTypes.release)}
        />
        <canvas
          // There is a bug when using react-native-canvas, where the device
          //    renders a canvas's pixels before completing the current frame.
          // This creates a very noticable flickering affect, where things
          //    drawn near the end up the update cycle will appear/disappear
          // To avoid, I'm using one hidden canvas for layering all the
          //    shapes, lines, colors, etc, during a frame.
          // Then at the end of that frame, I simply draw the contents of the
          //    hidden canvas onto a visible canvas.
          // Because all the pixels of the visible canvas are being updated all
          //    at once, the flickering should no longer be noticable
          style={{visibility: 'hidden'}}
          ref={this.hiddenCanvasRef}
        />
      </div>
    );
  }
}


export default App;
