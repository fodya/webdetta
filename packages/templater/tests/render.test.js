import { describe, it } from 'jsr:@std/testing/bdd';
import { assertEquals } from 'jsr:@std/assert';
import { Templater } from '../index.js';

const mk = () => {
  const engine = Templater({
    operatorSymbol: '$',
    openBracket: '{',
    closeBracket: '}',
    argumentsSeparator: ',',
  });
  engine.register('', (ctx, args) => String(ctx[args[0].trim()]));
  engine.register('if', (ctx, args, render) => {
    const key = args[0].trim();
    const content = args.slice(1);
    if (ctx[key]) return render(content, ctx);
    return '';
  });
  engine.register('for', (ctx, args, render) => {
    const itemVar = args[0].trim();
    const itemsKey = args[1].trim();
    const content = args.slice(2);
    return ctx[itemsKey].map((item) => render(content, {
      ...ctx,
      [itemVar]: item,
    })).join('');
  });
  engine.register('length', (ctx, args) => ctx[args[0].trim()].length);
  return engine;
};

describe('render', () => {
  it('passes plain text through unchanged', () => {
    const e = mk();
    assertEquals(e.render('hello world', {}), 'hello world');
  });

  it('substitutes a single getter', () => {
    const e = mk();
    assertEquals(e.render('Hello ${name}', { name: 'World' }), 'Hello World');
  });

  it('substitutes multiple getters in one string', () => {
    const e = mk();
    assertEquals(e.render('${a}-${b}', { a: '1', b: '2' }), '1-2');
  });

  it('renders an unknown operator as literal text', () => {
    const warn = console.warn;
    console.warn = () => {};
    try {
      const e = mk();
      assertEquals(e.render('before $nope{x} after', {}), 'before $nope{x} after');
    } finally {
      console.warn = warn;
    }
  });
});

describe('bare operator symbol', () => {
  it('survives inside surrounding text', () => {
    const e = mk();
    assertEquals(e.render('Price: $5.99', {}), 'Price: $5.99');
  });

  it('coexists with a real call on the same line', () => {
    const e = mk();
    assertEquals(
      e.render('Price: $5.99, name: ${n}', { n: 'Alice' }),
      'Price: $5.99, name: Alice',
    );
  });

  it('remains literal at end of input', () => {
    const e = mk();
    assertEquals(e.render('end $', {}), 'end $');
  });
});

describe('multi-char brackets', () => {
  const cfg = {
    operatorSymbol: '@',
    openBracket: '[[',
    closeBracket: ']]',
    argumentsSeparator: '|',
  };

  it('resolves a getter with multi-char delimiters', () => {
    const e = Templater(cfg);
    e.register('', (ctx, args) => ctx[args[0].trim()]);
    assertEquals(e.render('Hi @[[name]]', { name: 'Bob' }), 'Hi Bob');
  });

  it('renders a named operator that contains a nested getter', () => {
    const e = Templater(cfg);
    e.register('', (ctx, args) => ctx[args[0].trim()]);
    e.register('if', (ctx, args, render) => {
      const key = args[0].trim();
      if (ctx[key]) return render(args.slice(1), ctx);
      return '';
    });
    assertEquals(
      e.render('@if[[ok| yes @[[n]]]]', { ok: true, n: 'X' }),
      ' yes X',
    );
  });
});

describe('literal braces in body', () => {
  it('preserves inner braces when operator re-renders its args', () => {
    const e = mk();
    e.register('raw', (ctx, args, render) => render(args, ctx));
    assertEquals(e.render('$raw{a{b}c}', {}), 'a{b}c');
  });
});

describe('unmatched close bracket', () => {
  it('emits a leading stray brace as a literal', () => {
    const e = mk();
    assertEquals(e.render('} and ${x}', { x: 'X' }), '} and X');
  });

  it('emits a trailing stray brace as a literal', () => {
    const e = mk();
    assertEquals(
      e.render('${a}} and ${b}', { a: 'A', b: 'B' }),
      'A} and B',
    );
  });
});

describe('builtin-style operators', () => {
  it('renders if-branch when the flag is truthy', () => {
    const e = mk();
    assertEquals(
      e.render('$if{ok, hello ${name}!}', { ok: true, name: 'X' }),
      ' hello X!',
    );
  });

  it('renders nothing when the flag is falsy', () => {
    const e = mk();
    assertEquals(
      e.render('$if{ok, hello ${name}!}', { ok: false, name: 'X' }),
      '',
    );
  });

  it('iterates over an array and renders each item', () => {
    const e = mk();
    assertEquals(
      e.render('$for{item,items,<li>${item}</li>}', { items: ['a', 'b', 'c'] }),
      '<li>a</li><li>b</li><li>c</li>',
    );
  });

  it('returns collection length', () => {
    const e = mk();
    assertEquals(e.render('n=$length{xs}', { xs: [1, 2, 3, 4] }), 'n=4');
  });
});

describe('flatten context', () => {
  it('keeps Date as an opaque value', () => {
    const e = mk();
    const date = new Date('2020-01-01T00:00:00Z');
    assertEquals(e.render('${d}', { d: date }), String(date));
  });

  it('keeps RegExp as an opaque value', () => {
    const e = mk();
    const re = /abc/;
    assertEquals(e.render('${r}', { r: re }), String(re));
  });

  it('keeps Map as an opaque value', () => {
    const e = mk();
    const m = new Map([['k', 'v']]);
    assertEquals(e.render('${m}', { m }), String(m));
  });

  it('resolves dot notation on nested plain objects', () => {
    const e = mk();
    assertEquals(e.render('${user.name}', { user: { name: 'Bob' } }), 'Bob');
  });

  it('resolves dot notation across multiple levels', () => {
    const e = mk();
    assertEquals(e.render('${a.b.c}', { a: { b: { c: 'deep' } } }), 'deep');
  });

  it('exposes arrays as values for collection operators', () => {
    const e = mk();
    assertEquals(e.render('$length{xs}', { xs: [1, 2, 3] }), '3');
  });

  it('renders null as the string "null"', () => {
    const e = mk();
    assertEquals(e.render('${x}', { x: null }), 'null');
  });
});

describe('operator args', () => {
  it('produces args that are JSON-serializable', () => {
    const e = mk();
    let seen;
    e.register('capture', (ctx, args) => {
      seen = args;
      return '';
    });
    e.render('$capture{a,${b},c}', { b: 'B' });
    JSON.stringify(seen);
  });
});

describe('nested render', () => {
  it('renders a for-loop over scalar items', () => {
    const e = mk();
    assertEquals(e.render('$for{x,xs,${x} }', { xs: ['a', 'b'] }), 'a b ');
  });

  it('renders a for-loop over object items with dot access', () => {
    const e = mk();
    assertEquals(
      e.render('$for{u,users,${u.name} }', { users: [{ name: 'A' }, { name: 'B' }] }),
      'A B ',
    );
  });
});
