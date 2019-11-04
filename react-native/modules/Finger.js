import * as utils from './PatchbayUtils'

const fingerDefaults = {
  tapPixelsMovedThresh: 3,
  touchCircleRadiusScaler: 0.1,
  touchCircleThicknessScaler: 0.01,
  touchedLineWidth: 3
};

class Finger {
  constructor (context, inCircle, outCircle, connections, onMakeConnection, onDeleteConnection) {
    this.context = context;
    this.inCircle = inCircle;
    this.outCircle = outCircle;
    this.connections = connections;

    this.onMakeConnection = onMakeConnection;
    this.onDeleteConnection = onDeleteConnection;

    this._touchedPort = undefined;
    this._hoveredPort = undefined;

    this.circleRadius = undefined;
    this.circleThickness = undefined;

    this.x = undefined;
    this.y = undefined;
    this.touchX = undefined;
    this.touchY = undefined;

    this.isTouchingScreen = false;

    this.radianNew = {};
    this.radianNew[utils.inType] = 0;
    this.radianNew[utils.outType] = 0;
    this.radianPrev = Object.assign({}, this.radianNew);
  }

  get touchedPort () { return this._touchedPort; }

  get hoveredPort () { return this._hoveredPort; }

  adjustToScreenSize (screenSize) {
    this.circleRadius = screenSize * fingerDefaults.touchCircleRadiusScaler;
    this.circleThickness = screenSize * fingerDefaults.touchCircleThicknessScaler;
  }

  update () {
    if (!this._touchedPort) {
      if(this.inCircle.touched){
        this.inCircle.radiansMoved = this.radianNew[utils.inType] - this.radianPrev[utils.inType];
      }
      else if(this.outCircle.touched){
        this.outCircle.radiansMoved = this.radianNew[utils.outType] - this.radianPrev[utils.outType];
      }
    }
    this.radianPrev = Object.assign({}, this.radianNew);
  }

  touchEvent (x, y) {
    this.touchX = x;
    this.touchY = y;
    this.isTouchingScreen = true;
    this.moveEvent(x, y);
    if (!this.getTouchedConnection()) {
      this.unselectAllConnections();
    }
    this.inCircle.clearTouchedHovered();
    this.outCircle.clearTouchedHovered();
    let port = undefined;
    if(this.inCircle.isCloseTo(this.x, this.y)){
      port = this.inCircle.mouseEvent(this.x, this.y, this.radianNew[utils.inType]);
    }
    else if(this.outCircle.isCloseTo(this.x, this.y)){
      port = this.outCircle.mouseEvent(this.x, this.y, this.radianNew[utils.outType]);
    }
    if (port) {
      this._touchedPort = port;
    }
  }

  moveEvent (x, y) {
    this.x = x;
    this.y = y;
    this.isTouchingScreen = true;
    this.radianNew[utils.inType] = this.radiansFromCenter(
      this.x, this.y, this.inCircle);
    this.radianNew[utils.outType] = this.radiansFromCenter(
      this.x, this.y, this.outCircle);
    if (this._touchedPort) {
      this.findHoveredPort();
    }
  }

  releaseEvent (x, y) {
    this.x = x;
    this.y = y;
    this.isTouchingScreen = false;
    const distMoved = utils.getDistance(this.touchX, this.touchY, x, y);
    if (distMoved < fingerDefaults.tapPixelsMovedThresh) {
      this.releaseWithoutMoving(x, y);
    }
    else {
      if (this._touchedPort && this._hoveredPort){
        this.makeConnection(this._hoveredPort, this._touchedPort);
      }
      this.unselectAllConnections();
      this.clearCirclesTouchedHovered();
    }
  }

  releaseWithoutMoving () {
    const didDeleteAConnection = this.deleteConnectionIfTouched();
    if (!didDeleteAConnection || this._touchedPort) {
      this.unselectAllConnections();
    }
    if(this._touchedPort){
      for (let name in this.connections){
        const conn = this.connections[name];
        if (conn.inPort.isTouched() || conn.outPort.isTouched()){
          conn.selected = true;
        }
      }
    }
    else {
      this.inCircle.tapEvent();
      this.outCircle.tapEvent();
    }
    this.clearCirclesTouchedHovered();
  }

