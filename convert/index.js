/**
 * Data conversion for text, base64, datauri, file/bytes, formdata, json and more
 * @example ./examples/index.example.js
 * @module
 */
/**
 * @typedef {Object} DatauriJson
 * @property {string} mimeType
 * @property {string} content
 */

/**
 * @typedef {FormDataEntryValue | FormDataEntryValue[]} FormdataJsonValue
 */

/**
 * @typedef {Object} FileJson
 * @property {string} [name]
 * @property {string} mimeType
 * @property {string} content
 * @property {number} size
 */

/**
 * @param {string} text
 * @returns {string}
 */
export const textToBase64 = (text) => {
  const bytes = new TextEncoder().encode(text);
  const str = Array.from(bytes, (b) => String.fromCodePoint(b)).join("");
  return btoa(str);
};

/**
 * @param {string} base64
 * @returns {string}
 */
export const base64ToText = (base64) => {
  const str = atob(base64);
  const bytes = Uint8Array.from(str, (m) => m.codePointAt(0));
  return new TextDecoder().decode(bytes);
};

/**
 * @param {Uint8Array | ArrayBuffer | ArrayLike<number>} bytes
 * @returns {string}
 */
export const bytesToBase64 = (bytes) => {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    binary += String.fromCharCode(...u8.subarray(i, i + chunk));
  }
  return btoa(binary);
};

/**
 * @param {string} base64
 * @returns {Uint8Array}
 */
export const base64ToBytes = (base64) => {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
};

/**
 * @param {string} datauri
 * @returns {DatauriJson}
 */
export const datauriToJson = (datauri) => {
  const comma = datauri.indexOf(",");
  const mimeType = datauri.slice(5, datauri.indexOf(";"));
  const content = datauri.slice(comma + 1);
  return { mimeType, content };
};

/**
 * @param {DatauriJson} json
 * @returns {string}
 */
export const jsonToDatauri = ({ mimeType, content }) =>
  `data:${mimeType};base64,${content}`;

/**
 * @param {FormData} formData
 * @returns {Record<string, FormdataJsonValue>}
 */
export const formdataToJson = (formData) => {
  return Object.fromEntries(
    Array.from(formData.keys()).map((key) => [
      key,
      formData.getAll(key).length > 1
        ? formData.getAll(key)
        : formData.get(key),
    ]),
  );
};
const jsonToFormdata_ = (json, formData, parentKey) => {
  const isObject = json && typeof json === "object" && !(json instanceof File);
  const isArray = Array.isArray(json);
  if (isObject) {
    for (const key of Object.keys(json)) {
      const fullKey = parentKey ? `${parentKey}[${key}]` : key;
      jsonToFormdata_(json[key], formData, isArray ? parentKey : fullKey);
    }
  } else formData.append(parentKey, json);
  return formData;
};

/**
 * @param {Record<string, unknown>} json
 * @returns {FormData}
 */
export const jsonToFormdata = (json) =>
  jsonToFormdata_(json, new FormData(), "");

/**
 * @param {Blob} file
 * @returns {Promise<Uint8Array>}
 */
export const fileToBytes = async (file) => {
  return new Uint8Array(await file.arrayBuffer());
};

/**
 * @param {Uint8Array | ArrayBuffer | ArrayLike<number>} bytes
 * @param {string} [name]
 * @param {FilePropertyBag} [options]
 * @returns {File}
 */
export const bytesToFile = (bytes, name = "unnamed", options = {}) => {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return new File([u8], name, options);
};

/**
 * @param {Blob} file
 * @param {number} [chunkSize]
 * @returns {AsyncGenerator<Uint8Array, void, unknown>}
 */
export async function* fileToChunks(file, chunkSize = 256 * 1024) {
  let offset = 0;
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    yield new Uint8Array(await chunk.arrayBuffer());
    offset += chunkSize;
  }
}

/**
 * @param {AsyncIterable<Uint8Array> | Iterable<Uint8Array>} chunks
 * @param {string} [name]
 * @param {FilePropertyBag} [options]
 * @returns {Promise<File>}
 */
export const chunksToFile = async (chunks, name = "unnamed", options = {}) => {
  const bytes = [];
  for await (const chunk of chunks) bytes.push(...chunk);
  return new File([new Uint8Array(bytes)], name, options);
};

/**
 * @param {string} datauri
 * @param {string} [filename]
 * @param {FilePropertyBag} [options]
 * @returns {Promise<File>}
 */
export const datauriToFile = (datauri, filename = "unnamed", options = {}) => {
  const { mimeType, content } = datauriToJson(datauri);
  const bytes = base64ToBytes(content);
  return Promise.resolve(
    new File([bytes], filename, { type: mimeType, ...options }),
  );
};

/**
 * @param {Blob} file
 * @returns {Promise<string>}
 */
export const fileToDatauri = async (file) => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  return jsonToDatauri({ mimeType, content: bytesToBase64(bytes) });
};

/**
 * @param {File} file
 * @returns {Promise<FileJson>}
 */
export const fileToJson = async (file) => {
  const keys = [
    ...Object.getOwnPropertyNames(Object.getPrototypeOf(file)),
    ...Object.getOwnPropertyNames(file),
  ];

  const result = {};

  for (const key of keys) {
    const val = file[key];
    if (typeof val != "number" && typeof val != "string") continue;
    result[key] = val;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  result.mimeType = file.type;
  result.content = bytesToBase64(bytes);
  result.size = bytes.length;
  return result;
};

/**
 * @param {FileJson & FilePropertyBag} json
 * @returns {Promise<File>}
 */
export const jsonToFile = async ({ name, mimeType, content, ...options }) => {
  const datauri = jsonToDatauri({ mimeType, content });
  return await datauriToFile(datauri, name, { type: mimeType, ...options });
};
