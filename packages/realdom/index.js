import * as operators from './operators.js';
import * as components from './components.js';
import { Element } from './dom.js';

export { Component } from './dom.js';
export const el = new Proxy((...a) => components[String.raw(...a)], {
  get: (_, key) => operators[key] ?? Element(key)
});
