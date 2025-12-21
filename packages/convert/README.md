# Convert

Data conversion utilities for text, base64, data URI, blob/file, formdata, and JSON.

## Usage

```javascript
import {
  textToBase64, base64ToText,
  datauriToJson, jsonToDatauri,
  formdataToJson, jsonToFormdata,
  blobToDatauri, datauriToBlob,
  fileToDatauri, datauriToFile,
  fileToJson, jsonToFile,
  blobToChunks, fileToChunks
} from 'webdetta/convert';
```

## API

### Synchronous Conversions

- `textToBase64(text)` - Converts text to base64
- `base64ToText(base64)` - Converts base64 to text
- `datauriToJson(datauri)` - Converts data URI to JSON object
- `jsonToDatauri({ mimeType, content })` - Converts JSON to data URI
- `formdataToJson(formData)` - Converts FormData to JSON object
- `jsonToFormdata(json, formData, parentKey)` - Converts JSON to FormData
- `blobToChunks(file, chunkSize)` - Generator that yields file chunks
- `fileToChunks(file, chunkSize)` - Alias for `blobToChunks`

### Asynchronous Conversions

- `datauriToBlob(datauri)` - Converts data URI to Blob
- `blobToDatauri(blob)` - Converts Blob to data URI
- `datauriToFile(datauri, filename, options)` - Converts data URI to File
- `fileToDatauri(file)` - Converts File to data URI
- `fileToJson(file)` - Converts File to JSON object
- `jsonToFile({ name, mimeType, content, ...options })` - Converts JSON to File

