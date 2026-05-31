/**
 * Scoped context values for sync and async flows.
 *
 * @example server
 * ```js
 * import { AsyncContext } from '@webdetta/context/async';
 *
 * const requestId = AsyncContext(null);
 * const userId = AsyncContext(null);
 *
 * async function dbQuery() {
 *   await new Promise((r) => setTimeout(r, 10));
 *   const data = ['a', 'b', 'c'];
 *   console.log(requestId(), userId(), data);
 *   return {
 *     requestId: requestId(),
 *     userId: userId(),
 *     data
 *   };
 * }
 *
 * async function handler(req) {
 *   return requestId.run(req.id, () =>
 *     userId.run(req.userId, async () => {
 *       const result = await dbQuery();
 *
 *       return {
 *         ok: true,
 *         result
 *       };
 *     })
 *   );
 * }
 *
 * const response = await handler({ id: 'req-42', userId: 'u-7' });
 * ```
 *
 * @example client
 * ```js
 * import { Context } from '@webdetta/context/sync';
 *
 * const locale = Context('en-US');
 * const currency = Context('USD');
 *
 * function formatPrice(value) {
 *   const formatter = new Intl.NumberFormat(locale(), {
 *     style: 'currency',
 *     currency: currency()
 *   });
 *
 *   return formatter.format(value);
 * }
 *
 * function renderCard(product) {
 *   return {
 *     title: product.name,
 *     price: formatPrice(product.price)
 *   };
 * }
 *
 * const ui = locale.run('fr-FR', () =>
 *   currency.run('EUR', () =>
 *     renderCard({ name: 'Book', price: 20 })
 *   )
 * );
 * ```
 *
 * @module
 */
export * from "./sync.d.ts";
export * from "./async.d.ts";
