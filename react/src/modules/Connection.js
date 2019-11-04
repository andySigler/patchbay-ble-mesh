import * as utils from './PatchbayUtils'

const cordDefaults = {
  lineWidthPixels: 3,
  screenSizeScaler: 0.02,
  wobbleStep: 0.05,
  wobbleScaler: 0.2,
  crossSignThicknessScaler: 0.75,
  crossSignScaler: 0.6
};

class Connection {
  constructor (context, inPort, outPort) {
    this.context = context;
    this.name = this.constructor.generateName(inPort, outPort);

    this.inPort = inPort;
    this.outPort = outPort;

    this._selected = false;

    // the location and size of the delete circle
    this._x = undefined;
    this._y = undefined;
    this._radius = undefined;
    this._lineWidth = undefined;

    // some variables to keep track of the sinusoidal pulsing
    // when hovered for deletion
    this.wobbleCounter = Math.random() * utils.PI2;
    this.wobbledRadius = undefined;
    this.crossSignThickness = undefined;
    this.crossSignRadius = undefined;

    // colors
    this.lineFill = undefined;
    this.lineStroke = undefined;
    this.delCircleFill = undefined;
    this.delCircleStroke = undefined;
  }

  static generateName(inPort, outPort) {
    const inArcID = inPort.parent.id;
    const inPortID = inPort.id;
    const outArcID = outPort.parent.id;
    const outPortID = outPort.id;
    return String(
      inArcID + '/' + inPortID + '->' + outArcID + '/' + outPortID);
  }

  // GETTERS

  get selected () { return this._selected }

  get x () { return this._x }

  get y () { return this._y }

  get visible () { return Boolean(this.inPort.visible && this.outPort.visible); }

  get sizeScaler () {
    return Math.min(this.inPort.sizeScaler, this.outPort.sizeScaler);
  }

  // SETTERS

  set selected (newVal) { this._selected = newVal; }

  adjustToScreenSize (screenSize) {
    this._radius = screenSize * cordDefaults.screenSizeScaler;
  }

  update () {
    if (this.visible) {

      this._lineWidth = cordDefaults.lineWidthPixels * this.sizeScaler;

      // colors
      this.lineFill = utils.colors.white(this.sizeScaler);
      this.lineStroke = utils.colors.white(this.sizeScaler);

      if (this._selected) {
        // the coordinate where a deletion circle would be
        // will be halfway between the two ports
        this._x = ((this.outPort.x - this.inPort.x) / 2) + this.inPort.x;
        this._y = ((this.outPort.y - this.inPort.y) / 2) + this.inPort.y;
        this.wobbleCounter = (this.wobbleCounter + cordDefaults.wobbleStep) % utils.PI2;
        const wobbleRadiusAdder = Math.sin(this.wobbleCounter) * cordDefaults.wobbleScaler * this._radius;
        const wobbledRadius = this._radius + wobbleRadiusAdder;
        this.wobbledRadius = wobbledRadius * this.sizeScaler;
        this.crossSignRadius = this.wobbledRadius * cordDefaults.crossSignScaler;
        this.crossSignThickness = this._lineWidth * cordDefaults.crossSignThicknessScaler;
        // colors
        this.lineStroke = utils.colors.delete(this.sizeScaler);
        this.delCircleFill = utils.colors.white(this.sizeScaler);
        this.delCircleStroke = utils.colors.delete(this.sizeScaler);
      }
    }
  }

  draw () {
    if(this.visible){
      this.context.save();
      utils.drawLine(
        this.context,
        this.outPort.x, this.outPort.y, this.inPort.x, this.inPort.y,
        this._lineWidth, this.lineStroke
      );
      // draw the two circles on top of that line, inside each port
      // these make the edges of the line look a bit nicer
      utils.drawCircle(
        this.context,
        this.outPort.x, this.outPort.y,
        this._lineWidth, 0, // use the line's width for a radius
        undefined, this.lineFill
      )
      utils.drawCircle(
        this.context,
        this.inPort.x, this.inPort.y,
        this._lineWidth, 0, // use the line's width for a radius
        undefined, this.lineFill
      )
      this.context.restore();
      if(this._selected){
        this.drawDeleteCircle();
      }
    }
  }

  drawDeleteCircle () {
    this.context.save();
    this.context.translate(this._x, this._y);
    // the cross's bounding circle
    utils.drawCircle(
      this.context,
      0, 0,
      this.wobbledRadius, this._lineWidth,
      this.delCircleStroke, this.delCircleFill
    )
    // two lines, to create a cross "X"
    this.context.rotate(utils.PI / 4);
    utils.drawLine(
      this.context,
      0, this.crossSignRadius, 0, -this.crossSignRadius,
      this.crossSignThickness, this.delCircleStroke
    );
    this.context.rotate(-utils.PI / 2);
    utils.drawLine(
      this.context,
      0, this.crossSignRadius, 0, -this.crossSignRadius,
      this.crossSignThickness, this.delCircleStroke
    );
    // restore the context's state
    this.context.restore();
  }

  isUserTouching (x, y) {
    if (!this._selected) {
      return false;
    }
    const dist = utils.getDistance(x, y, this._x, this._y);
    if (dist < this._radius) {
      return true;
    }
    return false;
  }
}

export { Connection }
