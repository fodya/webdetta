import { describe, it } from 'jsr:@std/testing/bdd';
import { assert, assertEquals, assertExists } from 'jsr:@std/assert';
import {
  textToBase64, base64ToText,
  datauriToJson, jsonToDatauri,
  formdataToJson, jsonToFormdata,
  chunksToFile, fileToChunks,
  datauriToFile, fileToDatauri,
  fileToJson, jsonToFile,
  fileToBytes, bytesToFile,
} from '../index.js';

const bytesToBase64 = (bytes) => {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
};

const FILE_KEYS = ['mimeType', 'size', 'content', 'name', 'lastModified'];

async function assertFile(f1, f2, keys) {
  const val = async (f, key) => {
    if (key === 'content') {
      if (f && typeof f.arrayBuffer === 'function') {
        return bytesToBase64(new Uint8Array(await f.arrayBuffer()));
      }
      return f.content;
    }
    if (key === 'mimeType') return f.mimeType ?? f.type ?? '';
    return f[key];
  };
  for (const key of keys) assertEquals(await val(f1, key), await val(f2, key));
}

const collectChunks = async (file, chunkSize) => {
  const out = [];
  for await (const c of fileToChunks(file, chunkSize)) out.push(c);
  return out;
};

const sampleFile = () => new File([new Uint8Array([1, 2, 3, 4])], 'data.bin', {
  type: 'application/octet-stream',
  lastModified: 12345,
});

describe('textToBase64', () => {
  it('round-trips ASCII through base64 and back', () => {
    const value = 'hello';
    assertEquals(
      textToBase64(base64ToText(textToBase64(value))),
      textToBase64(value),
    );
    assertEquals(base64ToText(textToBase64(value)), value);
  });
});

describe('base64ToText', () => {
  it('decodes ASCII back to the original string', () => {
    const text = 'hello';
    assertEquals(base64ToText(textToBase64(text)), text);
  });

  it('decodes unicode content back to the original string', () => {
    const text = 'привет 你好';
    assertEquals(base64ToText(textToBase64(text)), text);
  });
});

describe('jsonToDatauri', () => {
  it('round-trips json through a data uri and back', () => {
    const payload = { mimeType: 'text/plain', content: 'dGVzdA==' };
    assertEquals(
      jsonToDatauri(datauriToJson(jsonToDatauri(payload))),
      jsonToDatauri(payload),
    );
  });

  it('emits the canonical data uri prefix', () => {
    assertEquals(
      jsonToDatauri({ mimeType: 'image/png', content: 'xxx' }),
      'data:image/png;base64,xxx',
    );
  });
});

describe('datauriToJson', () => {
  it('round-trips a data uri through json and back', () => {
    const uri = 'data:text/plain;base64,YWI=';
    assertEquals(
      datauriToJson(jsonToDatauri(datauriToJson(uri))),
      datauriToJson(uri),
    );
  });

  it('extracts mimeType and content from a simple data uri', () => {
    const datauri = 'data:application/json;base64,eyJhIjoxfQ==';
    assertEquals(datauriToJson(datauri), {
      mimeType: 'application/json',
      content: 'eyJhIjoxfQ==',
    });
  });

  it('drops extra mime-type parameters like charset', () => {
    const datauri = 'data:text/plain;charset=utf-8;base64,YWI=';
    assertEquals(datauriToJson(datauri), {
      mimeType: 'text/plain',
      content: 'YWI=',
    });
  });
});

describe('jsonToFormdata', () => {
  it('round-trips flat json through FormData and back', () => {
    const json = { x: '10', y: '20' };
    assertEquals(
      formdataToJson(jsonToFormdata(formdataToJson(jsonToFormdata(json)))),
      json,
    );
  });

  it('encodes nested object keys using bracket notation', () => {
    const fd = jsonToFormdata({ pre: '1', outer: { inner: 'v' } });
    const j = formdataToJson(fd);
    assertEquals(j.pre, '1');
    assertEquals(j['outer[inner]'], 'v');
  });

  it('flattens a top-level array into FormData entries', () => {
    const fd = jsonToFormdata([{ a: '1' }, { b: '2' }]);
    const j = formdataToJson(fd);
    assertEquals(j.a, '1');
    assertEquals(j.b, '2');
  });

  it('keeps File instances intact when nested under a key', () => {
    const file = new File(['x'], 'inner.bin');
    const fd = jsonToFormdata({ attachment: file });
    assertEquals(formdataToJson(fd).attachment, file);
  });
});

