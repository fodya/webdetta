import { operators } from './operators.js';
import { Element } from './dom.js';
import { kebab } from '../common/dom.js';

const NS = {
  svg: 'http://www.w3.org/2000/svg',
  math: 'http://www.w3.org/1998/Math/MathML'
};

const tag = key => key[0].toLowerCase() + kebab(key.slice(1));
const elNS = ns => {
  ns = NS[ns = ns.toString().toLowerCase()] ?? ns;
  return new Proxy({}, {
    get: (_, key) =>
      key === '' ? Element('')
      : key === 'ns' ? elNS
      : key[0] === key[0].toUpperCase() ? Element(tag(key), ns)
      : operators[key]
  });
}
export const el = elNS('');
