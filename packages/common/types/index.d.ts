/**
 * Common helpers split by domain: DOM, runtime detection, and general utils.
 *
 * @example
 * ```js
 * import { setThemeColor, kebab } from '@webdetta/core/common/dom';
 * import { runtime, isMobileBrowser } from '@webdetta/core/common/environment';
 * import { arr, objectPick } from '@webdetta/core/common/utils';
 *
 * const featureFlags = objectPick(
 *   { darkMode: true, beta: false, compact: true },
 *   ['darkMode', 'compact'],
 * );
 * const routeClass = kebab('AccountSettingsPage');
 * const classList = arr`class1 class2 class3
 *  classA classB classC
 *  page ${routeClass} ${isMobileBrowser ? 'mobile' : 'desktop'}
 * `;
 *
 * if (runtime === 'browser') {
 *   setThemeColor(featureFlags.darkMode ? '#111827' : '#ffffff');
 *   document.body.className = classList.join(' ');
 * }
 * ```
 */
export * from './utils.d.ts';
export * from './environment.d.ts';
export * from './dom.d.ts';
