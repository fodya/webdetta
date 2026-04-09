import { describe, it } from 'jsr:@std/testing/bdd';
import { assert, assertEquals, assertRejects } from 'jsr:@std/assert';
import {
  safe,
  once,
  sleep,
  throttle,
  debounce,
  cached,
  backoff,
} from '../index.js';

describe('safe', () => {
  it('default onError on sync throw', () => {
    const seen = [];
    const orig = safe.defaultErrorHandler;
    safe.defaultErrorHandler = (e) => void seen.push(e);
    try {
      const wrapped = safe(() => {
        throw new Error('default-handler');
      });
      wrapped();
      assertEquals(seen.length, 1);
      assertEquals(seen[0].message, 'default-handler');
    } finally {
      safe.defaultErrorHandler = orig;
    }
  });

  it('sync error handler', () => {
    let seen;
    const wrapped = safe(() => {
      throw new Error('boom');
    }, e => { seen = e.message; });
    assertEquals(wrapped(), undefined);
    assertEquals(seen, 'boom');
  });

  it('async error handler', async () => {
    let seen;
    const wrapped = safe(async () => {
      throw new Error('async-boom');
    }, e => { seen = e.message; });
    await wrapped();
    assertEquals(seen, 'async-boom');
  });

  it('sync return value', () => {
    const wrapped = safe(() => 42, () => {});
    assertEquals(wrapped(), 42);
  });

  it('async return value', async () => {
    const wrapped = safe(async () => 99, () => {});
    assertEquals(await wrapped(), 99);
  });
});

describe('once', () => {
  it('single run', () => {
    let runs = 0;
    const wrapped = once(() => (++runs, 'ok'));
    assertEquals(wrapped(), 'ok');
    assertEquals(wrapped(), undefined);
    assertEquals(runs, 1);
  });

  it('arguments', () => {
    const wrapped = once((a, b) => a + b);
    assertEquals(wrapped(2, 3), 5);
    assertEquals(wrapped(10, 10), undefined);
  });
});

describe('sleep', () => {
  it('before waits then runs func', async () => {
    const waitMs = 25;
    const started = performance.now();
    let funcAt;
    const out = await sleep.before(waitMs, () => {
      funcAt = performance.now();
      return 'done';
    });
    assertEquals(out, 'done');
    assert(funcAt != null);
    assert(funcAt - started >= waitMs * 0.9);
  });

  it('after runs func then waits', async () => {
    const waitMs = 25;
    const started = performance.now();
    let funcAt;
    const out = await sleep.after(waitMs, () => {
      funcAt = performance.now();
      return 7;
    });
    const ended = performance.now();
    assertEquals(out, 7);
    assert(funcAt != null);
    assert(funcAt - started < waitMs * 0.5);
    assert(ended - funcAt >= waitMs * 0.9);
  });
});

describe('throttle', () => {
  it('async lock sharing', async () => {
    let runs = 0;
    const wrapped = throttle(async (v) => {
      runs++;
      await sleep(5);
      return v * 2;
    });

    const p1 = wrapped(2);
    const p2 = wrapped(3);
    assert(p1 === p2);
    assertEquals(await p1, 4);
    assertEquals(runs, 1);
  });

  it('sync concurrent calls', () => {
    let runs = 0;
    const wrapped = throttle((x) => (++runs, x + 1));
    assertEquals(wrapped(1), 2);
    assertEquals(wrapped(1), 2);
    assertEquals(runs, 2);
  });

  it('true while async work pending', async () => {
    const wrapped = throttle(async () => {
      await sleep(20);
      return 1;
    });
    const p = wrapped();
    assertEquals(wrapped.isLocked(), true);
    await p;
    assertEquals(wrapped.isLocked(), false);
  });

  it('false for sync function', () => {
    const wrapped = throttle(() => 1);
    assertEquals(wrapped.isLocked(), false);
    assertEquals(wrapped(), 1);
    assertEquals(wrapped.isLocked(), false);
  });
});

describe('debounce', () => {
  it('default onError when options omitted', async () => {
    const seen = [];
    const orig = console.error;
    console.error = (e) => void seen.push(e);
    try {
      const wrapped = debounce(2, () => {
        throw new Error('debounce-default');
      });
      await assertRejects(() => wrapped());
      assertEquals(seen.length, 1);
      assertEquals(seen[0].message, 'debounce-default');
    } finally {
      console.error = orig;
    }
  });

  it('latest call result', async () => {
    const wrapped = debounce(2, (v) => v + 1, { onError: () => {} });
    const first = wrapped(1);
    const second = wrapped(2);
    await assertRejects(() => first);
    assertEquals(await second, 3);
  });

  it('true until timer fires', async () => {
    const wrapped = debounce(40, () => 1, { onError: () => {} });
    const p = wrapped();
    assertEquals(wrapped.isLocked(), true);
    assertEquals(await p, 1);
    assertEquals(wrapped.isLocked(), false);
  });

  it('sync throw in func', async () => {
    let seen;
    const wrapped = debounce(2, () => {
      throw new Error('debounce-boom');
    }, { onError: e => { seen = e.message; } });
    await assertRejects(() => wrapped());
    assertEquals(seen, 'debounce-boom');
  });
});

