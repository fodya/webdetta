// @ts-self-types="./types/index.d.ts"
// text <-> base64
export const textToBase64 = text => {
  const bytes = new TextEncoder().encode(text);
  const str = Array.from(bytes, b => String.fromCodePoint(b)).join("");
  return btoa(str);
}
export const base64ToText = base64 => {
  const str = atob(base64);
  const bytes = Uint8Array.from(str, m => m.codePointAt(0));
  return new TextDecoder().decode(bytes);
}

// datauri <-> json
export const datauriToJson = (datauri) => {
  const comma = datauri.indexOf(',');
  const mimeType = datauri.slice(5, datauri.indexOf(';'));
  const content = datauri.slice(comma + 1);
  return { mimeType, content };
}
export const jsonToDatauri = ({ mimeType, content }) =>
  `data:${mimeType};base64,${content}`;

// formdata <-> json
export const formdataToJson = (formData) => {
  return Object.fromEntries(
    Array.from(formData.keys()).map(key => [
      key,
      formData.getAll(key).length > 1
        ? formData.getAll(key)
        : formData.get(key)
    ])
  );
}
const jsonToFormdata_ = (json, formData, parentKey) => {
  const isObject = json && typeof json === 'object' && !(json instanceof File);
  const isArray = Array.isArray(json);
  if (isObject) for (const key of Object.keys(json)) {
    const fullKey = parentKey ? `${parentKey}[${key}]` : key;
    jsonToFormdata_(json[key], formData, isArray ? parentKey : fullKey);
  }
  else formData.append(parentKey, json);
  return formData;
}
export const jsonToFormdata = (json) => jsonToFormdata_(json, new FormData(), '');

// file <-> bytes
export const fileToBytes = async (file) => {
  return new Uint8Array(await file.arrayBuffer());
}

export const bytesToFile = (bytes, name = 'unnamed', options = {}) => {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return new File([u8], name, options);
};

// file <-> chunks
export async function* fileToChunks(file, chunkSize = 256 * 1024) {
  let offset = 0;
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    yield new Uint8Array(await chunk.arrayBuffer());
    offset += chunkSize;
  }
}

export const chunksToFile = async (chunks, name = 'unnamed', options = {}) => {
  const bytes = [];
  for await (const chunk of chunks) bytes.push(...chunk);
  return new File([new Uint8Array(bytes)], name, options);
}

// datauri <-> file
export const datauriToFile = async (datauri, filename = 'unnamed', options = {}) => {
  const { mimeType, content } = datauriToJson(datauri);
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mimeType, ...options });
}

export const fileToDatauri = async (file) => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const mimeType = file.type || 'application/octet-stream';
  return jsonToDatauri({ mimeType, content: btoa(binary) });
}

// file <-> json
export const fileToJson = async (file) => {
  const keys = [
    ...Object.getOwnPropertyNames(Object.getPrototypeOf(file)),
    ...Object.getOwnPropertyNames(file)
  ];

  const result = {};

  for (const key of keys) {
    const val = file[key];
    if (typeof val != 'number' && typeof val != 'string') continue;
    result[key] = val;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }

  result.mimeType = file.type;
  result.content = btoa(binary);
  result.size = bytes.length;
  return result;
};
export const jsonToFile = async ({ name, mimeType, content, ...options }) => {
  const datauri = jsonToDatauri({ mimeType, content });
  return await datauriToFile(datauri, name, { type: mimeType, ...options });
}
