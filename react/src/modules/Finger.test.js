import * as utils from './PatchbayUtils'
import { Finger } from './Finger'
import { Circle } from './Circle'

const createTestingCircle = (type, finger) => {
  return new Circle(
    utils.fakeContext,
    type,
    0.2,
    0.1,
    () => finger.touchedPort,
    () => finger.hoveredPort
  );
};

const addTestingArcPort = (circle, name, type) => {
  const arc = circle.createArc(`${name}ArcName`, utils.colors.white, `${name}ArcID`);
  const port = arc.createPort(`${name}${type}PortID`, `${name}${type}PortName`);
  arc.addPort(port);
  circle.addArc(arc);
};

describe('Test the Finger class', () => {

  let testFinger = undefined;

  beforeEach(() => {
    const inCircle = createTestingCircle(utils.inType, testFinger);
    const outCircle = createTestingCircle(utils.outType, testFinger);
    addTestingArcPort(inCircle, 'that', utils.inType);
    addTestingArcPort(outCircle, 'that', utils.outType);
    testFinger = new Finger(
      utils.fakeContext, inCircle, outCircle, {}, () => {}, () => {})
  });

  test('can be created without breaking', () => {
    expect(testFinger.isTouchingScreen).toEqual(false);
    expect(testFinger.radiansNew).toEqual(testFinger.radiansPrev);
    expect(testFinger.touchedPort).toEqual(undefined);
    expect(testFinger.hoveredPort).toEqual(undefined);
  });

  test('can handle mouse events', () => {
    testFinger.adjustToScreenSize(500);
    testFinger.touchEvent(100, 200);
    expect(testFinger.x).toEqual(100);
    expect(testFinger.y).toEqual(200);
    expect(testFinger.isTouchingScreen).toEqual(true);
    testFinger.moveEvent(110, 200);
    expect(testFinger.x).toEqual(110);
    expect(testFinger.y).toEqual(200);
    expect(testFinger.isTouchingScreen).toEqual(true);
    testFinger.releaseEvent(110, 200);
    expect(testFinger.x).toEqual(110);
    expect(testFinger.y).toEqual(200);
    expect(testFinger.isTouchingScreen).toEqual(false);
  });

  test('can update and draw without breaking', () => {
    testFinger.adjustToScreenSize(500);
    testFinger.update();
    testFinger.draw();
    testFinger.touchEvent(100, 200);
    testFinger.moveEvent(110, 200);
    testFinger._touchedPort = testFinger.inCircle.arcs[0].ports[0];
    testFinger.update();
    testFinger.draw();
    testFinger._hoveredPort = testFinger.outCircle.arcs[0].ports[0];
    testFinger.update();
    testFinger.draw();
    testFinger.releaseEvent(110, 200);
    testFinger.update();
    testFinger.draw();
    expect(testFinger.hoveredPort).toEqual(undefined);
    expect(testFinger.touchedPort).toEqual(undefined);
  });

});