describe('cached', () => {
  it('memoized value', () => {
    let runs = 0;
    const wrapped = cached((x) => (++runs, x * 2));
    assertEquals(wrapped(2), 4);
    assertEquals(wrapped(2), 4);
    assertEquals(runs, 1);
  });

  it('falsy result cached', () => {
    let runs = 0;
    const wrapped = cached(() => (++runs, 0));
    assertEquals(wrapped(), 0);
    assertEquals(wrapped(), 0);
    assertEquals(runs, 1);
  });

  it('custom keyFn', () => {
    let runs = 0;
    const wrapped = cached(
      (a, b) => (++runs, `${a}:${b}`),
      (a, b) => `${a}|${b}`,
    );
    assertEquals(wrapped('x', 'y'), 'x:y');
    assertEquals(wrapped('x', 'y'), 'x:y');
    assertEquals(runs, 1);
    assertEquals(wrapped('x', 'z'), 'x:z');
    assertEquals(runs, 2);
  });

  it('custom map and manual invalidation', () => {
    const map = new Map();
    let runs = 0;
    const wrapped = cached((k) => (++runs, k.toUpperCase()), String, map);
    assertEquals(wrapped('a'), 'A');
    assertEquals(wrapped('a'), 'A');
    assertEquals(runs, 1);
    assertEquals(map.size, 1);
    map.delete('a');
    assertEquals(wrapped('a'), 'A');
    assertEquals(runs, 2);
  });

  it('default keyFn coerces key with String', () => {
    let runs = 0;
    const wrapped = cached((x) => (++runs, x.n));
    assertEquals(wrapped({ n: 1 }), 1);
    assertEquals(wrapped({ n: 2 }), 1);
    assertEquals(runs, 1);
  });
});

describe('backoff', () => {
  it('success after retries', async () => {
    let tries = 0;
    const result = await backoff({
      retries: 3,
      delay: (attempt) => 10 * 2 ** attempt,
      jitter: false,
      onError: () => {},
    }, async () => {
      tries++;
      if (tries < 3) throw new Error('retry');
      return 'ok';
    });
    assertEquals(result, 'ok');
    assertEquals(tries, 3);
  });

  it('delay function receives attempt index', async () => {
    let tries = 0;
    const attempts = [];
    await backoff({
      retries: 3,
      delay: (attempt) => {
        attempts.push(attempt);
        return 0;
      },
      jitter: false,
      onError: () => {},
    }, async () => {
      tries++;
      if (tries < 3) throw new Error('retry');
      return 'done';
    });
    assertEquals(attempts, [0, 1]);
  });

  it('exponential object delay', async () => {
    let tries = 0;
    const result = await backoff({
      retries: 4,
      delay: { base: 5, factor: 2 },
      jitter: false,
      onError: () => {},
    }, async () => {
      tries++;
      if (tries < 2) throw new Error('retry');
      return 'ok';
    });
    assertEquals(result, 'ok');
    assertEquals(tries, 2);
  });

  it('last error after retries exhausted', async () => {
    const err = new Error('final');
    await assertRejects(
      () => backoff({
        retries: 2,
        delay: () => 0,
        jitter: false,
        onError: () => {},
      }, async () => {
        throw err;
      }),
      Error,
      'final',
    );
  });

  it('invalid retries', async () => {
    await assertRejects(
      () => backoff({
        retries: 'nope',
        delay: () => 0,
        jitter: false,
        onError: () => {},
      }, () => {}),
      Error,
    );
  });

  it('invalid jitter option', async () => {
    await assertRejects(
      () => backoff({
        retries: 1,
        delay: () => 0,
        jitter: 'not-a-mode',
        onError: () => {},
      }, () => {}),
      Error,
    );
  });

  it('invalid delay argument', async () => {
    await assertRejects(
      () => backoff({
        retries: 1,
        delay: 'not-fn-or-object',
        jitter: false,
        onError: () => {},
      }, () => {}),
      Error,
    );
  });

  it('jitter full equal and decorrelated string modes', async () => {
    for (const jitterMode of ['full', 'equal', 'decorrelated']) {
      let n = 0;
      await backoff({
        retries: 2,
        delay: () => 1,
        jitter: jitterMode,
        onError: () => {},
      }, async () => {
        n++;
        if (n < 2) throw new Error('retry');
        return jitterMode;
      });
      assertEquals(n, 2);
    }
  });

  it('custom jitter function and min max delay', async () => {
    let n = 0;
    const jitterCalls = [];
    await backoff({
      retries: 3,
      delay: () => 100,
      minDelay: 40,
      maxDelay: 50,
      jitter: (ms, prev) => {
        jitterCalls.push({ ms, prev });
        return 45;
      },
      onError: () => {},
    }, async () => {
      n++;
      if (n < 3) throw new Error('retry');
      return 'ok';
    });
    assertEquals(n, 3);
    assertEquals(jitterCalls.length, 2);
  });

  it('default onError when omitted', async () => {
    const seen = [];
    const orig = console.error;
    console.error = (...a) => void seen.push(a[0]);
    try {
      await assertRejects(
        () => backoff({
          retries: 2,
          delay: () => 0,
          jitter: false,
        }, async () => {
          throw new Error('backoff-fail');
        }),
        Error,
        'backoff-fail',
      );
      assertEquals(seen.length >= 1, true);
    } finally {
      console.error = orig;
    }
  });
});
