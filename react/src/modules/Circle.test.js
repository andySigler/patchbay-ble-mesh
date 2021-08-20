import * as utils from './PatchbayUtils'
import { Circle } from './Circle'

describe('Testing the Circle class', () => {
  let testCircle = undefined;
  let touchedPort = undefined;
  let hoveredPort = undefined;

  beforeEach(() => {
    touchedPort = undefined
    hoveredPort = undefined
    testCircle = new Circle(
      utils.fakeContext,    // context
      utils.inType,         // type
      0.2,                  // radiusPercentage
      0.1,                  // thicknessPercentage
      () => touchedPort,    // getGlobalTouchedPort
      () => hoveredPort     // getGlobalHoveredPort
    );
  });

  test('can be created', () => {
    expect(testCircle.type).toEqual(utils.inType);
  });

  test('can create arcs', () => {
    const arc = testCircle.createArc('someArc', utils.colors.black, 'someID');
    expect(arc.id).toEqual('someID');
    expect(arc.type).toEqual(testCircle.type);
    expect(arc.parent).toEqual(testCircle);
    testCircle.addArc(arc);
    expect(testCircle.arcs.length).toEqual(1);
    testCircle.addArc(testCircle.createArc('otherArc', utils.colors.black, 'otherID'));
    expect(testCircle.arcs.length).toEqual(2);
  });

  test('can delete arcs', () => {
    const arc1 = testCircle.createArc('someArc', utils.colors.black, 'someID');
    const arc2 = testCircle.createArc('otherArc', utils.colors.black, 'otherID');
    testCircle.addArc(arc1);
    testCircle.addArc(arc2);
    expect(testCircle.arcs.length).toEqual(2);
    testCircle.deleteArc(arc1);
    expect(testCircle.arcs.length).toEqual(1);
    testCircle.deleteArcFromId(arc2.id);
    expect(testCircle.arcs.length).toEqual(0);
  });

  test('can know it holds the touched port', () => {
    expect(testCircle.holdsTouchedPort()).toEqual(false);
    touchedPort = {type: utils.inType};
    expect(testCircle.holdsTouchedPort()).toEqual(true);
  });

  test('can update and draw without breaking', () => {
    const arc1 = testCircle.createArc('someArc', utils.colors.black, 'someID');
    const arc2 = testCircle.createArc('otherArc', utils.colors.black, 'otherID');
    testCircle.addArc(arc1);
    testCircle.addArc(arc2);
    testCircle.adjustToScreenSize(800);
    testCircle.update();
    testCircle.drawArcs();
    testCircle.drawNames();
    testCircle.drawPorts();
  });

  test('can know when it is being interacted with', () => {
    testCircle.x = 400;
    testCircle.y = 400;
    testCircle.adjustToScreenSize(800);
    expect(testCircle.isCloseTo(400, 400)).toEqual(false);
    expect(testCircle.isCloseTo(560, 400)).toEqual(true);
    expect(testCircle.isCloseTo(521, 400)).toEqual(true);
    expect(testCircle.isCloseTo(519, 400)).toEqual(false);
  });

});



