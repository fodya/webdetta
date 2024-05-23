export {frag, operator, body, throttle} from '../frameorc/dom.js';
export * as h from './hooks.js';
export {Component} from '../frameorc/comp.js';
export {default as el} from './el.js';
export {default as v} from './v.js';
export {default as Router} from './router.js';

import {init as vInit} from './v.js';
export const init = { vendetta: vInit };
