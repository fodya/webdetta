// vendetta default methods
// MIT License
// (c) 2023 Fedot Kryutchenko

const falsy = d => ({
  false: d,
  null: d,
  undefined: d,
});

const truthy = d => ({
  true: d,
});

const display = {
  ...truthy(''),
  ...falsy('none'),
  b: 'block',
  i: 'inline',
  ib: 'inline-block',
  f: 'flex',
  if: 'inline-flex',
  g: 'grid',
  ig: 'inline-grid',
  fr: 'flow-root',
  n: 'none',
  c: 'contents',
  t: 'table',
  tr: 'table-row',
  li: 'list-item'
}
const flexAlign = {
  s: 'flex-start',
  e: 'flex-end',
  c: 'center',
  ar: 'space-around',
  bw: 'space-between',
  ev: 'space-evenly',
  st: 'stretch',
  ss: 'self-start',
  se: 'self-end',
}
const flexAlignH = {
  ...flexAlign,
  l: 'flex-start',
  r: 'flex-end',
}
const flexAlignV = {
  ...flexAlign,
  t: 'flex-start',
  b: 'flex-end',
  bl: 'baseline',
  blf: 'first baseline',
  bll: 'last baseline',
}
const gridFlow = {
  col: 'column',
  'col*': 'column dense',
  row: 'row',
  'row*': 'row dense'
}
const overflow = {
  ...truthy('auto'),
  ...falsy('hidden'),
  h: "hidden",
  a: "auto",
  s: "scroll"
}
const length = {
  f: '100%',
  a: 'auto',
  c: 'fit-content',
  mx: 'max-content',
  mn: 'min-content',
  fl: 'fill-available',
}
const textAlign = {
  s: 'start',
  l: 'left',
  c: 'center',
  r: 'right',
  e: 'end',
  j: 'justify',
  ja: 'justify-all',
  mp: 'match-parent'
}
const borderStyle = {
  ...truthy('solid'),
  ...falsy('none'),
  n: 'none',
  '-': 'solid',
  '.': 'dotted',
  '~': 'wavy',
  '--': 'dashed',
  '=': 'double'
}
const textTransform = {
  u: 'uppercase',
  l: 'lowercase',
  c: 'capitalize'
}
const textOverflow = {
  e: "ellipsis",
  c: "clip"
}
const userSelect = {
  ...truthy('auto'),
  ...falsy('none'),
  '~': 'auto',
  n: 'none',
  t: 'text',
  a: 'all',
  c: 'contain'
}
const visibility = {
  ...truthy('visible'),
  ...falsy('hidden'),
  h: 'hidden',
  v: 'visible',
  c: 'collapse',
}
const wordBreak = {
  n: 'keep-all',
  k: 'keep-all',
  w: 'break-word',
  bw: 'break-word',
  a: 'break-all',
  ba: 'break-all',
}
const whiteSpace = {
  nw: 'nowrap',
  p: 'pre',
  pw: 'pre-wrap',
  pl: 'pre-line',
  bs: 'break-spaces'
}

const sides = { '': [''] }
sides.T = ['Top'];
sides.B = ['Bottom'];
sides.L = ['Left'];
sides.R = ['Right'];
sides.h = sides.H = ['Left', 'Right'];
sides.v = sides.V = ['Top', 'Bottom'];
sides.t = ['BlockStart'];
sides.b = ['BlockEnd'];
sides.l = ['InlineStart'];
sides.r = ['InlineEnd'];

const corners = { '': [''] }
corners.TL = corners.tl = ['StartStart'];
corners.TR = corners.tr = ['StartEnd'];
corners.BL = corners.bl = ['EndStart'];
corners.BR = corners.br = ['EndEnd'];
corners.T  = corners.t  = [...corners.tl, ...corners.tr];
corners.B  = corners.b  = [...corners.bl, ...corners.br];
corners.L  = corners.l  = [...corners.tl, ...corners.bl];
corners.R  = corners.r  = [...corners.tr, ...corners.br];

const skip = Symbol('skip');
const some = (args, r) => {
  for (let i = 0; i < args.length; i++) {
    const av = args[i];
    if (av === skip) continue;
    const v = typeof r == 'object' ? r[av] : r(av);
    if (v) return (args[i] = skip, v);
  }
  return null;
}

const def = (obj, methodName, func) => {
  const res = {};
  for (const [name, props] of Object.entries(obj)) {
    const propFns = props.map(func);
    res[methodName(name)] = function (...a) {
      const style = {};
      for (const propFn of propFns) Object.assign(style, propFn(...a));
      return style;
    }
  }
  return res;
}

