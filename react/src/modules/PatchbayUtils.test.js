import * as utils from './PatchbayUtils'

describe('Testing Patchbay Utils', () => {

  it('creates white color strings', () => {
    expect(utils.colors.white()).toEqual(`rgba(255, 255, 255, ${1.0})`);
    expect(utils.colors.white(1.0)).toEqual(`rgba(255, 255, 255, ${1.0})`);
    expect(utils.colors.white(0.5)).toEqual(`rgba(255, 255, 255, ${0.5})`);
    expect(utils.colors.white(0.0)).toEqual(`rgba(255, 255, 255, ${0.0})`);
    expect(utils.colors.white(-1.0)).toEqual(`rgba(255, 255, 255, ${0.0})`);
    expect(utils.colors.white(2.0)).toEqual(`rgba(255, 255, 255, ${1.0})`);
  });

  it('creates black color strings', () => {
    expect(utils.colors.black()).toEqual(`rgba(0, 0, 0, ${1.0})`);
    expect(utils.colors.black(1.0)).toEqual(`rgba(0, 0, 0, ${1.0})`);
    expect(utils.colors.black(0.5)).toEqual(`rgba(0, 0, 0, ${0.5})`);
    expect(utils.colors.black(0.0)).toEqual(`rgba(0, 0, 0, ${0.0})`);
    expect(utils.colors.black(-1.0)).toEqual(`rgba(0, 0, 0, ${0.0})`);
    expect(utils.colors.black(2.0)).toEqual(`rgba(0, 0, 0, ${1.0})`);
  });

  it('creates background color strings', () => {
    expect(utils.colors.background()).toEqual(`rgba(79, 79, 79, ${1.0})`);
    expect(utils.colors.background(1.0)).toEqual(`rgba(79, 79, 79, ${1.0})`);
    expect(utils.colors.background(0.5)).toEqual(`rgba(79, 79, 79, ${0.5})`);
    expect(utils.colors.background(0.0)).toEqual(`rgba(79, 79, 79, ${0.0})`);
    expect(utils.colors.background(-1.0)).toEqual(`rgba(79, 79, 79, ${0.0})`);
    expect(utils.colors.background(2.0)).toEqual(`rgba(79, 79, 79, ${1.0})`);
  });

  it('has multple colors in the palette', () => {
    expect(utils.colors.palette.length).toBeGreaterThan(1);
  });

  it('generates fonts', () => {
    expect(utils.font()).toEqual('0px Helvetica');
    expect(utils.font(0)).toEqual('0px Helvetica');
    expect(utils.font(12)).toEqual('12px Helvetica');
    expect(utils.font(12.9)).toEqual('12px Helvetica');
  });

  it('will not break during drawLine', () => {
    expect(utils.drawLine(utils.fakeContext)).toBeUndefined();
  });

  it('will not break during continueLine', () => {
    expect(utils.continueLine(utils.fakeContext)).toBeUndefined();
  });

  it('will not break during drawArc', () => {
    expect(utils.continueLine(utils.fakeContext)).toBeUndefined();
  });

  it('can calculate distances', () => {
    expect(utils.getDistance(0, 0, 0, 2)).toEqual(2);
    expect(utils.getDistance(0, 0, 2, 0)).toEqual(2);
    expect(utils.getDistance(0, 2, 0, 0)).toEqual(2);
    expect(utils.getDistance(2, 0, 0, 0)).toEqual(2);
    expect(utils.getDistance(137, 64.2, 761, 134)).toBeCloseTo(627.89, 2);
  });

});
