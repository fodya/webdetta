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
  it('roundtrip', () => {
    const value = 'hello';
    assertEquals(
      textToBase64(base64ToText(textToBase64(value))),
      textToBase64(value),
    );
    assertEquals(base64ToText(textToBase64(value)), value);
  });
});

describe('base64ToText', () => {
  it('roundtrip', () => {
    const text = 'hello';
    assertEquals(base64ToText(textToBase64(text)), text);
  });

  it('unicode', () => {
    const text = 'привет 你好';
    assertEquals(base64ToText(textToBase64(text)), text);
  });
});

describe('jsonToDatauri', () => {
  it('roundtrip', () => {
    const payload = { mimeType: 'text/plain', content: 'dGVzdA==' };
    assertEquals(
      jsonToDatauri(datauriToJson(jsonToDatauri(payload))),
      jsonToDatauri(payload),
    );
  });

  it('data uri prefix', () => {
    assertEquals(
      jsonToDatauri({ mimeType: 'image/png', content: 'xxx' }),
      'data:image/png;base64,xxx',
    );
  });
});

describe('datauriToJson', () => {
  it('roundtrip', () => {
    const uri = 'data:text/plain;base64,YWI=';
    assertEquals(
      datauriToJson(jsonToDatauri(datauriToJson(uri))),
      datauriToJson(uri),
    );
  });

  it('simple mime type', () => {
    const datauri = 'data:application/json;base64,eyJhIjoxfQ==';
    assertEquals(datauriToJson(datauri), {
      mimeType: 'application/json',
      content: 'eyJhIjoxfQ==',
    });
  });

  it('mime type with extra parameters', () => {
    const datauri = 'data:text/plain;charset=utf-8;base64,YWI=';
    assertEquals(datauriToJson(datauri), {
      mimeType: 'text/plain',
      content: 'YWI=',
    });
  });
});

describe('jsonToFormdata', () => {
  it('roundtrip', () => {
    const json = { x: '10', y: '20' };
    assertEquals(
      formdataToJson(jsonToFormdata(formdataToJson(jsonToFormdata(json)))),
      json,
    );
  });

  it('nested object with sibling flat keys', () => {
    const fd = jsonToFormdata({ pre: '1', outer: { inner: 'v' } });
    const j = formdataToJson(fd);
    assertEquals(j.pre, '1');
    assertEquals(j['outer[inner]'], 'v');
  });

  it('top-level array', () => {
    const fd = jsonToFormdata([{ a: '1' }, { b: '2' }]);
    const j = formdataToJson(fd);
    assertEquals(j.a, '1');
    assertEquals(j.b, '2');
  });

  it('file under object key', () => {
    const file = new File(['x'], 'inner.bin');
    const fd = jsonToFormdata({ attachment: file });
    assertEquals(formdataToJson(fd).attachment, file);
  });
});

describe('formdataToJson', () => {
  it('roundtrip', () => {
    const fd = new FormData();
    fd.set('a', '1');
    fd.set('b', '2');
    const j = formdataToJson(fd);
    assertEquals(
      formdataToJson(jsonToFormdata(formdataToJson(jsonToFormdata(j)))),
      j,
    );
  });

  it('single values', () => {
    const fd = new FormData();
    fd.set('a', '1');
    fd.set('b', '2');
    assertEquals(formdataToJson(fd), { a: '1', b: '2' });
  });

  it('duplicate keys become array', () => {
    const fd = new FormData();
    fd.append('k', 'x');
    fd.append('k', 'y');
    assertEquals(formdataToJson(fd), { k: ['x', 'y'] });
  });
});

describe('fileToBytes', () => {
  it('roundtrip', async () => {
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

  it('empty file', async () => {
    const file = new File([], 'e.dat');
    const bytes = await fileToBytes(file);
    assertEquals(bytes.length, 0);
    const back = bytesToFile(bytes, file.name, { type: file.type });
    assertEquals(back.size, 0);
  });
});

describe('bytesToFile', () => {
  it('accepts ArrayBuffer', async () => {
    const buf = new Uint8Array([1, 2, 3]).buffer;
    const f = bytesToFile(buf, 'a.bin', { type: 'application/octet-stream' });
    assertEquals([...(await fileToBytes(f))], [1, 2, 3]);
  });
});

describe('fileToChunks', () => {
  it('roundtrip', async () => {
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

  it('custom chunk size', async () => {
    const data = new Uint8Array(500).fill(7);
    const file = new File([data], 'big.bin');
    const chunks = await collectChunks(file, 200);
    assertEquals(chunks.length, 3);
    assertEquals(chunks[0].length, 200);
    assertEquals(chunks[1].length, 200);
    assertEquals(chunks[2].length, 100);
  });

  it('default chunk size', async () => {
    const file = new File([new Uint8Array(100)], 'h.bin');
    const chunks = await collectChunks(file);
    assertEquals(chunks.length, 1);
    assertEquals(chunks[0].length, 100);
  });

  it('empty file', async () => {
    const chunks = await collectChunks(new File([], 'z.bin'));
    assertEquals(chunks.length, 0);
  });

  it('single-byte chunks', async () => {
    const file = new File(['ab'], 't.txt', { type: 'text/plain' });
    const chunks = await collectChunks(file, 1);
    assertEquals(chunks.map((c) => c.length), [1, 1]);
  });
});

describe('chunksToFile', () => {
  it('roundtrip', async () => {
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

  it('rebuilds file from fileToChunks iterable', async () => {
    const source = sampleFile();
    const rebuilt = await chunksToFile(fileToChunks(source, 2), source.name, {
      type: source.type,
      lastModified: source.lastModified,
    });

    assert(rebuilt instanceof File);
    await assertFile(source, rebuilt, FILE_KEYS);
  });

  it('rebuilds file from async generator', async () => {
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

  it('options', async () => {
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
  it('roundtrip', async () => {
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

  it('options', async () => {
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

  it('default filename', async () => {
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
  it('roundtrip', async () => {
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
  it('roundtrip', async () => {
    const original = new File(['payload'], 'doc.bin', {
      type: 'application/octet-stream',
    });
    const json = await fileToJson(original);
    const restored = await jsonToFile(json);
    const jsonAgain = await fileToJson(restored);
    await assertFile(json, jsonAgain, FILE_KEYS);
    await assertFile(original, restored, FILE_KEYS);
  });

  it('string and number fields', async () => {
    const file = new File(['x'], 'f.txt', { type: 'text/plain' });
    const json = await fileToJson(file);
    assertExists(json.mimeType);
    assertExists(json.content);
    assertEquals(typeof json.name, 'string');
    assertEquals(typeof json.lastModified, 'number');
  });

  it('options', async () => {
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
  it('roundtrip', async () => {
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

  it('options', async () => {
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