describe('formdataToJson', () => {
  it('round-trips FormData through json and back', () => {
    const fd = new FormData();
    fd.set('a', '1');
    fd.set('b', '2');
    const j = formdataToJson(fd);
    assertEquals(
      formdataToJson(jsonToFormdata(formdataToJson(jsonToFormdata(j)))),
      j,
    );
  });

  it('converts single-valued entries into scalar fields', () => {
    const fd = new FormData();
    fd.set('a', '1');
    fd.set('b', '2');
    assertEquals(formdataToJson(fd), { a: '1', b: '2' });
  });

  it('groups duplicate keys into an array', () => {
    const fd = new FormData();
    fd.append('k', 'x');
    fd.append('k', 'y');
    assertEquals(formdataToJson(fd), { k: ['x', 'y'] });
  });
});

describe('fileToBytes', () => {
  it('returns the raw byte contents of a File', async () => {
    const file = new File([new Uint8Array([9, 8, 7])], 'b.bin', {
      type: 'application/octet-stream',
      lastModified: 10,
    });
    const bytes = await fileToBytes(file);
    assertEquals([...bytes], [9, 8, 7]);
    const back = bytesToFile(bytes, file.name, {
      type: file.type,
      lastModified: file.lastModified,
    });
    await assertFile(file, back, FILE_KEYS);
  });

  it('returns an empty byte array for an empty File', async () => {
    const file = new File([], 'e.dat');
    const bytes = await fileToBytes(file);
    assertEquals(bytes.length, 0);
    const back = bytesToFile(bytes, file.name, { type: file.type });
    assertEquals(back.size, 0);
  });
});

describe('bytesToFile', () => {
  it('accepts an ArrayBuffer as input', async () => {
    const buf = new Uint8Array([1, 2, 3]).buffer;
    const f = bytesToFile(buf, 'a.bin', { type: 'application/octet-stream' });
    assertEquals([...(await fileToBytes(f))], [1, 2, 3]);
  });
});

describe('fileToChunks', () => {
  it('round-trips a File through chunks back to an equivalent File', async () => {
    const bytes = new Uint8Array([9, 8, 7]);
    const source = new File([bytes], 'c.bin', {
      type: 'application/octet-stream',
      lastModified: +new Date(),
    });
    const rebuilt = await chunksToFile(fileToChunks(source, 2), source.name, {
      type: source.type,
      lastModified: source.lastModified,
    });
    await assertFile(source, rebuilt, FILE_KEYS);
  });

  it('splits data into chunks of the requested size', async () => {
    const data = new Uint8Array(500).fill(7);
    const file = new File([data], 'big.bin');
    const chunks = await collectChunks(file, 200);
    assertEquals(chunks.length, 3);
    assertEquals(chunks[0].length, 200);
    assertEquals(chunks[1].length, 200);
    assertEquals(chunks[2].length, 100);
  });

  it('returns a single chunk when the default size exceeds the file', async () => {
    const file = new File([new Uint8Array(100)], 'h.bin');
    const chunks = await collectChunks(file);
    assertEquals(chunks.length, 1);
    assertEquals(chunks[0].length, 100);
  });

  it('yields no chunks for an empty File', async () => {
    const chunks = await collectChunks(new File([], 'z.bin'));
    assertEquals(chunks.length, 0);
  });

  it('emits one byte per chunk when chunk size is 1', async () => {
    const file = new File(['ab'], 't.txt', { type: 'text/plain' });
    const chunks = await collectChunks(file, 1);
    assertEquals(chunks.map((c) => c.length), [1, 1]);
  });
});

describe('chunksToFile', () => {
  it('round-trips a File through two chunk cycles unchanged', async () => {
    const source = sampleFile();
    const once = await chunksToFile(fileToChunks(source, 2), source.name, {
      type: source.type,
      lastModified: source.lastModified,
    });
    const twice = await chunksToFile(fileToChunks(once, 2), source.name, {
      type: source.type,
      lastModified: source.lastModified,
    });
    await assertFile(source, twice, FILE_KEYS);
  });

  it('rebuilds a File from the iterable returned by fileToChunks', async () => {
    const source = sampleFile();
    const rebuilt = await chunksToFile(fileToChunks(source, 2), source.name, {
      type: source.type,
      lastModified: source.lastModified,
    });

    assert(rebuilt instanceof File);
    await assertFile(source, rebuilt, FILE_KEYS);
  });

  it('rebuilds a File from an async generator of chunks', async () => {
    const chunks = async function* () {
      yield new Uint8Array([9, 8]);
      await Promise.resolve();
      yield new Uint8Array([7, 6]);
    };
    const rebuilt = await chunksToFile(chunks(), 'async.bin', {
      type: 'application/octet-stream',
    });
    const expected = new File([new Uint8Array([9, 8, 7, 6])], 'async.bin', {
      type: 'application/octet-stream',
      lastModified: rebuilt.lastModified,
    });
    await assertFile(expected, rebuilt, FILE_KEYS);
  });

  it('applies the provided name, type and lastModified options', async () => {
    const body = new Uint8Array([1, 2, 3]);
    const name = 'custom.dat';
    const type = 'application/vnd.test';
    const lastModified = 1_704_000_000_000;
    const expected = new File([body], name, { type, lastModified });
    const file = await chunksToFile(
      fileToChunks(new File([body], 'tmp.bin'), 2),
      name,
      { type, lastModified },
    );
    await assertFile(expected, file, FILE_KEYS);
  });
});