const gridTrack = (size, str) => {
  let [ , count, track=''] = str.match(/(.*)\[(.*)\]/) ?? [null, str];
  count = +count;
  const [head, repeat=[]] = track.split('|').map(a =>
    a.split(/\s+/).filter(v=>v).map(size)
  );

  if (isNaN(count)) return '';
  if (!repeat.length) return [...head,
    `repeat(${count - head.length},1fr)`
  ].join(' ');

  const tail = repeat.slice(0, (count - head.length) % repeat.length);
  const repeatCount = (count - head.length - tail.length) / repeat.length;
  return [...head,
    `repeat(${repeatCount},${repeat.join(' ')})`, ...tail
  ].join(' ');
}

const resolver = (cfg) => {
  const resolve = {};
  for (const [k, r] of Object.entries(cfg))
    resolve[k] = typeof r == 'function' ? r : v => r[v] ?? v;
  resolve.size = v => isNaN(+v) ? v : +v * cfg.unit[0] + cfg.unit[1];
  return resolve;
}

export const Methods = cfg => {
  const resolve = resolver(cfg);
  const {
    size,
    color=v=>v,
    textSize=v=>v,
    lineHeight=v=>v,
    shadow=v=>v,
    fontFamily=v=>v,
    fontWeight=v=>v
  } = resolve;

  const methods = {
    // align
    alC: (v) => ({ alignContent: flexAlign[v] ?? v }),
    alI: (v) => ({ alignItems: flexAlign[v] ?? v }),
    alS: (v) => ({ alignSelf: flexAlign[v] ?? v }),
    alT: (v) => ({ alignTracks: flexAlign[v] ?? v }),
    fll: () => ({ float: 'left' }),
    flr: () => ({ float: 'right' }),

    // composition
    grid: (columns, rows, flow) => {
      const res = { display: 'grid' };
      if (columns) res.gridTemplateColumns = gridTrack(size, String(columns));
      if (rows) res.gridTemplateRows = gridTrack(size, String(rows));
      if (flow) res.gridAutoFlow = gridFlow[flow] ?? flow;
      return res;
    },
    row: (...a) => ({
      display: 'flex',
      flexDirection: 'row',
      justifyContent: some(a, flexAlignH),
      alignItems: some(a, flexAlignV)
    }),
    col: (...a) => ({
      display: 'flex',
      flexDirection: 'column',
      alignItems: some(a, flexAlignH),
      justifyContent: some(a, flexAlignV)
    }),
    rowr: (...a) => ({
      display: 'flex',
      flexDirection: 'row-reverse',
      justifyContent: some(a, flexAlignH),
      alignItems: some(a, flexAlignV)
    }),
    colr: (...a) => ({
      display: 'flex',
      flexDirection: 'column-reverse',
      alignItems: some(a, flexAlignH),
      justifyContent: some(a, flexAlignV)
    }),
    span: (x, y) => ({
      gridRow: x ? `span ${x} / span ${x}` : '',
      gridColumn: y ? `span ${y} / span ${y}` : ''
    }),
    gap: (x, y=x) => ({
      columnGap: size(x) ?? x,
      rowGap: size(y) ?? y
    }),
    rowgap: (v) => ({ rowGap: size(v) ?? v }),
    colgap: (v) => ({ columnGap: size(v) ?? v }),
    rigid: () => ({ flexShrink: 0 }),
    flex: (v) => ({ flex: v }),
    wrap: (v=true) => ({
      flexWrap: typeof v != 'boolean' ? v : v ? 'wrap' : 'nowrap'
    }),

    // size
    w: (v) => ({ width: length[v] ?? size(v) }),
    mnw: (v) => ({ minWidth: length[v] ?? size(v) }),
    mxw: (v) => ({ maxWidth: length[v] ?? size(v) }),
    h: (v) => ({ height: length[v] ?? size(v) }),
    mnh: (v) => ({ minHeight: length[v] ?? size(v) }),
    mxh: (v) => ({ maxHeight: length[v] ?? size(v) }),

    // text
    td: (...a) => {
      const type = some(a, borderStyle);
      const thickness = some(a, size);
      return {
        textDecoration: type + (type != 'none' ? ' underline' : ''),
        textDecorationThickness: thickness
      };
    },
    ta: (v) => ({ textAlign: textAlign[v] ?? v }),
    tc: (v) => ({ color: color(v) }),
    tf: (v) => ({ fontFamily: fontFamily(v) }),
    tl: (v) => ({ lineHeight: lineHeight(v) }),
    ts: (v) => ({ fontSize: textSize(v) ?? size(v) ?? v }),
    tt: (v) => ({ textTransform: textTransform[v] ?? v }),
    tw: (v) => ({ fontWeight: fontWeight(v) }),
    tov: (v) => ({ textOverflow: textOverflow[v] ?? v }),
    tws: (v) => ({ whiteSpace: whiteSpace[v] ?? v }),
    twb: (v) => ({ wordBreak: wordBreak[v] ?? v }),
    tlg: (v) => ({ letterSpacing: size(v) }),
    twg: (v) => ({ wordSpacing: size(v) }),
    tsh: (...a) => ({
      textShadow: a.map(v => color(v) ?? size(v) ?? v).join(' ')
    }),
    tlc: (v, inline=true) => ({
      lineClamp: v,
      WebkitLineClamp: v,
      WebkitBoxOrient: 'vertical',
      display: inline ? '-webkit-inline-box' : '-webkit-box'
    }),

    // padding, margin, border, border-radius
    ...def(sides,   _=>'p'+_,  _=>(v) => ({
      [`padding${_}`]: length[v] ?? size(v)
    })),
    ...def(sides,   _=>'m'+_,  _=>(v) => ({
      [`margin${_}`]: length[v] ?? size(v)
    })),
    ...def(sides,   _=>'br'+_, _=>(...a) => ({
      [`border${_}Color`]: some(a, color) ?? 'currentColor',
      [`border${_}Width`]: some(a, size) ?? '1px',
      [`border${_}Style`]: some(a, borderStyle) ?? 'solid'
    })),
    ...def(corners, _=>'r'+_,  _=>(v) => ({
      [`border${_}Radius`]: size(v)
    })),

    // outline
    ol: (...a) => ({
      outlineColor: some(a, color) ?? 'currentColor',
      outlineWidth: some(a, size) ?? '1px',
      outlineOffset: some(a, size) ?? '1px',
      outlineStyle: some(a, borderStyle) ?? 'solid'
    }),

    // ring
    ring: (cl="currentColor", w='1px',of='0px', ofcl='transparent') => ({
      boxShadow: [
        `0 0 0 ${size(of)}`, color(ofcl), ',',
        `0 0 0 calc(${size(w)} + ${size(of)})`, color(cl)
      ].join(' ')
    }),

    // inset
    i: (v) => ({ inset: size(v) }),
    it: (v) => ({ top: size(v) }),
    il: (v) => ({ left: size(v) }),
    ib: (v) => ({ bottom: size(v) }),
    ir: (v) => ({ right: size(v) }),

    // common
    abs: () => ({ position: 'absolute' }),
    rel: () => ({ position: 'relative' }),
    fix: () => ({ position: 'fixed' }),
    stt: () => ({ position: 'static' }),
    stc: () => ({ position: 'sticky' }),
    d: (v) => ({ display: display[v] ?? v }),
    z: (v) => ({ zIndex: v }),
    bg: (...c) => ({ background: c.map(color).join(', ') }),
    bgc: (...c) => ({ backgroundColor: c.map(color).join(', ') }),
    bgi: (...c) => ({ backgroundImage: c.map(color).join(', ') }),
    op: (v) => ({ opacity: v }),
    va: (v) => ({ verticalAlign: v }),
    sh: (v) => ({ boxShadow: shadow(v) }),
    dsh: (v) => ({ filter: `drop-shadow(${shadow(v)})` }),
    ov: (x, y=x) => ({
      overflowX: overflow[x] ?? x,
      overflowY: overflow[y] ?? y
    }),
    ovX: (v) => ({ overflowX: overflow[v] ?? v }),
    ovY: (v) => ({ overflowY: overflow[v] ?? v }),
    sel: (v) => ({ userSelect: userSelect[v] ?? v }),
    vis: (v) => ({ visibility: visibility[v] ?? v }),
    ptr: (v=true) => {
      if (v) return { cursor: 'pointer' };
      else return { pointerEvents: 'none' };
    },
    zoom: v => ({ zoom: v }),

    // transform
    //tr3: () => ({ transformStyle: 'preserve-3d' }),
    ...Object.fromEntries([
      ['mat', 'matrix'],
      ['mat3', 'matrix3d'],
      ['skw', 'skew'],
      ['skwX', 'skewX'],
      ['skwY', 'skewY'],
      ['scl', 'scale'],
      ['scl3', 'scale3d'],
      ['sclX', 'scaleZ'],
      ['sclY', 'scaleY'],
      ['sclZ', 'scaleZ'],
    ].map(([name, prop]) => [name, (...v) => ({
      transform: prop + '(' + v.join(',') + ')'
    })])),

    ...Object.fromEntries([
      ['rot', 'rotate'],
      ['rotX', 'rotateX'],
      ['rotY', 'rotateY'],
      ['rotZ', 'rotateZ'],
    ].map(([name, prop]) => [name, (...v) => ({
      transform: prop+'('+ v.map(v=>isNaN(+v)?v:v+'deg').join(',') +')'
    })])),
    rot3: (x, y, z, r) => ({
      transform: `rotate3d(${x}, ${y}, ${z}, ${isNaN(+r) ? r : r + 'deg'})`
    }),

    ...Object.fromEntries([
      ['prs', 'perspective'],
      ['tr', 'translate'],
      ['tr3', 'translate3d'],
      ['trX', 'translateX'],
      ['trY', 'translateY'],
      ['trZ', 'translateZ'],
    ].map(([name, prop]) => [name, (...v) => ({
      transform: prop + '(' + v.map(v => size(v)).join(',') + ')'
    })])),
    trO: (...args) => ({ transformOrigin: args.join(' ') })
  }

  return { methods, resolve };
}
