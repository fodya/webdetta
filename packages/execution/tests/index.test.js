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
  it('falls back to the default handler when no handler is provided', () => {
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

  it('forwards sync errors to the provided handler', () => {
    let seen;
    const wrapped = safe(() => {
      throw new Error('boom');
    }, e => { seen = e.message; });
    assertEquals(wrapped(), undefined);
    assertEquals(seen, 'boom');
  });

  it('forwards async errors to the provided handler', async () => {
    let seen;
    const wrapped = safe(async () => {
      throw new Error('async-boom');
    }, e => { seen = e.message; });
    await wrapped();
    assertEquals(seen, 'async-boom');
  });

  it('returns the wrapped sync function result unchanged', () => {
    const wrapped = safe(() => 42, () => {});
    assertEquals(wrapped(), 42);
  });

  it('returns the wrapped async function result unchanged', async () => {
    const wrapped = safe(async () => 99, () => {});
    assertEquals(await wrapped(), 99);
  });
});

describe('once', () => {
  it('runs the wrapped function only on the first call', () => {
    let runs = 0;
    const wrapped = once(() => (++runs, 'ok'));
    assertEquals(wrapped(), 'ok');
    assertEquals(wrapped(), undefined);
    assertEquals(runs, 1);
  });

  it('forwards arguments to the underlying function on the first call', () => {
    const wrapped = once((a, b) => a + b);
    assertEquals(wrapped(2, 3), 5);
    assertEquals(wrapped(10, 10), undefined);
  });
});

describe('sleep', () => {
  it('waits the requested time before running the function', async () => {
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

  it('runs the function first and waits the remainder afterwards', async () => {
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
  it('shares one pending async invocation across overlapping callers', async () => {
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

  it('does not share results between sequential sync calls', () => {
    let runs = 0;
    const wrapped = throttle((x) => (++runs, x + 1));
    assertEquals(wrapped(1), 2);
    assertEquals(wrapped(1), 2);
    assertEquals(runs, 2);
  });

  it('reports isLocked while an async call is pending', async () => {
    const wrapped = throttle(async () => {
      await sleep(20);
      return 1;
    });
    const p = wrapped();
    assertEquals(wrapped.isLocked(), true);
    await p;
    assertEquals(wrapped.isLocked(), false);
  });

  it('never reports isLocked for a purely synchronous function', () => {
    const wrapped = throttle(() => 1);
    assertEquals(wrapped.isLocked(), false);
    assertEquals(wrapped(), 1);
    assertEquals(wrapped.isLocked(), false);
  });
});

describe('debounce', () => {
  it('forwards errors to console.error when no handler is provided', async () => {
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

  it('cancels earlier calls and resolves only the latest', async () => {
    const wrapped = debounce(2, (v) => v + 1, { onError: () => {} });
    const first = wrapped(1);
    const second = wrapped(2);
    await assertRejects(() => first);
    assertEquals(await second, 3);
  });

  it('reports isLocked while the debounce timer is armed', async () => {
    const wrapped = debounce(40, () => 1, { onError: () => {} });
    const p = wrapped();
    assertEquals(wrapped.isLocked(), true);
    assertEquals(await p, 1);
    assertEquals(wrapped.isLocked(), false);
  });

  it('forwards sync errors from the underlying function to the handler', async () => {
    let seen;
    const wrapped = debounce(2, () => {
      throw new Error('debounce-boom');
    }, { onError: e => { seen = e.message; } });
    await assertRejects(() => wrapped());
    assertEquals(seen, 'debounce-boom');
  });
});

describe('cached', () => {
  it('memoizes the computed value for the same argument', () => {
    let runs = 0;
    const wrapped = cached((x) => (++runs, x * 2));
    assertEquals(wrapped(2), 4);
    assertEquals(wrapped(2), 4);
    assertEquals(runs, 1);
  });

  it('caches falsy results just like truthy ones', () => {
    let runs = 0;
    const wrapped = cached(() => (++runs, 0));
    assertEquals(wrapped(), 0);
    assertEquals(wrapped(), 0);
    assertEquals(runs, 1);
  });

  it('uses the custom key function to group calls', () => {
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

  it('accepts an external map for manual invalidation', () => {
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

  it('coerces the first argument with String for the default key', () => {
    let runs = 0;
    const wrapped = cached((x) => (++runs, x.n));
    assertEquals(wrapped({ n: 1 }), 1);
    assertEquals(wrapped({ n: 2 }), 1);
    assertEquals(runs, 1);
  });
});

describe('backoff', () => {
  it('resolves with the result once the wrapped call eventually succeeds', async () => {
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

  it('passes the current attempt index to the delay function', async () => {
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

  it('accepts an exponential delay config object', async () => {
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

  it('rejects with the last error once retries are exhausted', async () => {
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

  it('rejects when retries is not a valid number', async () => {
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

  it('rejects when jitter is set to an unknown mode', async () => {
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

  it('rejects when delay is neither a function nor a config object', async () => {
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

  it('accepts the built-in jitter modes full, equal and decorrelated', async () => {
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

  it('invokes a custom jitter function bounded by min and max delay', async () => {
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

  it('logs retry errors through console.error when no handler is provided', async () => {
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
