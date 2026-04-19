/**
 * realcss adapter backed by realdom. Flushes style nodes into a `<style>`
 * element appended to the document head (or a custom root).
 *
 * @module
 */
import type { AdapterFactory } from './index.d.ts';

/** Default adapter factory for realcss using realdom as the host. */
declare const realdomAdapter: AdapterFactory;
export default realdomAdapter;
