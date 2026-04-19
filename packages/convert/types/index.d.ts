/// <reference lib="dom" />
export function textToBase64(text: string): string;
export function base64ToText(base64: string): string;

export type DatauriJson = { mimeType: string; content: string };

export function datauriToJson(datauri: string): DatauriJson;
export function jsonToDatauri(json: DatauriJson): string;

export type FormdataJsonValue = FormDataEntryValue | FormDataEntryValue[];
export function formdataToJson(formData: FormData): Record<string, FormdataJsonValue>;
export function jsonToFormdata(json: Record<string, unknown>): FormData;

export function fileToBytes(file: Blob): Promise<Uint8Array>;
export function bytesToFile(
  bytes: Uint8Array | ArrayBuffer | ArrayLike<number>,
  name?: string,
  options?: FilePropertyBag
): File;

export function fileToChunks(
  file: Blob,
  chunkSize?: number
): AsyncGenerator<Uint8Array, void, unknown>;

export function chunksToFile(
  chunks: AsyncIterable<Uint8Array> | Iterable<Uint8Array>,
  name?: string,
  options?: FilePropertyBag
): Promise<File>;

export function datauriToFile(
  datauri: string,
  filename?: string,
  options?: FilePropertyBag
): Promise<File>;

export function fileToDatauri(file: Blob): Promise<string>;

export type FileJson = {
  name?: string;
  mimeType: string;
  content: string;
  size: number;
  [key: string]: unknown;
};

export function fileToJson(file: File): Promise<FileJson>;
export function jsonToFile(json: FileJson & FilePropertyBag): Promise<File>;
