import process from "node:process";
import { isClientRuntime, runtime } from "@webdetta/common/environment";

/**
 * @typedef {Object} NormalizedError
 * @property {string} message
 * @property {string} [stack]
 * @property {unknown} [cause]
 */

/**
 * @typedef {Object} UncaughtEvent
 * @property {NormalizedError} error
 * @property {import("@webdetta/common/environment").Runtime | "unknown"} runtime
 * @property {"exception" | "promiseRejection"} type
 * @property {unknown} [origin]
 */

/**
 * @typedef {(event: UncaughtEvent) => void} UncaughtHandler
 */

/**
 * @param {unknown} value
 * @returns {NormalizedError}
 */
const normalizeError = (value) => {
  if (value instanceof Error) {
    return { message: value.message, stack: value.stack, cause: value.cause };
  }
  if (value && typeof value == "object" && "message" in value) {
    return { message: String(value.message) };
  }
  return { message: String(value) };
};

/** @type {UncaughtHandler} */
const defaultHandler = ({ error, type, origin }) =>
  console.error(
    type == "promiseRejection" ? "Unhandled rejection:" : "Uncaught exception:",
    error.message,
    error.stack ? "\n" + error.stack : "",
    origin ?? "",
  );

/** @type {boolean} */
let initialized = false;

/**
 * @param {UncaughtHandler} [handler]
 * @returns {void}
 */
export const handleUncaughtErrors = (handler = defaultHandler) => {
  if (initialized) return;
  initialized = true;

  /**
   * @param {"exception" | "promiseRejection"} type
   * @param {unknown} value
   * @param {unknown} [origin]
   * @returns {void}
   */
  const emit = (type, value, origin) =>
    handler({
      error: normalizeError(value),
      runtime: runtime ?? "unknown",
      type,
      origin,
    });

  if (isClientRuntime) {
    const g = globalThis.window ?? globalThis.self;
    g.addEventListener(
      "error",
      (e) => emit("exception", e.error ?? e.message, e),
    );
    g.addEventListener(
      "unhandledrejection",
      (e) => emit("promiseRejection", e.reason, e),
    );
  } else if (runtime === "deno") {
    globalThis.addEventListener("error", (e) => {
      e.preventDefault?.();
      emit("exception", e.error ?? e.message, e);
    });
    globalThis.addEventListener("unhandledrejection", (e) => {
      e.preventDefault?.();
      emit("promiseRejection", e.reason, e);
    });
  } else {
    process.on(
      "uncaughtException",
      (error, origin) => emit("exception", error, origin),
    );
    process.on(
      "unhandledRejection",
      (reason, promise) => emit("promiseRejection", reason, promise),
    );
  }
};
