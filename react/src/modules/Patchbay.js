import * as utils from './PatchbayUtils'
import { Circle } from './Circle'
import { Connection } from './Connection'
import { Finger } from './Finger'

const patchbayDefaults = {
  screenPercentage: 0.25,
  arcThicknessPercentage: 0.08,
  circleCenterXOffsetScaler: 0.3,
  circleCenterYOffsetScaler: 0.1
};

class Patchbay {
  constructor (context) {
    this.context = context;

    this.connections = {};

    this.inCircle = this.createCircle(utils.inType);
    this.outCircle = this.createCircle(utils.outType);
    this.finger = this.createFinger();

    this.width = undefined;
    this.height = undefined;
    this.screenSize = undefined;

    this.reqAnimFrame = undefined;
  }

  createFinger () {
    return new Finger(
      this.context,
      this.inCircle,
      this.outCircle,
      this.connections,
      (inPort, outPort) => this.createAndSaveConnection(inPort, outPort),
      (conn) => this.deleteConnection(conn)
    );
  }

  createCircle (type) {
    return new Circle(
      this.context,
      type,
      patchbayDefaults.screenPercentage,
      patchbayDefaults.arcThicknessPercentage,
      () => this.finger.touchedPort,
      () => this.finger.hoveredPort
    );
  }

  setSize (width, height) {
    this.width = width;
    this.height = height;
    this.updateScreenVariables();
    this.adjustChildrenToScreenSize();
  }

  adjustChildrenToScreenSize () {
    this.finger.adjustToScreenSize(this.screenSize);
    this.inCircle.adjustToScreenSize(this.screenSize);
    this.outCircle.adjustToScreenSize(this.screenSize);
    for(let i in this.connections){
      this.connections[i].adjustToScreenSize(this.screenSize);
    }
  }

  updateScreenVariables () {
    this.screenSize = Math.min(this.width, this.height);
    const xOffset = this.width * patchbayDefaults.circleCenterXOffsetScaler;
    const yOffset = this.height * patchbayDefaults.circleCenterYOffsetScaler;
    this.inCircle.x = (this.width / 2) - xOffset;
    this.outCircle.x = (this.width / 2) + xOffset;
    this.inCircle.y = (this.height / 2) - yOffset;
    this.outCircle.y = (this.height / 2) + yOffset;
  }

  drawLoop (onNewFrame) {
    if (this.reqAnimFrame) {
      this.cancelDrawLoop();
    }

    this.finger.update();
    this.inCircle.update();
    this.outCircle.update();
    for(let i in this.connections){
      this.connections[i].update();
    }

    this.context.save();
    this.clearCanvas();
    this.inCircle.drawArcs();
    this.outCircle.drawArcs();
    this.inCircle.drawNames();
    this.outCircle.drawNames();
    this.inCircle.drawPorts();
    this.outCircle.drawPorts();
    for(let i in this.connections){
      this.connections[i].draw();
    }
    this.finger.draw();
    this.context.restore();

    if (onNewFrame) {
      onNewFrame();
    }

    this.reqAnimFrame = requestAnimationFrame(() => this.drawLoop(onNewFrame));
  }

  cancelDrawLoop () {
    cancelAnimationFrame(this.reqAnimFrame);
    this.reqAnimFrame = undefined;
  }

  clearCanvas() {
    this.context.fillStyle = utils.colors.background();
    this.context.fillRect(0, 0, this.width, this.height);
  }

  createAndSaveConnection (inPort, outPort) {
    this.saveConnection(this.createConnection(inPort, outPort));
  }

  createConnection (inPort, outPort) {
    const connection = new Connection(this.context, inPort, outPort);
    connection.adjustToScreenSize(this.screenSize);
    return connection;
  }

  saveConnection (connection) {
    this.deleteConnection(connection);
    this.connections[connection.name] = connection;
  }

  deleteConnection (conn) {
    this.deleteConnectionByName(conn.name);
  }

  deleteConnectionByName (name) {
    if (this.connections[name]) {
      delete this.connections[name];
    }
  }

  handleUserEvent (type, x, y) {
    if (type === utils.userEventTypes.touch) {
      this.finger.touchEvent(x, y);
    }
    else if (type === utils.userEventTypes.move) {
      this.finger.moveEvent(x, y);
    }
    else if (type === utils.userEventTypes.release) {
      this.finger.releaseEvent(x, y);
    }
  }
}

export { Patchbay }
