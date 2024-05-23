import { layout } from '#pages';

import * as tg from '#feat/telegram.js';
tg.init();

import { captureVendettaInstance } from './cfg/vendetta.js';
import { init } from '#tk';
init.vendetta(captureVendettaInstance);

layout.mount(document.body);

window.onerror = function (msg, url, num) {
  alert(msg + ';' + url + ';' + num);
  return true;
}
