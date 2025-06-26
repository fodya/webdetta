export const base64ToText = base64 => {
  const str = atob(base64);
  const bytes = Uint8Array.from(str, m => m.codePointAt(0));
  return new TextDecoder().decode(bytes);
}
export const textToBase64 = text => {
  const bytes = new TextEncoder().encode(text);
  const str = Array.from(bytes, b => String.fromCodePoint(b)).join("");
  return btoa(str);
}

export const datauriToBlob = datauri =>
  fetch(datauri).then(res => res.blob());
export const blobToDatauri = blob => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
});

export const datauriToFile = (datauri, filename='unnamed', options={}) =>
  datauriToBlob(datauri).then(blob =>
    new File([blob], filename, options)
  );
export const fileToDatauri = blobToDatauri;

export const jsonToFormdata = (json, formData=new FormData(), parentKey = '') => {
  const isObject = json && typeof json === 'object' && !(json instanceof File);
  const isArray = Array.isArray(json);
  if (isObject) for (const key of Object.keys(json)) {
    const fullKey = parentKey ? `${parentKey}[${key}]` : key;
    jsonToFormdata(json[key], formData, isArray ? parentKey : fullKey);
  }
  else formData.append(parentKey, json);
  return formData;
}
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