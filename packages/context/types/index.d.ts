/**
 * Scoped context values for sync and async flows.
 *
 * @example
 * ```js
 * import { Context } from '@webdetta/core/context/sync';
 * import { AsyncContext } from '@webdetta/core/context/async';
 *
 * const localeCtx = Context('en');
 * const reqIdCtx = AsyncContext('no-request');
 *
 * function renderPrice(value) {
 *   return localeCtx() === 'fr' ? `${value} EUR` : `$${value}`;
 * }
 *
 * async function fetchData() {
 *   return { requestId: reqIdCtx(), theme: localeCtx(), user: 'ada' };
 * }
 *
 * const html = localeCtx.run('fr', () => renderPrice(20)); // "20 EUR"
 * const profile = await reqIdCtx.run('req-42', async () =>
 *   localeCtx.run('dark', () =>
 *     fetchData()
 *   )
 * );
 *
 * const snap = Context.Snapshot();
 * const price = snap.set(localeCtx).run(() => renderPrice(20));
 * ```
 */
export * from './sync.d.ts';
export * from './async.d.ts';
