import * as utils from './PatchbayUtils'
import { Patchbay } from './Patchbay'
import { Connection } from './Connection'

const addTestingArc = (patchbay, name) => {
  const inArc = patchbay.inCircle.createArc(
    `${name}ArcName`, utils.colors.black, `${name}ArcID`);
  const outArc = patchbay.outCircle.createArc(
    `${name}ArcName`, utils.colors.black, `${name}ArcID`);
  inArc.addPort(inArc.createPort(`${name}PortInID`, `${name}PortInName`));
  outArc.addPort(outArc.createPort(`${name}PortOutID`, `${name}PortOutName`));
  patchbay.inCircle.addArc(inArc);
  patchbay.outCircle.addArc(outArc);
};

describe('Testing the Patchbay class', () => {

  let testPatchbay = undefined;

  beforeEach(() => {
    testPatchbay = new Patchbay(utils.fakeContext);
    addTestingArc(testPatchbay, 'some');
    addTestingArc(testPatchbay, 'other');
    addTestingArc(testPatchbay, 'random');
  });

  test('can be created', () => {
    expect(testPatchbay.context).toEqual(utils.fakeContext);
    expect(testPatchbay.inCircle.type).toEqual(utils.inType);
    expect(testPatchbay.outCircle.type).toEqual(utils.outType);
  });

  test('can set the size of the canvas', () => {
    testPatchbay.setSize(300, 200);
    expect(testPatchbay.width).toEqual(300);
    expect(testPatchbay.height).toEqual(200);
    expect(testPatchbay.screenSize).toEqual(200);
    expect(testPatchbay.inCircle.x).toBeLessThan(150);
    expect(testPatchbay.inCircle.y).toBeLessThan(100);
    expect(testPatchbay.outCircle.x).toBeGreaterThan(150);
    expect(testPatchbay.outCircle.y).toBeGreaterThan(100);
  });

  test('can run the draw loop without breaking', () => {
    testPatchbay.setSize(300, 200);
    testPatchbay.drawLoop();
    cancelAnimationFrame(testPatchbay.reqAnimFrame);
  });

  test('can create and delete new connections', () => {
    testPatchbay.setSize(300, 200);
    const inPort = testPatchbay.inCircle.arcs[0].ports[0];
    const outPort = testPatchbay.outCircle.arcs[1].ports[0];
    const conn = testPatchbay.createConnection(inPort, outPort);
    const expectedName = Connection.generateName(inPort, outPort);
    expect(conn.inPort).toEqual(inPort);
    expect(conn.outPort).toEqual(outPort);
    expect(conn.name).toEqual(expectedName)
    expect(testPatchbay.connections).toEqual({});
    testPatchbay.saveConnection(conn);
    const expectedConnections = {};
    expectedConnections[expectedName] = conn;
    expect(testPatchbay.connections).toEqual(expectedConnections);
    testPatchbay.deleteConnection(conn);
    expect(testPatchbay.connections).toEqual({});
    testPatchbay.saveConnection(conn);
    expect(testPatchbay.connections).toEqual(expectedConnections);
    testPatchbay.deleteConnectionByName(conn.name);
    expect(testPatchbay.connections).toEqual({});
  });

});
