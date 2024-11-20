import * as operators from './operators.js';
import { Element } from './dom.js';

export { Component } from './dom.js';
export const el = new Proxy({}, {
  get: (_, key) => key[0] === key[0].toUpperCase()
    ? Element(key)
    : operators[key]
});
