import * as utils from './PatchbayUtils'
import { Arc } from './Arc'

const circleDefaults = {
  autoStepSize: 0.1,
  rotateFeedback: 0.85,
  padding: utils.PI / 200,
  textXOffsetScaler: 0.075,
  arcTextScaler: 0.04,
  typeFontSizeScaler: 0.025,
  labelOffsetYScaler: 2
};

class Circle {
  constructor (context, type, radiusPercentage, thicknessPercentage, getGlobalTouchedPort, getGlobalHoveredPort) {
    this.context = context;

    this._type = type;

    this.getGlobalTouchedPort = getGlobalTouchedPort;
    this.getGlobalHoveredPort = getGlobalHoveredPort;

    this.radiusPercentage = radiusPercentage;
    this.relativeLineWidth = thicknessPercentage;
    this.lineWidth = undefined;
    this.radius = undefined;
    this.typeFontSize = undefined;
    this.arcTextScaler = undefined;

    this._x = 0;
    this._y = 0;

    this._touched = false;

    this._arcs = [];

    this.arcStartEndPoints = [];
    this.expandedOffset = 0;
    this.rotatePercent = 0;
    this._radiansMoved = 0;

    this.isAutoMoving = false;
    this.autoTargetOffset = 0;
    this.autoStepTotal = 0;
    this.autoStepCount = 0;
  }

  // GETTERS

  get type () { return this._type; }

  get touched () { return this._touched; }

  get arcs () { return this._arcs; }

  get x () { return this._x; }

  get y () { return this._y; }

  // SETTERS

  set radiansMoved (newVal) { this._radiansMoved = newVal; }

  set x (newVal) { this._x = newVal; }

  set y (newVal) { this._y = newVal; }

  createArc (name, color, id) {
    const arc = new Arc(
      this.context,
      this,
      this._type,
      name,
      id,
      color,
      this.getGlobalTouchedPort,
      this.getGlobalHoveredPort
    );
    arc.adjustToScreenSize(this.radius, this.lineWidth, this.x, this.y);
    return arc;
  }

  addArc (arc) {
    this._arcs.push(arc);
    this.updateDimensionStuff();
  }

  deleteArc (arc) {
    for (let [i, a] of this._arcs.entries()) {
      if (arc === a) {
        this._arcs.splice(i, 1);
        if (this.expandedOffset >= this._arcs.length) {
          this.expandedOffset = this._arcs.length - 1;
        }
        this.updateDimensionStuff();
        return;
      }
    }
  }

  deleteArcFromId (id) {
    const arc = this.getArcFromId(id);
    if (arc) {
      this.deleteArc(arc);
    }
  }

  getArcFromId (id) {
    for (let arc of this._arcs) {
      if (arc.id === id) {
        return arc;
      }
    }
    return undefined;
  }

  holdsTouchedPort () {
    const port = this.getGlobalTouchedPort();
    return Boolean(port && port.type === this.type);
  }

  getExpandedArcs () {
    const arcs = [this._arcs[this.expandedOffset]];
    if (this.rotatePercent > 0 && this.rotatePercent < 1) {
      arcs.push(this._arcs[(this.expandedOffset + 1) % this._arcs.length]);
    }
    return arcs;
  }

  incrementArcOffset () {
    this.expandedOffset = (this.expandedOffset + 1) % this._arcs.length;
  }

  decrementArcOffset () {
    this.expandedOffset -= this.expandedOffset === 0 ? -this._arcs.length + 1 : 1;
  }

  adjustToScreenSize (screenSize) {
    this.lineWidth = this.relativeLineWidth * screenSize;
    this.radius = this.radiusPercentage * screenSize;
    this.typeFontSize = circleDefaults.typeFontSizeScaler * screenSize;
    this.arcTextScaler = circleDefaults.arcTextScaler * screenSize;
    for (let arc of this._arcs) {
      arc.adjustToScreenSize(this.radius, this.lineWidth, this.x, this.y);
    }
  }

  update () {
    if (this.isAutoMoving) {
      this.updateAutoMoving();
    }
    else {
      this.updateRotateDrag();
    }
    for (let i = 0; i < this._arcs.length; i++) {
      const [start, end] = this.transpose(i);
      const isExpanded = Boolean(i < 2);
      const arcIndex = (i + this.expandedOffset) % this._arcs.length;
      const sizeScaler = (this.expandedOffset === arcIndex) ? 1 - this.rotatePercent : this.rotatePercent;
      this._arcs[arcIndex].update(start, end, isExpanded, sizeScaler);
    }
  }