  draw () {
    if (this.touchedPort) {
      this.drawTouchLine();
      this.drawTouchedPort();
      if (this.hoveredPort) {
        this.drawHoveredPort();
      }
    }
  }

  drawTouchedPort () {
    this.context.save();
    utils.drawCircle(
      this.context,
      this.touchedPort.x, this.touchedPort.y,
      this.circleRadius, this.circleThickness,
      utils.colors.highlight(), undefined
    );
    this.context.restore();
  }

  drawTouchLine () {
    this.context.save();
    utils.drawLine(
      this.context,
      this.touchedPort.x, this.touchedPort.y,
      this.x, this.y,
      fingerDefaults.touchedLineWidth, utils.colors.highlight()
    );
    this.context.restore();
    // then two smaller filled in circles to cover the tips of the line
    this.context.save();
    utils.drawCircle(
      this.context,
      this.touchedPort.x, this.touchedPort.y,
      fingerDefaults.touchedLineWidth, 0,
      undefined, utils.colors.highlight()
    );
    utils.drawCircle(
      this.context,
      this.x, this.y,
      fingerDefaults.touchedLineWidth, 0,
      undefined, utils.colors.highlight()
    );
    this.context.restore();
  }

  drawHoveredPort () {
    this.context.save();
    utils.drawCircle(
      this.context,
      this.hoveredPort.x, this.hoveredPort.y,
      this.circleRadius, this.circleThickness,
      utils.colors.highlight(), undefined
    );
    this.context.restore();
  }

  findHoveredPort () {
    this._hoveredPort = this.getHoveredPortFromCircle(this.outCircle);
    if (this._hoveredPort) {
      return;
    }
    this._hoveredPort = this.getHoveredPortFromCircle(this.inCircle);
    if (this._hoveredPort) {
      return;
    }
  }

  getHoveredPortFromCircle (circle) {
    if (circle.arcs.length === 0) {
      return;
    }
    if (this._touchedPort.type === circle.type) {
      return;
    }
    for (let arc of circle.getExpandedArcs()) {
      for (let port of arc.ports) {
        if (port.isUserTouching(this.x, this.y)) {
          return port;
        }
      }
    }
    return undefined;
  }

  deleteConnectionIfTouched () {
    const conn = this.getTouchedConnection();
    if (conn) {
      this.onDeleteConnection(conn);
      return true;
    }
    return false;
  }

  getTouchedConnection () {
    for(let i in this.connections){
      const conn = this.connections[i];
      if (conn.isUserTouching(this.x, this.y)) {
        return conn;
      }
    }
    return undefined;
  }

  unselectAllConnections () {
    for (let name in this.connections) {
      this.connections[name].selected = false;
    }
  }

  clearCirclesTouchedHovered () {
    this.inCircle.clearTouchedHovered();
    this.outCircle.clearTouchedHovered();
    this._touchedPort = undefined;
    this._hoveredPort = undefined;
  }

  makeConnection (port1, port2) {
    if (port1.type === utils.inType){
      this.onMakeConnection(port1, port2);
    }
    else{
      this.onMakeConnection(port2, port1);
    }
  }

  radiansFromCenter (x, y, circle) {
    const xDist = Math.abs(circle.x - x);
    const yDist = Math.abs(circle.y - y);
    if (x > circle.x){
      if (y > circle.y){
        // bottom right
        return Math.atan(yDist / xDist);
      }
      else if (y < circle.y){
        // top right
        return Math.atan(xDist / yDist) + (Math.PI * 1.5);
      }
      else {
        // we're touching the y line
        return 0;
      }
    }
    else if (x < circle.x){
      if (y > circle.y){
        // bottom left
        return Math.atan(xDist / yDist) + (Math.PI * 0.5);
      }
      else if (y < circle.y){
        // top left
        return Math.atan(yDist / xDist) + Math.PI;
      }
      else {
        // we're touching the y line
        return Math.PI;
      }
    }
    else {
      //we're touching the x line
      if (y > circle.y){
        return Math.PI * 0.5;
      }
      else if (y < circle.y){
        return Math.PI * 1.5;
      }
      else {
        // we're touching the middle
        return 0;
      }
    }
  }
}

export { Finger }
