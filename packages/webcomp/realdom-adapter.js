import Builder from '../common/builder.js';
import { el, Component } from '../realdom/index.js';
import { WebComponent as WebComponent_ } from './index.js';

export const WebComponent = (name, options, func) => {
  const comp = Component(content => content);
  return WebComponent_(name, options, function (...args) {
    const res = func.apply(this, args);
    const children = [];
    for (const item of res) switch(item[Builder.symbol]) {
      case 2: Builder.launch(item, this.dom, true); break;
      default: children.push(item);
    }
    return comp(el[':'](...children));
  });
}
