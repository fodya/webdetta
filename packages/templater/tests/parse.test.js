import { describe, it } from 'jsr:@std/testing/bdd';
import { assertEquals, assertThrows } from 'jsr:@std/assert';
import { Templater } from '../index.js';

const defaultConfig = {
  operatorSymbol: '$',
  openBracket: '{',
  closeBracket: '}',
  argumentsSeparator: ',',
  onOperatorNotFound: () => {},
};

const mkEngine = (cfg = defaultConfig, ops = ['', 'if', 'f']) => {
  const e = Templater(cfg);
  for (const name of ops) e.register(name, () => '');
  return e;
};

const stripParent = (node) => {
  if (node == null || typeof node !== 'object') return node;
  const { operator, args } = node;
  return { operator, args: args.map(stripParent) };
};

describe('parse', () => {
  it('returns empty tree for empty input', () => {
    const { parse } = mkEngine();
    assertEquals(stripParent(parse('')), { operator: null, args: [] });
  });

  it('passes plain text through unchanged', () => {
    const { parse } = mkEngine();
    assertEquals(stripParent(parse('hello world')), {
      operator: null,
      args: ['hello world'],
    });
  });

  it('parses a standalone getter', () => {
    const { parse } = mkEngine();
    assertEquals(stripParent(parse('${name}')), {
      operator: null,
      args: [{ operator: '', args: ['name'] }],
    });
  });

  it('parses a getter surrounded by text', () => {
    const { parse } = mkEngine();
    assertEquals(stripParent(parse('a${x}b')), {
      operator: null,
      args: ['a', { operator: '', args: ['x'] }, 'b'],
    });
  });

  it('parses a named operator with comma-separated args', () => {
    const { parse } = mkEngine();
    assertEquals(stripParent(parse('$f{a,b,c}')), {
      operator: null,
      args: [{ operator: 'f', args: ['a', 'b', 'c'] }],
    });
  });

  it('parses an operator with a nested getter argument', () => {
    const { parse } = mkEngine();
    assertEquals(stripParent(parse('$if{x,${y}}')), {
      operator: null,
      args: [{
        operator: 'if',
        args: ['x', { operator: '', args: ['y'] }],
      }],
    });
  });

  it('produces a tree without parent back-references', () => {
    const { parse } = mkEngine();
    const tree = parse('$if{x,${y}}');
    assertEquals('parent' in tree, false);
    assertEquals('parent' in tree.args[0], false);
    JSON.stringify(tree);
  });

  it('omits empty string arguments', () => {
    const { parse } = mkEngine();
    const tree = parse('${x}');
    assertEquals(tree.args.length, 1);
    assertEquals(typeof tree.args[0], 'object');
  });

  it('keeps boundary literals non-empty', () => {
    const { parse } = mkEngine();
    const tree = parse('$5 and $6 and ${real}');
    for (const a of tree.args.filter(x => typeof x === 'string')) {
      assertEquals(a === '', false);
    }
  });
});

describe('bare operator symbol', () => {
  it('stays literal when not followed by a valid call', () => {
    const { parse } = mkEngine();
    assertEquals(stripParent(parse('Price: $5.99')), {
      operator: null,
      args: ['Price: $5.99'],
    });
  });

  it('is not duplicated in the output', () => {
    const { parse } = mkEngine();
    assertEquals(stripParent(parse('abc $ def')), {
      operator: null,
      args: ['abc $ def'],
    });
  });

  it('does not break a subsequent real call', () => {
    const { parse } = mkEngine();
    assertEquals(stripParent(parse('Price: $5.99, name: ${n}')), {
      operator: null,
      args: ['Price: $5.99, name: ', { operator: '', args: ['n'] }],
    });
  });
});

describe('multi-char brackets', () => {
  const cfg = {
    operatorSymbol: '@',
    openBracket: '[[',
    closeBracket: ']]',
    argumentsSeparator: '|',
    onOperatorNotFound: () => {},
  };

  it('parses a getter with multi-char brackets', () => {
    const { parse } = mkEngine(cfg, ['']);
    assertEquals(stripParent(parse('@[[foo|bar|baz]]')), {
      operator: null,
      args: [{ operator: '', args: ['foo', 'bar', 'baz'] }],
    });
  });

  it('parses a named operator with multi-char brackets', () => {
    const { parse } = mkEngine(cfg, ['if']);
    assertEquals(stripParent(parse('@if[[cond|yes|no]]')), {
      operator: null,
      args: [{ operator: 'if', args: ['cond', 'yes', 'no'] }],
    });
  });

  it('does not open on a partial bracket prefix', () => {
    const { parse } = mkEngine(cfg, ['foo']);
    assertEquals(stripParent(parse('@foo[x]')), {
      operator: null,
      args: ['@foo[x]'],
    });
  });
});