  updateRotateDrag () {
    if (this._radiansMoved === 0) {
      return
    }
    if (this._radiansMoved > utils.PI / 2) {
      this._radiansMoved = utils.PI - (this._radiansMoved % utils.PI);
      this._radiansMoved *= -1;
    }
    if (!this.touched) {
      this._radiansMoved *= circleDefaults.rotateFeedback;
      if (Math.abs(this._radiansMoved) < 0.0001) {
        this._radiansMoved = 0;
      }
    }

    let relativeMovement = this._radiansMoved / utils.PI2;
    if (relativeMovement > 0.5) {
      relativeMovement = 1 - (relativeMovement % 1);
    }
    else if (relativeMovement < -0.5) {
      relativeMovement = 1 + (relativeMovement % 1);
    }
    if (relativeMovement < 1 && relativeMovement > -1) {
      if (Math.abs(relativeMovement) < 0) {
        this.direction = -1;
      }
      else {
        this.direction = 1;
      }
      const animStep = relativeMovement / (1 / this._arcs.length);
      this.rotatePercent -= animStep;

      if (this.rotatePercent >= 1) {
        this.incrementArcOffset()
        this.rotatePercent -= 1;
      }
      else if (this.rotatePercent < 0) {
        this.decrementArcOffset();
        this.rotatePercent += 1;
      }
    }
  }

  updateDimensionStuff () {
    this.arcStartEndPoints = [];
    if (this._arcs.length === 1) {
      this.arcStartEndPoints = [
        {
          'start': utils.PI / 2,
          'end': utils.PI / 2
        }
      ];
    }
    else if (this._arcs.length === 2) {
      this.arcStartEndPoints = [
        {
          'start': utils.PI,
          'end': utils.PI2
        },
        {
          'start': 0,
          'end': utils.PI
        },
      ];
    }
    else{
      this.arcStartEndPoints[0] = {
        'start': utils.PI,
        'end': utils.PI2
      };
      const smallerWidth = utils.PI / (this._arcs.length - 1);
      for (let i = 1; i < this._arcs.length; i++) {
        this.arcStartEndPoints[i] = {
          'start': (i - 1) * smallerWidth,
          'end': i * smallerWidth
        };
      }
    }
  }

  transpose (i) {
    // `target` is the index of the neighboring arc
    // in the direction that we are rotating
    let target = i - 1;
    if (target < 0) {
      target = this._arcs.length + target;
    }
    else if (target >= this._arcs.length) {
      target = target % this._arcs.length;
    }
    // the start/end radians are pre-calculated when arcs are added/deleted
    //
    const realStart = this.arcStartEndPoints[i].start;
    let startDiff = this.arcStartEndPoints[target].start - realStart;
    const realEnd = this.arcStartEndPoints[i].end;
    let endDiff = this.arcStartEndPoints[target].end - realEnd;
    if (i === 1) {
      startDiff = startDiff * -1;
      endDiff = -utils.PI2 + endDiff;
    }

    let currentStart = (startDiff * this.rotatePercent) + realStart;
    let currentEnd = (endDiff * this.rotatePercent) + realEnd;
    if (currentStart > utils.PI2) {
      currentStart = currentStart % utils.PI2;
    }
    else if (currentStart < 0) {
      currentStart += utils.PI2;
    }
    if (currentEnd > utils.PI2) {
      currentEnd = currentEnd % utils.PI2;
    }
    else if (currentEnd < 0) {
      currentEnd += utils.PI2;
    }
    return [
      currentStart + circleDefaults.padding,
      currentEnd - circleDefaults.padding
    ];
  }

  updateAutoMoving () {
    if (this.autoStepCount < this.autoStepTotal) {
      this.rotatePercent += this.autoStepSize;
      this.autoStepCount++;
      if (this.rotatePercent >= 1) {
        this.incrementArcOffset();
        this.rotatePercent = 0;
      }
      else if (this.rotatePercent < 0) {
        this.decrementArcOffset();
        this.rotatePercent = 1 + this.rotatePercent;
      }
    }
    else {
      this.isAutoMoving = false;
      this.expandedOffset = this.autoTargetOffset;
      this.rotatePercent = 0;
    }
  }

