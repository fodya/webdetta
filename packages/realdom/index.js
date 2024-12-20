import * as operators from './operators.js';
import { Element } from './dom.js';
import { kebab } from '../common/dom.js';

export const el = new Proxy({}, {
  get: (_, key) => key[0] === key[0].toUpperCase()
    ? Element(key[0].toLowerCase() + kebab(key.slice(1)))
    : operators[key]
});
