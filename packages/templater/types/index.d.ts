/**
 * Extensible template engine. Parses templates into operator trees and
 * renders them against a context object; operators are registered by name
 * on a {@link TemplaterInstance}.
 *
 * @example
 * ```js
 * import { Templater } from '@webdetta/core/templater';
 *
 * const t = Templater({
 *   operatorSymbol: '$',
 *   openBracket: '{',
 *   closeBracket: '}',
 *   argumentsSeparator: ',',
 * });
 * t.register('', (ctx, args) => String(ctx[args[0]] ?? ''));
 * t.register('upper', (ctx, args, render) => render(args, ctx).toUpperCase());
 * t.register('money', (_ctx, args) => `$${Number(args[0]).toFixed(2)}`);
 *
 * const template = (
 *   'Hello ${customerName}, your order total is $money{${total}}. ' +
 *   'Status: $upper{${status}}'
 * );
 * t.parse(template); // optional pre-validation step
 *
 * const text = t.render(template, {
 *   customerName: 'Ada',
 *   total: 42,
 *   status: 'processing',
 * });
 * // "Hello Ada, your order total is $42.00. Status: PROCESSING"
 * ```
 *
 * @module
 */

/** Configuration for a {@link Templater}. */
export interface TemplaterConfig {
  /** Symbol that marks the start of an operator call (e.g. `$`). */
  operatorSymbol: string;
  /** Opening bracket of an operator call. */
  openBracket: string;
  /** Closing bracket of an operator call. */
  closeBracket: string;
  /** Separator between arguments within an operator call. */
  argumentsSeparator: string;
  /** Optional handler for unknown operator names. */
  onOperatorNotFound?: (operator: string, parentNode: ParseNode) => void;
}

/** Parsed node in a template tree. */
export type ParseNode = {
  operator: string | null;
  args: ParseArg[];
  nested: number;
};

/** A parsed argument: either raw text or another {@link ParseNode}. */
export type ParseArg = string | ParseNode;

/** Renders a parsed node (or array) against the given context. */
export type RenderFn = (node: ParseArg | ParseArg[], ctx: Record<string, unknown>) => string;

/** Implementation of a named operator. */
export type OperatorFn = (
  ctx: Record<string, unknown>,
  args: ParseArg[],
  render: RenderFn,
) => string;

/** A configured templater: register operators, parse templates, render strings. */
export interface TemplaterInstance {
  /** Registers a named operator function. */
  register(name: string, func: OperatorFn): void;
  /** Parses a template string into a tree. */
  parse(str: string): ParseNode;
  /** Parses and renders a template string against a context. */
  render(str: string, ctx: Record<string, unknown>): string;
}

/** Creates a new {@link TemplaterInstance} from the given configuration. */
export function Templater(config: TemplaterConfig): TemplaterInstance;
