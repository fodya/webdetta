/**
 * Data conversion utilities between common browser-facing formats:
 * text, base64, data URIs, `FormData`, JSON, `File`/`Blob`, and byte chunks.
 *
 * @example
 * ```js
 * import { textToBase64, base64ToText } from '@webdetta/core/convert';
 *
 * textToBase64('hi'); // 'aGk='
 * base64ToText('aGk='); // 'hi'
 * ```
 *
 * @module
 */

/** Encodes a UTF-8 string to a base64 string. */
export function textToBase64(text: string): string;
/** Decodes a base64 string back to a UTF-8 string. */
export function base64ToText(base64: string): string;

/** Parsed representation of a `data:` URI. */
export type DatauriJson = { mimeType: string; content: string };

/** Parses a `data:` URI into its mime type and base64 content. */
export function datauriToJson(datauri: string): DatauriJson;
/** Serializes a mime type and base64 content back into a `data:` URI. */
export function jsonToDatauri(json: DatauriJson): string;

/** Either a single `FormData` value or an array of values (for multi-valued fields). */
export type FormdataJsonValue = FormDataEntryValue | FormDataEntryValue[];
/** Converts a `FormData` instance into a plain JSON-friendly object. */
export function formdataToJson(formData: FormData): Record<string, FormdataJsonValue>;
/** Converts a plain object into a `FormData` instance. */
export function jsonToFormdata(json: Record<string, unknown>): FormData;

/** Reads a `Blob`/`File` into a `Uint8Array`. */
export function fileToBytes(file: Blob): Promise<Uint8Array>;
/** Wraps raw bytes in a `File`, with optional `name` and metadata. */
export function bytesToFile(
  bytes: Uint8Array | ArrayBuffer | ArrayLike<number>,
  name?: string,
  options?: FilePropertyBag
): File;

/** Async-iterates over a file in fixed-size chunks. */
export function fileToChunks(
  file: Blob,
  chunkSize?: number
): AsyncGenerator<Uint8Array, void, unknown>;

/** Assembles a stream of byte chunks into a single `File`. */
export function chunksToFile(
  chunks: AsyncIterable<Uint8Array> | Iterable<Uint8Array>,
  name?: string,
  options?: FilePropertyBag
): Promise<File>;

/** Decodes a `data:` URI into a `File`. */
export function datauriToFile(
  datauri: string,
  filename?: string,
  options?: FilePropertyBag
): Promise<File>;

/** Encodes a `Blob`/`File` as a `data:` URI. */
export function fileToDatauri(file: Blob): Promise<string>;

/** JSON-friendly representation of a `File`. */
export type FileJson = {
  name?: string;
  mimeType: string;
  content: string;
  size: number;
  [key: string]: unknown;
};

/** Converts a `File` into a JSON-friendly object (base64 `content`). */
export function fileToJson(file: File): Promise<FileJson>;
/** Reconstructs a `File` from its JSON representation. */
export function jsonToFile(json: FileJson & FilePropertyBag): Promise<File>;
