import * as operators from './operators.js';
import { Element } from './base.js';
import { kebab } from '../common/dom.js';
import { Context } from '../context/sync.js';
import { cached } from '../execution/index.js';

const NS = {
  svg: 'http://www.w3.org/2000/svg',
  math: 'http://www.w3.org/1998/Math/MathML'
};

const tag = key => key.length ? key[0].toLowerCase() + kebab(key.slice(1)) : '';
const namespace = ns => {
  return new Proxy({}, {
    get: cached((_, key) => (
      key == 'ns' && ns == null ? key => namespace(NS[key.toLowerCase()])
      : key in operators ? operators[key]
      : Element(tag(key), ns)
    ), (_, key) => key)
  });
}
export const el = namespace(null);
export { Context };
