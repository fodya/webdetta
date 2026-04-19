import { describe, it } from 'jsr:@std/testing/bdd';
import { assertEquals } from 'jsr:@std/assert';
import { logger, withLogger, withLoggerFormatter } from '../index.js';

function capture() {
  const calls = [];
  return {
    calls,
    log: (...a) => void calls.push(['log', a]),
    info: (...a) => void calls.push(['info', a]),
    warn: (...a) => void calls.push(['warn', a]),
    error: (...a) => void calls.push(['error', a]),
    debug: (...a) => void calls.push(['debug', a]),
    trace: (...a) => void calls.push(['trace', a]),
  };
}

describe('withLogger', () => {
  it('routes logger calls to the bound sink', () => {
    const c = capture();
    withLogger(c, () => {
      logger.info('hi', 1);
      logger.warn('w');
    });
    assertEquals(c.calls, [
      ['info', ['hi', 1]],
      ['warn', ['w']],
    ]);
  });

  it('returns the callback result', () => {
    const c = capture();
    assertEquals(withLogger(c, () => 'ok'), 'ok');
  });

  it('restores the outer logger after a nested withLogger block', () => {
    const outer = capture();
    const inner = capture();
    withLogger(outer, () => {
      logger.info('o1');
      withLogger(inner, () => {
        logger.info('i1');
      });
      logger.info('o2');
    });
    assertEquals(outer.calls, [
      ['info', ['o1']],
      ['info', ['o2']],
    ]);
    assertEquals(inner.calls, [['info', ['i1']]]);
  });
});

describe('withLoggerFormatter', () => {
  it('prepends formatter output to the logged arguments', () => {
    const c = capture();
    withLogger(c, () => {
      withLoggerFormatter(
        (args) => ['[app]', ...args],
        () => {
          logger.info('ready');
        },
      );
    });
    assertEquals(c.calls, [['info', ['[app]', 'ready']]]);
  });

  it('chains nested formatters from outer to inner', () => {
    const c = capture();
    withLogger(c, () => {
      withLoggerFormatter(
        (a) => ['A', ...a],
        () => {
          withLoggerFormatter(
            (a) => ['B', ...a],
            () => {
              withLoggerFormatter(
                (a) => ['C', ...a],
                () => logger.info('x'),
              );
            },
          );
        },
      );
    });
    assertEquals(c.calls, [['info', ['A', 'B', 'C', 'x']]]);
  });

  it('skips outer formatters when inner sets stopPropagation', () => {
    const c = capture();
    let outerRan = false;
    withLogger(c, () => {
      withLoggerFormatter(
        (args) => {
          outerRan = true;
          return ['[outer]', ...args];
        },
        () => {
          withLoggerFormatter(
            function (args) {
              this.stopPropagation = true;
              return ['[inner]', ...args];
            },
            () => {
              logger.info('x');
            },
          );
        },
      );
    });
    assertEquals(outerRan, false);
    assertEquals(c.calls, [['info', ['[inner]', 'x']]]);
  });

  it('returns the callback result', () => {
    assertEquals(withLoggerFormatter((a) => a, () => 7), 7);
  });

  it('passes the original arguments array to the formatter', () => {
    const c = capture();
    let seen;
    withLogger(c, () => {
      withLoggerFormatter(
        (args, orig) => {
          seen = { args, sameRef: args === orig };
          return args;
        },
        () => {
          logger.info('a', 'b');
        },
      );
    });
    assertEquals(seen.sameRef, true);
    assertEquals(Array.from(seen.args), ['a', 'b']);
  });

  it('stops applying the formatter once its block exits', () => {
    const c = capture();
    withLogger(c, () => {
      withLoggerFormatter(
        (a) => ['fmt', ...a],
        () => logger.info('a'),
      );
      logger.info('b');
    });
    assertEquals(c.calls, [
      ['info', ['fmt', 'a']],
      ['info', ['b']],
    ]);
  });
});

describe('logger', () => {
  it('forwards each log level to the matching sink method', () => {
    const c = capture();
    withLogger(c, () => {
      logger.log(1);
      logger.info(2);
      logger.warn(3);
      logger.error(4);
      logger.debug(5);
      logger.trace(6);
    });
    assertEquals(c.calls, [
      ['log', [1]],
      ['info', [2]],
      ['warn', [3]],
      ['error', [4]],
      ['debug', [5]],
      ['trace', [6]],
    ]);
  });

  it('silently ignores levels the sink does not implement', () => {
    const c = {
      calls: [],
      info: (...a) => void c.calls.push(a),
    };
    withLogger(c, () => {
      logger.warn('ignored');
      logger.info('kept');
    });
    assertEquals(c.calls, [['kept']]);
  });

  it('forwards calls with no arguments as an empty argument list', () => {
    const c = capture();
    withLogger(c, () => {
      logger.info();
    });
    assertEquals(c.calls, [['info', []]]);
  });
});
