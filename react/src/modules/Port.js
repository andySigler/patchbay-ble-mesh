import * as utils from './PatchbayUtils'

const portDefaults = {
  wobbleStep: 0.07,
  wobbleScaler: 0.1,
  lineWidthScaler: 0.4,
  minSizeScaler: 0.25, // percentage
  fillTextFontSizeScaler: 0.2,
  fontSizeScaler: 0.4
};

class Port {
  constructor (context, parent, type, id, name, color, getGlobalTouchedPort, getGlobalHoveredPort) {
    this.context = context;
    this._parent = parent;
    this._type = type;
    this._id = id;
    this._name = name;

    this.getGlobalTouchedPort = getGlobalTouchedPort;
    this.getGlobalHoveredPort = getGlobalHoveredPort;

    this.connections = {};

    this._x = 0;
    this._y = 0;
    this.textOffset = undefined;

    this._visible = false;
    this._sizeScaler = 0.0;

    this.parentX = 0;
    this.parentY = 0;
    this.parentRadius = undefined;
    this.parentWidth = undefined;

    this.wobbleCounter = Math.random() * utils.PI2;
    this.portRadius = undefined;
    this.drawnPortRadius = undefined;
    this.lineWidth = undefined;

    this.strokeStyle = utils.colors.background();
    this.fillStyle = color();
    this.highlightedFillStyle = utils.colors.white();
  }

  // GETTERS

  get visible () { return this._visible }

  get x () { return this._x }

  get y () { return this._y }

  get name () { return this._name; }

  get id () { return this._id; }

  get type () { return this._type; }

  get parent () { return this._parent; }

  get radius () { return this.portRadius; }

  get sizeScaler () { return this._sizeScaler; }

  // SETTERS

  set name (name) { this._name = name; }

  isTouched () {
    return Boolean(this.getGlobalTouchedPort() === this);
  }

  isPotentialConnection () {
    const port = this.getGlobalTouchedPort();
    return Boolean(port && port.type !== this._type);
  }

  isHovered () {
    return Boolean(this.getGlobalHoveredPort() === this);
  }

  adjustToScreenSize (parentRadius, parentWidth, parentX, parentY) {
    this.parentRadius = parentRadius;
    this.parentWidth = parentWidth;
    this.parentX = parentX;
    this.parentY = parentY;
  }

  update (sizeScaler, radLocation, isVisible) {
    // the Port is only visible if 1) told so by parent, and 2) is big enough
    this._visible = isVisible && sizeScaler > portDefaults.minSizeScaler;
    this._sizeScaler = !this._visible ? 0 : sizeScaler;
    // Ports need an absolute coordinate on the screen
    // because their position is used to determine when they are being
    // interacted with
    this._x = this.parentRadius * Math.cos(radLocation) + this.parentX;
    this._y = this.parentRadius * Math.sin(radLocation) + this.parentY;
    // drawArc() radius and stroke width
    this.lineWidth = Math.floor(this.portRadius * portDefaults.lineWidthScaler);
    this.portRadius = (this.parentWidth / 2) * this._sizeScaler;
    this.drawnPortRadius = Number(this.portRadius);
    // wobble the port's radius, if `touchedPort` is from the other circle
    if(this.isPotentialConnection()) {
      this.wobbleCounter = (this.wobbleCounter + portDefaults.wobbleStep) % utils.PI2;
      const wobbleMaxSize = portDefaults.wobbleScaler * this.portRadius;
      this.drawnPortRadius += Math.sin(this.wobbleCounter) * wobbleMaxSize;
    }
    // text settings
    this.textOffset = (this.parentRadius - (this.parentWidth / 2)) - this.lineWidth;
    this.fontSize = this._sizeScaler * this.parentWidth * portDefaults.fontSizeScaler;
  }

  draw () {;
    if(this._visible){
      this.context.save();
      utils.drawCircle(
        this.context,
        0, this.parentRadius,
        this.drawnPortRadius, this.lineWidth,
        this.strokeStyle, this.fillStyle
      )
      this.context.restore();
    }
  }

  drawName () {
    this.context.save();
    this.context.translate(this.textOffset, 0);
    if(this._x < this.parentX){
      this.context.textAlign = 'left';
      this.context.rotate(utils.PI);
    }
    else{
      this.context.textAlign = 'right';
    }
    this.context.font = utils.font(this.fontSize);
    if(this.isTouched() || this.isHovered()) {
      this.context.fillStyle = this.highlightedFillStyle;
    }
    else {
      this.context.fillStyle = this.fillStyle;
    }
    this.context.fillText(
      this._name, 0, this.fontSize * portDefaults.fillTextFontSizeScaler);
    this.context.restore();
  }

  isUserTouching (x, y) {
    const dist = utils.getDistance(this._x, this._y, x, y);
    if (this._visible && dist < this.portRadius) {
      return true;
    }
    return false;
  }
}

export { Port }
