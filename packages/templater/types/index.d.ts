export interface TemplaterConfig {
  operatorSymbol: string;
  openBracket: string;
  closeBracket: string;
  argumentsSeparator: string;
  onOperatorNotFound?: (operator: string, parentNode: ParseNode) => void;
}

export type ParseNode = {
  operator: string | null;
  args: ParseArg[];
  nested: number;
};

export type ParseArg = string | ParseNode;

export type RenderFn = (node: ParseArg | ParseArg[], ctx: Record<string, unknown>) => string;

export type OperatorFn = (
  ctx: Record<string, unknown>,
  args: ParseArg[],
  render: RenderFn,
) => string;

export interface TemplaterInstance {
  register(name: string, func: OperatorFn): void;
  parse(str: string): ParseNode;
  render(str: string, ctx: Record<string, unknown>): string;
}

export function Templater(config: TemplaterConfig): TemplaterInstance;
