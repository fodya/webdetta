import { Methods } from '../lib/vendetta-themes/methods/abbreviated-css.js';

let vendettaInstance;
let themeVal = 'light';
const theme = (...a) => {
  if (a.length == 0) return themeVal;
  else { themeVal = a[0]; vendettaInstance?.(); }
}

const fixedColors = {
  C: 'currentColor',
  T: 'transparent',
  w: 'white',
}

const colors = {
  light: {
    ...fixedColors,
    'layout.header': '#f3f0fa',
    'layout.selection': '#977cc545',
    grad0: 'linear-gradient(-2deg, #2196f30d, #5927b012)',
    t1: '#222',
    t2: '#777',
    l0: '#dddddd',
    l1: '#c3c3c3',
    c1: '#2196f3'
  },
  dark: {}
}

colors.dark = colors.light;

const { methods, resolve } = Methods({
  unit: [8, 'px'],
  color: key => colors[themeVal][key] ?? key,
  textSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '20px',
  },
  fontWeight: {
    semibold: 600,
    bold: 700
  },
  shadow: {
    l1: '0px 0px 1px black',
    sm: '0 2px 8px -3px rgba(0, 0, 0, 0.2)',
    '-sm': '0 -2px 8px -3px rgba(0, 0, 0, 0.2)',
    md: '0 6px 16px -2px rgba(0, 0, 0, 0.4)',
  }
});

const captureVendettaInstance = (arg) => {
  vendettaInstance = arg;
  return methods;
}

export { captureVendettaInstance, theme, resolve };
