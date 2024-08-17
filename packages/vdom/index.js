import {Fragment, Element} from './vdom.js';
import {Component} from './comp.js';
import {kebab} from '../common/dom.js';
import * as op from './operators.js';
import * as h from './hooks.js';

const el = new Proxy({}, {
  get: (_, k) => k[0].toUpperCase() == k[0]
    ? Element(kebab(k.toLowerCase()))
    : op[k]
});

export { h, el, Fragment, Component };
