/////////////
// S Y N C //
/////////////

// // text <-> base 64
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

// data URI <-> json
export const datauriToJson = (datauri) => {
  const [part1, content] = datauri.split(',');
  const mimeType = part1.split(';')[0].split(':')[1];
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
export const jsonToFormdata = (json, formData = new FormData(), parentKey = '') => {
  const isObject = json && typeof json === 'object' && !(json instanceof File);
  const isArray = Array.isArray(json);
  if (isObject) for (const key of Object.keys(json)) {
    const fullKey = parentKey ? `${parentKey}[${key}]` : key;
    jsonToFormdata(json[key], formData, isArray ? parentKey : fullKey);
  }
  else formData.append(parentKey, json);
  return formData;
}

// file -> chunks (generator)
export const blobToChunks = function* (file, chunkSize=256*1024) {
  let offset = 0;
  while (offset < file.size) {
    yield file.slice(offset, offset + chunkSize);
    offset += chunkSize;
  }
}

export const fileToChunks = blobToChunks;

///////////////
// A S Y N C //
///////////////

// data URI <-> blob
export const datauriToBlob = async (datauri) => {
  return await fetch(datauri).then(res => res.blob());
}
export const blobToDatauri = async blob => {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}

// data URI <-> file
export const datauriToFile = async (datauri, filename='unnamed', options={}) => {
  return await datauriToBlob(datauri).then(blob =>
    new File([blob], filename, options)
  );
}
export const fileToDatauri = blobToDatauri;

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

  const datauri = await fileToDatauri(file);
  const { mimeType, content } = datauriToJson(datauri);
  result.mimeType = mimeType;
  result.content = content;
  return result;
}
export const jsonToFile = async ({ name, mimeType, content, ...options }) => {
  const datauri = jsonToDatauri({ mimeType, content });
  return await datauriToFile(datauri, name, options);
}