describe('literal braces in body', () => {
  it('keeps inner braces when wrapped in a getter', () => {
    const { parse } = mkEngine();
    assertEquals(stripParent(parse('${a{b}c}')), {
      operator: null,
      args: [{ operator: '', args: ['a{b}c'] }],
    });
  });

  it('keeps inner braces when wrapped in a named operator', () => {
    const { parse } = mkEngine();
    assertEquals(stripParent(parse('$f{hello{world}}')), {
      operator: null,
      args: [{ operator: 'f', args: ['hello{world}'] }],
    });
  });

  it('preserves a single css rule inside operator body', () => {
    const e = Templater({ ...defaultConfig });
    e.register('if', (c, a, r) => (c[a[0].trim()] ? r(a.slice(1), c) : ''));
    const out = e.render('$if{x, <style> div { someProp: a,b,c; } </style>}', { x: true });
    assertEquals(out, ' <style> div { someProp: a,b,c; } </style>');
  });

  it('preserves multiple css rules inside operator body', () => {
    const e = Templater({ ...defaultConfig });
    e.register('if', (c, a, r) => (c[a[0].trim()] ? r(a.slice(1), c) : ''));
    const out = e.render('$if{x, <style>div{a:1;}p{b:2,c:3;}</style>}', { x: true });
    assertEquals(out, ' <style>div{a:1;}p{b:2,c:3;}</style>');
  });
});

describe('unmatched close bracket', () => {
  it('is emitted as a literal at the root', () => {
    const { parse } = mkEngine();
    const tree = parse('}${x}');
    assertEquals(stripParent(tree), {
      operator: null,
      args: ['}', { operator: '', args: ['x'] }],
    });
    assertEquals(tree.nested, 0);
  });

  it('does not corrupt the nested counter when repeated', () => {
    const { parse } = mkEngine();
    const tree = parse('}}}${x}}}');
    assertEquals(stripParent(tree), {
      operator: null,
      args: ['}}}', { operator: '', args: ['x'] }, '}}'],
    });
    assertEquals(tree.nested, 0);
  });
});

describe('separator in body', () => {
  it('splits getter args on every top-level separator', () => {
    const { parse } = mkEngine();
    assertEquals(stripParent(parse('${a,b,c}')), {
      operator: null,
      args: [{ operator: '', args: ['a', 'b', 'c'] }],
    });
  });

  it('preserves commas that appear inside inner brackets', () => {
    const e = Templater({ ...defaultConfig });
    e.register('if', (c, a, r) => (c[a[0].trim()] ? r(a.slice(1), c) : ''));
    const out = e.render('$if{x, <div style="someProp: a,b,c;"></div>}', { x: true });
    assertEquals(out, ' <div style="someProp: a,b,c;"></div>');
  });
});

describe('config validation', () => {
  it('throws when config is missing', () => {
    assertThrows(() => Templater());
  });

  it('throws when a required field is absent', () => {
    assertThrows(() => Templater({ operatorSymbol: '$', openBracket: '{' }));
  });

  it('throws when a field is an empty string', () => {
    assertThrows(() => Templater({
      operatorSymbol: '',
      openBracket: '{',
      closeBracket: '}',
      argumentsSeparator: ',',
    }));
  });

  it('throws when open and close brackets match', () => {
    assertThrows(() => Templater({
      operatorSymbol: '$',
      openBracket: '|',
      closeBracket: '|',
      argumentsSeparator: ',',
    }));
  });

  it('accepts a fully specified config', () => {
    Templater(defaultConfig);
  });
});

