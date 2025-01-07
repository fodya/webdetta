import { operators } from './operators.js';
import { Element } from './dom.js';
import { kebab } from '../common/dom.js';

const NS = {
  svg: 'http://www.w3.org/2000/svg',
  math: 'http://www.w3.org/1998/Math/MathML'
};
const elNS = ns => {
  ns = NS[ns = ns.toString().toLowerCase()] ?? ns;
  return new Proxy({}, {
    get: (_, key) =>
      key[0] === key[0].toUpperCase()
      ? Element(key[0].toLowerCase() + kebab(key.slice(1)), ns)
      : key === 'ns' ? elNS : operators[key]
  });
}
export const el = elNS('');
