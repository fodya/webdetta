# Convert

Data conversion utilities for different formats.

### text <-> base64
- `textToBase64(text)`
- `base64ToText(base64)`

### datauri <-> json
- `datauriToJson(datauri)`
- `jsonToDatauri({ mimeType, content })`

### formdata <-> json
- `formdataToJson(formData)`
- `jsonToFormdata(json)`

### file <-> bytes
- `fileToBytes(file)`
- `bytesToFile(bytes, name?, options?)`

### file <-> chunks
- `fileToChunks(file, chunkSize?)`
- `chunksToFile(chunks, name?, options?)`

### file <-> datauri
- `fileToDatauri(file)`
- `datauriToFile(datauri, filename?, options?)`

### file <-> json
- `jsonToFile({ name, mimeType, content, ...options })`
- `fileToJson(file)`
