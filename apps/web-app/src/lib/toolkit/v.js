import V from '../vendetta/frameorc-adapter.js';

const methods = {};
const {v, stylesheet, recalculate} = V(methods);

export const init = (methodsFunc) =>
  Object.assign(methods, methodsFunc({ recalculate }));

export default v;
