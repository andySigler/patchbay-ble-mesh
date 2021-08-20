import * as utils from './PatchbayUtils'
import { Port } from './Port'

const inOutAngleOffsets = {};
inOutAngleOffsets[utils.inType] = 0.375;
inOutAngleOffsets[utils.outType] = 0.875;

const arcDefaults = {
  emptyLineWidthScaler: 0.1,
  gutterThicknessScaler: 0.77,
  gutterStartEndScaler: 0.006,
  sizeScalerPreMultiplier: 1.9,
  angleOffset: inOutAngleOffsets
};

class Arc {
  constructor (context, parent, type, name, id, color, getGlobalTouchedPort, getGlobalHoveredPort) {
    this.context = context;
    this._parent = parent;
    this._type = type;
    this._color = color;
    this._name = name;
    this._id = id;

    this.getGlobalTouchedPort = getGlobalTouchedPort;
    this.getGlobalHoveredPort = getGlobalHoveredPort;

    this._sizeScaler = 0;

    this._ports = [];

    this._touched = false;
    this._isSelected = false;

    this.start = undefined;
    this.end = undefined;
    this.x = undefined;
    this.y = undefined;
    this.angleOffset = arcDefaults.angleOffset[this._type] * utils.PI2;
    this.radius = undefined;
    this.lineWidth = undefined;
    this.drawnLineWidth = undefined;
    this.drawnLineWidthScaler = arcDefaults.emptyLineWidthScaler;

    this.shouldDrawGutter = false;
    this.gutterStart = undefined;
    this.gutterEnd = undefined;
    this.gutterThickness = undefined;
  }

  // GETTERS

  get parent () { return this._parent; }

  get type () { return this._type; }

  get color () { return this._color; }

  get name () { return this._name; }

  get id () { return this._id; }

  get ports () { return this._ports; }

  get isSelected () { return this._isSelected; }

  get touched () { return this._touched; }

  get sizeScaler () { return this._sizeScaler; }

  // SETTERS

  set touched (newVal) { this._touched = newVal; }

  createPort (id, name) {
    const port = new Port(
      this.context,
      this,
      this._type,
      id,
      name,
      this._color,
      this.getGlobalTouchedPort,
      this.getGlobalHoveredPort
    );
    port.adjustToScreenSize(this.radius, this.lineWidth, this.x, this.y);
    return port;
  }

  addPort (port) {
    this._ports.push(port);
    // update some draw settings that change when ports.length > 0
    this.shouldDrawGutter = this._type === utils.inType;
    this.drawnLineWidthScaler = 1;
  }

  getIndexOfPort (port) {
    for (let [i, p] of this._ports.entries()) {
      if (p === port) {
        return i;
      }
    }
    return undefined;
  }

  adjustToScreenSize (radius, lineWidth, x, y) {
    this.radius = radius;
    this.lineWidth = lineWidth;
    this.x = x;
    this.y = y;
    for (let port of this._ports) {
      port.adjustToScreenSize(this.radius, this.lineWidth, this.x, this.y);
    }
  }

  update (start, end, isSelected, sizeScaler) {
    // update this Arc's visual draw settings
    this._sizeScaler = sizeScaler;
    this._isSelected = isSelected;
    this.start = (start + this.angleOffset) % utils.PI2;
    this.end = (end + this.angleOffset) % utils.PI2;
    if (this.end < this.start) {
      this.end += utils.PI2;
    }
    this.drawnLineWidth = utils.clipValue(
      this.lineWidth * this.drawnLineWidthScaler, 1);
    this.updatePorts();
    if (this.shouldDrawGutter) {
      this.updateGutter();
    }
  }

  updateGutter() {
    // if it's an Input Arc and is selected, give it an inner grey "gutter"
    this.gutterThickness = Math.max(
      this.lineWidth * arcDefaults.gutterThicknessScaler, 1);
    this.gutterStart = this.start + (utils.PI2 * arcDefaults.gutterStartEndScaler);
    this.gutterEnd = this.end - (utils.PI2 * arcDefaults.gutterStartEndScaler);
  }

  updatePorts () {
    // update each Port's visual draw settings
    this.rotStep = (this.end - this.start) / this._ports.length;
    for (let [i, port] of this._ports.entries()) {
      const radLocation = this.start + (this.rotStep * i) + (this.rotStep / 2);
      port.update(this._sizeScaler, radLocation, this._isSelected);
    }
  }

  getPortNear (x, y) {
    for (let port of this._ports) {
      if (port.isUserTouching(x, y)) {
        return port;
      }
    }
    return undefined;
  }

  drawArc () {
    // save the context's state
    this.context.save();
    utils.drawArc(
      this.context,
      0, 0, this.radius, this.start, this.end,
      this.drawnLineWidth, this._color(), undefined
    )
    // draw a grey arc in the middle of the main arc
    if (this.shouldDrawGutter) {
      utils.drawArc(
        this.context,
        0, 0, this.radius, this.gutterStart, this.gutterEnd,
        this.gutterThickness, utils.colors.background(), undefined
      )
    }
    this.context.restore();
  }

  drawAllPortNames () {
    for (let port of this._ports) {
      this.drawPortName(port);
    }
  }

  drawPortName (port) {
    const indexOfPort = this.getIndexOfPort(port);
    const portRelRadsToPort = this.rotStep * indexOfPort;
    const radiansToTouchedPort = this.start + (this.rotStep / 2) + portRelRadsToPort;
    this.context.save();
    this.context.rotate(radiansToTouchedPort);
    port.drawName();
    this.context.restore();
  }

  drawPorts () {
    // draw the child Ports
    this.context.save();
    this.context.rotate((this.start + (this.rotStep / 2)) - (utils.PI * 0.5));
    for (let port of this._ports) {
      if (port.visible) {
        port.draw();
      }
      this.context.rotate(this.rotStep);
    }
    this.context.restore();
  }
}

export { Arc }
