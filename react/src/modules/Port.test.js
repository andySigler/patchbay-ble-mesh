import * as utils from './PatchbayUtils'
import { Port } from './Port'

describe('Testing the Port class', () => {
  const inCircle = {};
  const outCircle = {};
  const inArc = {};
  const outArc = {};
  let touchedPort = undefined;
  let hoveredPort = undefined;
  let testPort = undefined;
  const getTouchedPort = () => touchedPort;
  const getHoveredPort = () => hoveredPort

  beforeEach(() => {
    touchedPort = undefined;
    hoveredPort = undefined;
    testPort = new Port(
      utils.fakeContext,
      inArc,
      utils.inType,
      42,
      'portName',
      utils.colors.black,
      getTouchedPort,
      getHoveredPort
    );
  });

  test('can be created', () => {
    expect(testPort.fillStyle).toEqual(utils.colors.black());
    expect(testPort.strokeStyle).toEqual(utils.colors.background());
    expect(testPort.highlightedFillStyle).toEqual(utils.colors.white());
    expect(testPort.type).toEqual(utils.inType);
    expect(testPort.id).toEqual(42);
  });

  test('gets a new name', () => {
    testPort.name = 'andy';
    expect(testPort.name).toEqual('andy');
    testPort.name = 'sigler';
    expect(testPort.name).toEqual('sigler');
  });

  test('updates when the screen adjusts', () => {
    testPort.adjustToScreenSize(30, 10, 100, 100);
    expect(testPort.parentRadius).toEqual(30);
    expect(testPort.parentWidth).toEqual(10);
    expect(testPort.parentX).toEqual(100);
    expect(testPort.parentY).toEqual(100);
    testPort.adjustToScreenSize(10, 15, 200, 100);
    expect(testPort.parentRadius).toEqual(10);
    expect(testPort.parentWidth).toEqual(15);
    expect(testPort.parentX).toEqual(200);
    expect(testPort.parentY).toEqual(100);
  });

  test('updates the visiblilty and scale', () => {
    testPort.adjustToScreenSize(30, 10, 100, 100);
    testPort.update(1.0, 0.0, true);
    expect(testPort.sizeScaler).toEqual(1.0);
    expect(testPort.visible).toEqual(true);
    testPort.update(0.8, 0.0, true);
    expect(testPort.sizeScaler).toEqual(0.8);
    expect(testPort.visible).toEqual(true);
    testPort.update(1.0, 0.0, false);
    expect(testPort.sizeScaler).toEqual(0.0);
    expect(testPort.visible).toEqual(false);
    testPort.update(0.0, 0.0, false);
    expect(testPort.sizeScaler).toEqual(0.0);
    expect(testPort.visible).toEqual(false);
    testPort.update(0.0, 0.0, true);
    expect(testPort.sizeScaler).toEqual(0.0);
    expect(testPort.visible).toEqual(false);
    testPort.update(0.05, 0.0, true);
    expect(testPort.sizeScaler).toEqual(0.0);
    expect(testPort.visible).toEqual(false);
  });

  test('updates the absolute XY position', () => {
    testPort.adjustToScreenSize(30, 10, 100, 100);
    testPort.update(1.0, 0.0, true);
    expect(testPort.x).toEqual(130);
    expect(testPort.y).toEqual(100);
    testPort.update(1.0, Math.PI, true);
    expect(testPort.x).toEqual(70);
    expect(testPort.y).toEqual(100);
    testPort.update(1.0, Math.PI * 0.5, true);
    expect(testPort.x).toEqual(100);
    expect(testPort.y).toEqual(130);
    testPort.update(1.0, Math.PI * 1.5, true);
    expect(testPort.x).toEqual(100);
    expect(testPort.y).toEqual(70);
  });

  test('can draw without breaking', () => {
    testPort.adjustToScreenSize(30, 10, 100, 100);
    testPort.update(1.0, 0.0, true);
    testPort.draw();
    testPort.drawName();
  });

  test('knows when it is touched', () => {
    expect(testPort.isTouched()).toEqual(false);
    touchedPort = testPort;
    expect(testPort.isTouched()).toEqual(true);
    touchedPort = undefined;
    expect(testPort.isTouched()).toEqual(false);
  });

  test('knows when it is hovered', () => {
    expect(testPort.isHovered()).toEqual(false);
    hoveredPort = testPort;
    expect(testPort.isHovered()).toEqual(true);
    hoveredPort = undefined;
    expect(testPort.isHovered()).toEqual(false);
  });

  test('knows when it is a potential input', () => {
    const p2 = new Port(
      utils.fakeContext,
      outArc,
      utils.outType,
      0,
      'p2',
      utils.colors.white,
      getTouchedPort,
      getHoveredPort
    );
    expect(testPort.type).toEqual(utils.inType);
    expect(p2.type).toEqual(utils.outType);
    expect(testPort.isPotentialConnection()).toEqual(false);
    touchedPort = p2;
    expect(testPort.isPotentialConnection()).toEqual(true);
    touchedPort = testPort;
    expect(testPort.isPotentialConnection()).toEqual(false);
    touchedPort = undefined;
    expect(testPort.isPotentialConnection()).toEqual(false);
  });

  test('knows when the user is touching it', () => {
    testPort.adjustToScreenSize(30, 10, 100, 100);
    testPort.update(1.0, 0.0, true);
    expect(testPort.x).toEqual(130);
    expect(testPort.y).toEqual(100);
    expect(testPort.visible).toEqual(true);
    expect(testPort.sizeScaler).toEqual(1.0);
    expect(testPort.parentWidth).toEqual(10);
    expect(testPort.portRadius).toEqual(5);
    expect(testPort.isUserTouching(130, 100)).toEqual(true);
    expect(testPort.isUserTouching(134, 100)).toEqual(true);
    expect(testPort.isUserTouching(135, 100)).toEqual(false);
  });

});
