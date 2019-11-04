import * as utils from './PatchbayUtils'
import { Connection } from './Connection'

describe('Testing the Connection', () => {
  const inArc = {id: 0};
  const outArc = {id: 1};
  const defaultInPort = {
    parent: inArc,
    type: utils.inType,
    id: 2,
    visible: true,
    sizeScaler: 1.0,
    x: 0,
    y: 0
  };
  const defaultOutPort = {
    parent: outArc,
    type: utils.outType,
    id: 3,
    visible: true,
    sizeScaler: 1.0,
    x: 100,
    y: 80
  };
  let testConnection = undefined;
  let inPort, outPort;

  beforeEach(() => {
    inPort = Object.assign({}, defaultInPort);
    outPort = Object.assign({}, defaultOutPort);
    testConnection = new Connection(utils.fakeContext, inPort, outPort);
  });

  afterEach(() => {
  });

  test('can be created', () => {
    expect(testConnection.name).toEqual('0/2->1/3');
  });

  test('can generate names from ports', () => {
    expect(Connection.generateName(inPort, outPort)).toEqual('0/2->1/3');
    inPort.id = 42;
    outPort.id = 69;
    expect(Connection.generateName(inPort, outPort)).toEqual('0/42->1/69');
  });

  test('visible flag', () => {
    inPort.visible = false;
    outPort.visible = false;
    expect(testConnection.visible).toEqual(false);
    inPort.visible = true;
    outPort.visible = false;
    expect(testConnection.visible).toEqual(false);
    inPort.visible = false;
    outPort.visible = true;
    expect(testConnection.visible).toEqual(false);
    inPort.visible = true;
    outPort.visible = true;
    expect(testConnection.visible).toEqual(true);
  });

  test('size scaler', () => {
    inPort.sizeScaler = 0.0;
    outPort.sizeScaler = 0.0;
    expect(testConnection.sizeScaler).toEqual(0.0);
    inPort.sizeScaler = 0.0;
    outPort.sizeScaler = 1.0;
    expect(testConnection.sizeScaler).toEqual(0.0);
    inPort.sizeScaler = 1.0;
    outPort.sizeScaler = 0.0;
    expect(testConnection.sizeScaler).toEqual(0.0);
    inPort.sizeScaler = 0.3;
    outPort.sizeScaler = 0.31;
    expect(testConnection.sizeScaler).toEqual(0.3);
  });

  test('updates variables', () => {
    testConnection.adjustToScreenSize(500);
    testConnection.update();
    expect(testConnection.lineStroke).toEqual(utils.colors.white());
    expect(testConnection._lineWidth).toBeGreaterThan(0);
  });

  test('updates variables while selected', () => {
    testConnection.adjustToScreenSize(500);
    testConnection.selected = true;
    testConnection.update();
    expect(testConnection.x).toEqual(50);
    expect(testConnection.y).toEqual(40);
    expect(testConnection.lineStroke).toEqual(utils.colors.delete());
    expect(testConnection.wobbledRadius).toBeGreaterThan(0);
    expect(testConnection.crossSignThickness).toBeGreaterThan(0);
    expect(testConnection.crossSignRadius).toBeGreaterThan(0);
  });

  test('it can draw without breaking', () => {
    testConnection.adjustToScreenSize(500);
    testConnection.selected = false;
    testConnection.update();
    testConnection.draw();
    testConnection.selected = true;
    testConnection.update();
    testConnection.draw();
  });

  test('it can detect when user is touching it', () => {
    testConnection.adjustToScreenSize(500);
    testConnection.selected = true;
    testConnection.update();
    expect(testConnection.x).toEqual(50);
    expect(testConnection.y).toEqual(40);
    expect(testConnection.isUserTouching(50, 40)).toEqual(true);
    expect(testConnection.isUserTouching(70, 20)).toEqual(false);
    testConnection.selected = false;
    expect(testConnection.isUserTouching(50, 40)).toEqual(false);
  });

});