describe('datauriToFile', () => {
  it('round-trips a File through a data uri and back', async () => {
    const expected = new File(['z'], 'n.txt', {
      type: 'text/plain',
      lastModified: 50_000,
    });
    const uri = await fileToDatauri(expected);
    const f1 = await datauriToFile(uri, expected.name, {
      type: expected.type,
      lastModified: expected.lastModified,
    });
    await assertFile(expected, f1, FILE_KEYS);
    const uri2 = await fileToDatauri(f1);
    const f2 = await datauriToFile(uri2, f1.name, {
      type: f1.type,
      lastModified: f1.lastModified,
    });
    await assertFile(expected, f2, FILE_KEYS);
  });

  it('honors overrides for type and lastModified', async () => {
    for (const expected of [
      new File(['hi'], 'hello.txt', {
        type: 'text/plain',
        lastModified: 60_000,
      }),
      new File(['body'], 'report.txt', {
        type: 'text/plain',
        lastModified: 1_600_000_000_000,
      }),
    ]) {
      const uri = await fileToDatauri(expected);
      const file = await datauriToFile(uri, expected.name, {
        type: expected.type,
        lastModified: expected.lastModified,
      });
      await assertFile(expected, file, FILE_KEYS);
    }
  });

  it('falls back to the default filename when none is provided', async () => {
    const body = ['z'];
    const uri = await fileToDatauri(new File(body, 'x.txt'));
    const file = await datauriToFile(uri);
    const expected = new File(body, 'unnamed', {
      type: file.type,
      lastModified: file.lastModified,
    });
    await assertFile(expected, file, FILE_KEYS);
  });
});

describe('fileToDatauri', () => {
  it('round-trips a File through a data uri and back', async () => {
    const file = new File(['abc'], 'n.txt', {
      type: 'text/plain',
      lastModified: 987_654_321_000,
    });
    const uri = await fileToDatauri(file);
    const back = await datauriToFile(uri, file.name, {
      type: file.type,
      lastModified: file.lastModified,
    });
    await assertFile(file, back, FILE_KEYS);
    const uri2 = await fileToDatauri(back);
    const back2 = await datauriToFile(uri2, back.name, {
      type: back.type,
      lastModified: back.lastModified,
    });
    await assertFile(file, back2, FILE_KEYS);
  });
});

describe('fileToJson', () => {
  it('round-trips a File through a json payload and back', async () => {
    const original = new File(['payload'], 'doc.bin', {
      type: 'application/octet-stream',
    });
    const json = await fileToJson(original);
    const restored = await jsonToFile(json);
    const jsonAgain = await fileToJson(restored);
    await assertFile(json, jsonAgain, FILE_KEYS);
    await assertFile(original, restored, FILE_KEYS);
  });

  it('emits string mimeType/content fields and a numeric lastModified', async () => {
    const file = new File(['x'], 'f.txt', { type: 'text/plain' });
    const json = await fileToJson(file);
    assertExists(json.mimeType);
    assertExists(json.content);
    assertEquals(typeof json.name, 'string');
    assertEquals(typeof json.lastModified, 'number');
  });

  it('preserves all metadata fields across the conversion', async () => {
    const original = new File(['meta'], 'capture.bin', {
      type: 'application/octet-stream',
      lastModified: 111_222_333_000,
    });
    const json = await fileToJson(original);
    await assertFile(original, json, FILE_KEYS);
    const restored = await jsonToFile(json);
    await assertFile(original, restored, FILE_KEYS);
  });
});

describe('jsonToFile', () => {
  it('round-trips a json payload through a File and back', async () => {
    const payload = {
      name: 'x.txt',
      mimeType: 'text/plain',
      content: textToBase64('yo'),
      lastModified: 12345,
    };
    const f1 = await jsonToFile(payload);
    const j = await fileToJson(f1);
    const f2 = await jsonToFile(j);
    await assertFile(f1, f2, FILE_KEYS);
  });

  it('applies explicit name, mime type and lastModified overrides', async () => {
    const expected = new File(['pdf-bytes'], 'doc.pdf', {
      type: 'application/pdf',
      lastModified: 98_765_432_100,
    });
    const f = await jsonToFile({
      name: expected.name,
      mimeType: expected.type,
      content: textToBase64(await expected.text()),
      type: expected.type,
      lastModified: expected.lastModified,
    });
    await assertFile(expected, f, FILE_KEYS);
  });
});
