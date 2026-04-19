/**
 * Remote Procedure Call library for realtime APIs over WebSocket-like
 * transports. Provides a client, a server and a random-key generator used
 * for correlating request/response pairs.
 *
 * @module
 */

/** Constructor for an RPC client bound to a transport. */
export const RpcClient: any;

/** Constructor for an RPC server bound to a transport and a handler map. */
export const RpcServer: any;

/** Generates a random alphanumeric identifier of length `len` (default 16). */
export function genKey(len?: number): string;
