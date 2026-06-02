/**
 * Remote Procedure Calls library for web apps
 * @example ./examples/index.example.js
 * @module
 */
/**
 * @param {number} [len]
 * @returns {string}
 */
export { genKey } from "./client.js";

/**
 * @param {string | URL} url
 * @param {import('./client.js').RpcClientOptions} [options]
 * @returns {import('./client.js').RpcClientInstance}
 */
export { RpcClient } from "./client.js";

/**
 * @param {Object} [options]
 * @param {number} [options.PULSE]
 * @param {BinaryType} [options.binaryType]
 * @returns {import('./server.js').RpcServerUpgrade}
 */
export { RpcServer } from "./server.js";