  drawArcs () {
    if (this._arcs.length > 0) {
      this.context.save();
      this.context.translate(this._x, this._y);
      this.context.textAlign = 'center';

      // draw the TYPE text in the center of the Circle
      let labelOffsetYScaler = circleDefaults.labelOffsetYScaler;
      labelOffsetYScaler *= (this._type === utils.inType) ? -1 : 1;
      const typeYOffset = this.typeFontSize * labelOffsetYScaler;
      this.context.font = utils.font(this.typeFontSize);
      this.context.fillStyle = utils.colors.black();
      this.context.fillText(this._type.toUpperCase(), 0, typeYOffset);

      // then draw the currently displayed arc's name
      const arc0 = this._arcs[this.expandedOffset];
      const arc0FontSize = this.arcTextScaler * arc0.sizeScaler;
      let xOffset0 = this.lineWidth * this.arcTextScaler * this.rotatePercent;
      if (arc0.type === utils.outType) {
        xOffset0 *= -1;
      }
      xOffset0 *= circleDefaults.textXOffsetScaler;
      this.context.font = utils.font(arc0FontSize);
      this.context.fillStyle = arc0.color(Math.min(arc0.sizeScaler, 1));
      this.context.fillText(arc0.name, xOffset0, 0);

      // draw the next-in-line Arc's label (fading in/out)
      const arc1 = this._arcs[(this.expandedOffset + 1) % this._arcs.length];
      const arc1FontSize = this.arcTextScaler * arc1.sizeScaler;
      let xOffset1 = this.lineWidth * this.arcTextScaler * (1 - this.rotatePercent);
      if (arc1.type === utils.outType) {
        xOffset1 *= -1;
      }
      xOffset1 *= circleDefaults.textXOffsetScaler;
      xOffset1 *= -1;
      this.context.font = utils.font(arc1FontSize);
      this.context.fillStyle = arc1.color(Math.min(arc1.sizeScaler, 1));
      this.context.fillText(arc1.name, xOffset1, 0);

      // now draw the actual child Arcs
      for (let i = 0; i < this._arcs.length; i++) {
        this._arcs[i].drawArc();
      }

      this.context.restore();
    }
  }

  drawNames () {
    this.context.save();
    this.context.translate(this._x, this._y);
    if (!this.holdsTouchedPort()) {
      for (let arc of this._arcs) {
        if (arc.isSelected) {
          arc.drawAllPortNames();
        }
      }
    }
    else {
      // the touched port is in this circle, so only draw it's name
      const port = this.getGlobalTouchedPort();
      const parentArc = port.parent;
      parentArc.drawPortName(port);
    }
    this.context.restore();
  }

  drawPorts () {
    this.context.save();
    this.context.translate(this._x, this._y);
    for (let arc of this._arcs) {
      if (arc.isSelected) {
        arc.drawPorts();
      }
    }
    this.context.restore();
  }

  mouseEvent (fingerX, fingerY, compRadian) {
    for (let arc of this.getExpandedArcs()) {
      const port = arc.getPortNear(fingerX, fingerY);
      if (port) {
        this._touched = false;
        return port;
      }
    }
    this._touched = true;
    // see which arc was touched
    for (let arc of this._arcs) {
      if (compRadian > arc.start && compRadian < arc.end) {
        arc.touched = true;
        break;
      }
    }
    return undefined;
  }

  startAutoMove (newOffset) {
    this.autoTargetOffset = newOffset;
    this.isAutoMoving = true;
    const moveUp = newOffset - (this.expandedOffset + this._arcs.length);
    const moveDown = newOffset - this.expandedOffset;
    let arcsToMove = moveUp - this.rotatePercent;
    if (Math.abs(moveUp) > Math.abs(moveDown)) {
      if (Math.abs(moveDown) > this._arcs.length / 2) {
        arcsToMove = moveDown + this._arcs.length + this.rotatePercent;
      }
      else if (moveDown === 0) {
        arcsToMove = (moveDown - this.rotatePercent) % this._arcs.length;
      }
      else {
        arcsToMove = (moveDown + this.rotatePercent) % this._arcs.length;
      }
    }
    this.autoStepSize = circleDefaults.autoStepSize;
    this.autoStepTotal = arcsToMove / this.autoStepSize;
    if (this.autoStepTotal < 0) {
      this.autoStepTotal *= -1;
      this.autoStepSize *= -1;
    }
    this.autoStepCount = 0;
  }

  isCloseTo (x, y) {
    const distFromCenter = utils.getDistance(this._x, this._y, x, y);
    const halfWidth = this.lineWidth / 2;
    const outerRad = this.radius + halfWidth;
    const innerRad = this.radius - halfWidth;
    if (distFromCenter <= outerRad && distFromCenter >= innerRad) {
      return true;
    }
    return false;
  }

  tapEvent () {
    if (this._touched) {
      for (let i = 0; i < this._arcs.length; i++) {
        if (this._arcs[i].touched) {
          this.startAutoMove(i);
        }
      }
    }
    this.clearTouchedHovered();
  }

  clearTouchedHovered () {
    this._touched = false;
    for (let i = 0; i < this._arcs.length; i++) {
      this._arcs[i].touched = false;
    }
  }
}

export { Circle }
