import * as utils from './PatchbayUtils'
import { Arc } from './Arc'

describe('Testing the Arc class', () => {
  const testCircle = {};
  let testArc = undefined;
  let touchedPort = undefined;
  let hoveredPort = undefined;
  const getTouchedPort = () => touchedPort;
  const getHoveredPort = () => hoveredPort;

  beforeEach(() => {
    testArc = new Arc(
      utils.fakeContext,
      testCircle,
      utils.inType,
      'arcName',
      'randomID',
      utils.colors.black,
      getTouchedPort,
      getHoveredPort
    );
  });

  afterEach(() => {
  });

  test('can be created', () => {
    expect(testArc.name).toEqual('arcName');
    expect(testArc.id).toEqual('randomID');
  });

  test('can have ports added to it', () => {
    expect(testArc.ports.length).toEqual(0);
    const port1 = testArc.createPort('someRandomID', 'someRandomName');
    testArc.addPort(port1);
    expect(testArc.ports.length).toEqual(1);
  });

  test('can tell if it should draw a gutter', () => {
    expect(testArc.ports.length).toEqual(0);
    const port1 = testArc.createPort('someRandomID', 'someRandomName');
    testArc.addPort(port1);
    expect(testArc.ports.length).toEqual(1);
    expect(testArc.type).toEqual(utils.inType);
    expect(testArc.shouldDrawGutter).toEqual(true);
    testArc._type = utils.outType;
    const port2 = testArc.createPort('anotherRandomID', 'anotherRandomName');
    testArc.addPort(port2);
    expect(testArc.ports.length).toEqual(2);
    expect(testArc.type).toEqual(utils.outType);
    expect(testArc.shouldDrawGutter).toEqual(false);
  });

  test('returns the index of a port', () => {
    const port1 = testArc.createPort('someRandomID', 'someRandomName');
    testArc.addPort(port1);
    expect(testArc.getIndexOfPort(port1)).toEqual(0);
    const port2 = testArc.createPort('anotherRandomID', 'anotherRandomName');
    testArc.addPort(port2);
    expect(testArc.getIndexOfPort(port2)).toEqual(1);
    const port3 = testArc.createPort('finalRandomID', 'finalRandomName');
    expect(testArc.getIndexOfPort(port3)).toEqual(undefined);
  });

  test('can update without breaking', () => {
    testArc.adjustToScreenSize(50, 10, 50, 50);
    testArc.update(0, Math.PI, true, 1.0);
    testArc.update(0, Math.PI, false, 0.0);
    testArc.update(0, Math.PI / 10, false, 0.0);
    const port1 = testArc.createPort('someRandomID', 'someRandomName');
    const port2 = testArc.createPort('anotherRandomID', 'anotherRandomName');
    testArc.addPort(port1);
    testArc.addPort(port2);
    testArc.update(0, Math.PI, true, 1.0);
    testArc.update(0, Math.PI, false, 0.0);
    testArc.update(0, Math.PI / 10, false, 0.0);
  });

  test('can get the user touched port', () => {
    const port1 = testArc.createPort('someRandomID', 'someRandomName');
    const port2 = testArc.createPort('anotherRandomID', 'anotherRandomName');
    testArc.addPort(port1);
    testArc.addPort(port2);
    testArc.adjustToScreenSize(50, 10, 50, 50);
    testArc.update(0, Math.PI, true, 1.0);
    port1._x = 10;
    port1._y = 10;
    port2._x = 110;
    port2._y = 110;
    expect(testArc.getPortNear(10, 10)).toEqual(port1);
    expect(testArc.getPortNear(110, 110)).toEqual(port2);
    testArc.update(0, Math.PI, false, 0.0);
    port1._x = 10;
    port1._y = 10;
    port2._x = 110;
    port2._y = 110;
    expect(testArc.getPortNear(10, 10)).toEqual(undefined);
    expect(testArc.getPortNear(110, 110)).toEqual(undefined);
    testArc.update(0, Math.PI, true, 1.0);
    port1._x = 10;
    port1._y = 10;
    port2._x = 110;
    port2._y = 110;
    expect(testArc.getPortNear(30, 30)).toEqual(undefined);
    expect(testArc.getPortNear(130, 130)).toEqual(undefined);
  });

  test('can draw without breaking', () => {
    testArc.adjustToScreenSize(50, 10, 50, 50);
    testArc.update(0, Math.PI, true, 1.0);
    testArc.drawArc();
    testArc.drawAllPortNames();
    testArc.drawPorts();
    testArc.update(0, Math.PI, false, 0.0);
    testArc.drawArc();
    testArc.drawAllPortNames();
    testArc.drawPorts();
    const port1 = testArc.createPort('someRandomID', 'someRandomName');
    const port2 = testArc.createPort('anotherRandomID', 'anotherRandomName');
    testArc.addPort(port1);
    testArc.addPort(port2);
    testArc.update(0, Math.PI, true, 1.0);
    testArc.drawArc();
    testArc.drawAllPortNames();
    testArc.drawPorts();
    testArc.update(0, Math.PI, false, 0.0);
    testArc.drawArc();
    testArc.drawAllPortNames();
    testArc.drawPorts();
  });

});


