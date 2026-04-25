/**
 * Remote Procedure Call library for realtime APIs over WebSocket-like
 * transports. Provides a client, a server and a random-key generator used
 * for correlating request/response pairs.
 *
 * @example
 * ```js
 * import { RpcClient, RpcServer, genKey } from '@webdetta/core/rpc';
 *
 * // Server side: upgrade accepted sockets and expose RPC methods.
 * const upgrade = RpcServer({ PULSE: 30_000 });
 * upgrade.methods = {
 *   async getUser(id) { return db.users.findById(id); },
 *   async saveUser(user) { await db.users.save(user); return { ok: true }; },
 * };
 * wsServer.on('connection', (socket) => upgrade(socket));
 *
 * // Client side: connect once, call methods, handle failure with retry signal.
 * const rpc = RpcClient('wss://api.example.com/ws', { pulse: 30_000 });
 * rpc.onError((event) => ui.setNetworkError(event));
 * await rpc.connect();
 *
 * try {
 *   const user = await rpc.call('getUser', 'u-42');
 *   await rpc.call('saveUser', { ...user, plan: 'pro' });
 * } catch (error) {
 *   ui.enqueueRetry({ type: 'rpc', error });
 * } finally {
 *   await rpc.close();
 * }
 * ```
 *
 * @module
 */

/** Generic RPC method map shared by client/server instances. */
export type RpcMethods = Record<
  string,
  (...args: unknown[]) => unknown | Promise<unknown>
>;

/** Transport options for {@link RpcClient}. */
export type RpcClientOptions = {
  pulse?: number;
  binaryType?: BinaryType;
};

/** Connected RPC client instance. */
export interface RpcClientInstance {
  methods: RpcMethods;
  readonly ws: WebSocket | undefined;
  onOpen(handler: (state: boolean | undefined) => void): void;
  onMessage(handler: (event: MessageEvent<unknown>) => void): void;
  onSend(handler: (payload: unknown) => void): void;
  onError(handler: (event: Event) => void): void;
  connect(): Promise<WebSocket>;
  close(): Promise<void>;
  cast(target: string, ...args: unknown[]): Promise<void>;
  call<T = unknown>(target: string, ...args: unknown[]): Promise<T>;
}

/** Creates RPC client bound to WebSocket endpoint. */
export function RpcClient(
  url: string | URL,
  options?: RpcClientOptions
): RpcClientInstance;

/** Socket shape accepted by {@link RpcServer}. */
export interface RpcSocketLike {
  readyState: number;
  binaryType?: BinaryType | string;
  close(code?: number, reason?: string): void;
  send(data: unknown): void;
  on?(name: "close" | "error" | "message", handler: (event: unknown) => void): void;
  addEventListener?(
    name: "close" | "error" | "message",
    handler: (event: unknown) => void
  ): void;
}

/** Server-side view of upgraded socket. */
export interface RpcServerConnection {
  close(): Promise<void>;
  cast(target: string, ...args: unknown[]): void;
  call<T = unknown>(target: string, ...args: unknown[]): Promise<T>;
  onClose?: (event: unknown) => void;
}

/** Upgrade function produced by {@link RpcServer}. */
export interface RpcServerUpgrade {
  (socket: RpcSocketLike): RpcServerConnection;
  all: Set<RpcServerConnection>;
  methods: RpcMethods;
  close(): Promise<void[]>;
  onOpen?: (connection: RpcServerConnection) => void;
  onClose?: (connection: RpcServerConnection, event: unknown) => void;
}

/** Creates RPC server-upgrade function for accepted sockets. */
export function RpcServer(options?: {
  PULSE?: number;
  binaryType?: BinaryType;
}): RpcServerUpgrade;

/** Generates a random alphanumeric identifier of length `len` (default 16). */
export function genKey(len?: number): string;
