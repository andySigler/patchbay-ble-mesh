import { fakeContext } from './modules/PatchbayUtils'

HTMLCanvasElement.prototype.getContext = () => {
  return fakeContext;
};