describe('unknown operator', () => {
  it('warns and emits literal text by default', () => {
    const original = console.warn;
    const warned = [];
    console.warn = (...args) => { warned.push(args.join(' ')); };
    try {
      const e = Templater({
        operatorSymbol: '$',
        openBracket: '{',
        closeBracket: '}',
        argumentsSeparator: ',',
      });
      e.register('', () => '');
      const tree = e.parse('prefix $unknown{a,b} suffix');
      assertEquals(stripParent(tree), {
        operator: null,
        args: ['prefix $unknown{a,b} suffix'],
      });
      assertEquals(warned.length, 1);
      assertEquals(warned[0].includes('unknown'), true);
    } finally {
      console.warn = original;
    }
  });

  it('invokes the custom callback with op name and parent node', () => {
    const seen = [];
    const e = Templater({
      ...defaultConfig,
      onOperatorNotFound: (op, node) => {
        seen.push({ op, nodeOperator: node.operator });
      },
    });
    e.register('if', (c, a, r) => r(a.slice(1), c));
    const tree = e.parse('$if{x, $missing{y}}');
    assertEquals(seen.length, 1);
    assertEquals(seen[0].op, 'missing');
    assertEquals(seen[0].nodeOperator, 'if');
    assertEquals(stripParent(tree), {
      operator: null,
      args: [{ operator: 'if', args: ['x', ' $missing{y}'] }],
    });
  });

  it('renders as literal next to a known operator', () => {
    const e = Templater({ ...defaultConfig });
    e.register('', (c, a) => String(c[a[0].trim()] ?? ''));
    assertEquals(
      e.render('hi ${name} and $nope{x}', { name: 'Ann' }),
      'hi Ann and $nope{x}',
    );
  });

  it('stays literal when nested inside a known operator', () => {
    const e = Templater({ ...defaultConfig });
    e.register('if', (c, a, r) => (c[a[0].trim()] ? r(a.slice(1), c) : ''));
    assertEquals(
      e.render('$if{x, keep $unk{a,b} here}', { x: true }),
      ' keep $unk{a,b} here',
    );
  });

  it('treats `${x}` as literal when the empty operator is not registered', () => {
    const e = Templater({ ...defaultConfig });
    assertEquals(e.render('Hello ${name}!', { name: 'X' }), 'Hello ${name}!');
  });
});

describe('unknown operator depth', () => {
  it('keeps outer braces literal while evaluating an inner known call', () => {
    const e = Templater({ ...defaultConfig });
    e.register('if', (c, a, r) => (c[a[0].trim()] ? r(a.slice(1), c) : ''));
    assertEquals(
      e.render('$notExists{ $if{x, 123} }', { x: true }),
      '$notExists{  123 }',
    );
  });

  it('produces an AST with literal outer braces around a known call', () => {
    const e = Templater({ ...defaultConfig });
    e.register('if', () => '');
    assertEquals(stripParent(e.parse('$notExists{ $if{x, 123} }')), {
      operator: null,
      args: [
        '$notExists{ ',
        { operator: 'if', args: ['x', ' 123'] },
        ' }',
      ],
    });
  });

  it('works when no whitespace separates unknown and inner known call', () => {
    const e = Templater({ ...defaultConfig });
    e.register('if', (c, a, r) => (c[a[0].trim()] ? r(a.slice(1), c) : ''));
    assertEquals(e.render('$notExists{$if{x,Y}}', { x: true }), '$notExists{Y}');
  });

  it('preserves commas inside the body of an unknown operator', () => {
    const e = Templater({ ...defaultConfig });
    e.register('if', (c, a, r) => (c[a[0].trim()] ? r(a.slice(1), c) : ''));
    assertEquals(e.render('$if{x, $unk{a,b,c}}', { x: true }), ' $unk{a,b,c}');
  });

  it('keeps both brace pairs literal when unknowns are nested two levels', () => {
    const e = Templater({ ...defaultConfig });
    e.register('', (c, a) => String(c[a[0].trim()] ?? ''));
    assertEquals(
      e.render('$outerUnk{ mid $innerUnk{ deep ${name} } end }', { name: 'Bob' }),
      '$outerUnk{ mid $innerUnk{ deep Bob } end }',
    );
  });

  it('does not let siblings affect each other', () => {
    const e = Templater({ ...defaultConfig });
    e.register('if', (c, a, r) => (c[a[0].trim()] ? r(a.slice(1), c) : ''));
    assertEquals(
      e.render('$unk{A} and $if{x,B} and $unk{C}', { x: true }),
      '$unk{A} and B and $unk{C}',
    );
  });

  it('leaves an extra close bracket literal and resets state', () => {
    const e = Templater({ ...defaultConfig });
    e.register('if', (c, a, r) => (c[a[0].trim()] ? r(a.slice(1), c) : ''));
    const tree = e.parse('$unk{ } } $if{x, Y}');
    assertEquals(stripParent(tree).args[0], '$unk{ } } ');
    assertEquals(stripParent(tree).args[1].operator, 'if');
    assertEquals(tree.nested, 0);
    assertEquals(e.render('$unk{ } } $if{x, Y}', { x: true }), '$unk{ } }  Y');
  });
});
