import { describe, it } from 'jsr:@std/testing/bdd';
import { assertEquals } from 'jsr:@std/assert';
import { r } from '../index.js';

/** Solid-style port. Two-arg watch simulated with prev locals. */
describe('solid port: memo side-effect + deferred watch', () => {
  it('memo drives doubleCount; effect tracks count+double (reruns when memo writes doubleCount)', () => {
    const count = r.val(0);
    const doubleCount = r.val(undefined);

    const countAsString = r.computed(() => {
      const c = count();
      doubleCount(c * 2);
      return String(c);
    });

    const inDouble = [];
    const doublePrev = [];
    let prevPair = undefined;
    r.effect(() => {
      const c = count();
      const d = doubleCount();
      inDouble.push([c, d]);
      const cur = [c, d];
      if (prevPair !== undefined) {
        doublePrev.push([prevPair[0], prevPair[1]]);
      }
      prevPair = cur;
    });

    const stringPrev = [];
    let prevStr = undefined;
    r.effect(() => {
      const v = countAsString();
      if (prevStr !== undefined) {
        stringPrev.push(prevStr);
      }
      prevStr = v;
    });

    assertEquals(count(), 0);
    assertEquals(doubleCount(), 0);
    assertEquals(countAsString(), '0');
    assertEquals(inDouble, [[0, 0]]);
    assertEquals(doublePrev, []);
    assertEquals(stringPrev, []);

    count(1);
    assertEquals(doubleCount(), 2);
    assertEquals(countAsString(), '1');
    assertEquals(inDouble, [[0, 0], [1, 2], [1, 2]]);
    assertEquals(doublePrev, [[0, 0], [1, 2]]);
    assertEquals(stringPrev, ['0']);

    count(2);
    assertEquals(doubleCount(), 4);
    assertEquals(countAsString(), '2');
    assertEquals(inDouble, [[0, 0], [1, 2], [1, 2], [2, 4], [2, 4]]);
    assertEquals(doublePrev, [[0, 0], [1, 2], [1, 2], [2, 4]]);
    assertEquals(stringPrev, ['0', '1']);
  });
});
