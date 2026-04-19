### `webdetta/common/object`

Object manipulation and utility functions. Provides type checking, property access, deep iteration, mapping, and picking operations for objects and arrays.

<details>
<summary><strong>isObject(value)</strong></summary>

Checks if a value is an object (not null and not a primitive).

**Parameters:**
- `value` (any): The value to check

**Returns:**
- `boolean`: `true` if value is an object, `false` otherwise

**Examples:**
```javascript
import { isObject } from 'webdetta/common/object';

isObject({}); // true
isObject([]); // true
isObject(new Date()); // true
isObject(null); // false
isObject(undefined); // false
isObject('string'); // false
isObject(42); // false
isObject(true); // false
isObject(() => {}); // true
```

</details>

<details>
<summary><strong>isPlainObject(value)</strong></summary>

Checks if a value is a plain object (object literal, not a class instance or built-in object).

**Parameters:**
- `value` (any): The value to check

**Returns:**
- `boolean`: `true` if value is a plain object, `false` otherwise

**Examples:**
```javascript
import { isPlainObject } from 'webdetta/common/object';

isPlainObject({}); // true
isPlainObject({ a: 1, b: 2 }); // true
isPlainObject(new Date()); // false
isPlainObject([]); // false
isPlainObject(null); // false
isPlainObject(new Object()); // true
isPlainObject(Object.create(null)); // false
```

</details>

<details>
<summary><strong>objectHasOwn(obj, key)</strong></summary>

Safely checks if an object has its own property (not inherited from prototype).

**Parameters:**
- `obj` (object): The object to check
- `key` (string | symbol): The property key to check

**Returns:**
- `boolean`: `true` if object has own property, `false` otherwise

**Examples:**
```javascript
import { objectHasOwn } from 'webdetta/common/object';

const obj = { a: 1 };
objectHasOwn(obj, 'a'); // true
objectHasOwn(obj, 'toString'); // false
objectHasOwn(obj, 'b'); // false

const obj2 = Object.create(null);
obj2.x = 1;
objectHasOwn(obj2, 'x'); // true
```

</details>

<details>
<summary><strong>objectEntriesDeep(obj)</strong></summary>

Generator function that iterates over all nested object properties, yielding `[keys, value]` pairs.

**Parameters:**
- `obj` (object): The object to iterate over

**Returns:**
- `Generator<[string[], any]>`: Generator yielding `[keys, value]` pairs

**Examples:**
```javascript
import { objectEntriesDeep } from 'webdetta/common/object';

const obj = {
  a: 1,
  b: {
    c: 2,
    d: {
      e: 3
    }
  }
};

for (const [keys, value] of objectEntriesDeep(obj)) {
  console.log(keys, value);
}
// Console output:
// ['a'] 1
// ['b', 'c'] 2
// ['b', 'd', 'e'] 3

const entries = Array.from(objectEntriesDeep(obj));
// entries: [ [['a'], 1], [['b', 'c'], 2], [['b', 'd', 'e'], 3] ]
```

</details>

<details>
<summary><strong>objectMap(obj, func)</strong></summary>

Maps over object properties, applying a function to each value.

**Parameters:**
- `obj` (object | array): The object or array to map over
- `func` (Function): Mapping function receiving `(value, key, obj)`

**Returns:**
- `object | array`: New object/array with mapped values

**Examples:**
```javascript
import { objectMap } from 'webdetta/common/object';

objectMap({ a: 1, b: 2, c: 3 }, (val) => val * 2);
// Returns: { a: 2, b: 4, c: 6 }

objectMap({ a: 1, b: 2 }, (val, key) => `${key}:${val}`);
// Returns: { a: 'a:1', b: 'b:2' }

objectMap([1, 2, 3], (val) => val * 2);
// Returns: [2, 4, 6]
```

</details>

<details>
<summary><strong>objectMapper(func)</strong></summary>

Creates a reusable mapper function that applies a transformation function to objects.

**Parameters:**
- `func` (Function): The mapping function

**Returns:**
- `Function`: Mapper function that takes an object and returns mapped object

**Examples:**
```javascript
import { objectMapper } from 'webdetta/common/object';

const double = objectMapper((val) => val * 2);
double({ a: 1, b: 2 });
// Returns: { a: 2, b: 4 }

const toString = objectMapper((val) => String(val));
toString({ a: 1, b: true });
// Returns: { a: '1', b: 'true' }
```

</details>

<details>
<summary><strong>objectMapDeep(obj, func)</strong></summary>

Recursively maps over nested objects, applying a function to all values.

**Parameters:**
- `obj` (object | array): The object to map over
- `func` (Function): Mapping function receiving `(value, keys, root)`

**Returns:**
- `object | array`: New object/array with all values mapped

**Examples:**
```javascript
import { objectMapDeep } from 'webdetta/common/object';

objectMapDeep({ a: 1, b: { c: 2 } }, (val) => val * 2);
// Returns: { a: 2, b: { c: 4 } }

objectMapDeep(
  { a: 1, b: { c: 2 } },
  (val, keys) => `${keys.join('.')}:${val}`
);
// Returns: { a: 'a:1', b: { c: 'b.c:2' } }
```

</details>

<details>
<summary><strong>objectMapperDeep(func)</strong></summary>

Creates a reusable deep mapper function that applies a transformation to nested objects.

**Parameters:**
- `func` (Function): The deep mapping function

**Returns:**
- `Function`: Deep mapper function

**Examples:**
```javascript
import { objectMapperDeep } from 'webdetta/common/object';

const doubleDeep = objectMapperDeep((val) => val * 2);
doubleDeep({ a: 1, b: { c: 2 } });
// Returns: { a: 2, b: { c: 4 } }

const stringifyDeep = objectMapperDeep((val) => String(val));
stringifyDeep({ a: 1, b: { c: true } });
// Returns: { a: '1', b: { c: 'true' } }
```

</details>

<details>
<summary><strong>objectPick(obj, keys)</strong></summary>

Creates a new object containing only the specified keys from the source object.

**Parameters:**
- `obj` (object): The source object
- `keys` (array): Array of keys to pick from the object

**Returns:**
- `object`: New object with only the picked keys

**Examples:**
```javascript
import { objectPick } from 'webdetta/common/object';

const obj = { a: 1, b: 2, c: 3, d: 4 };

objectPick(obj, ['a', 'c']);
// Returns: { a: 1, c: 3 }

objectPick(obj, ['b']);
// Returns: { b: 2 }

objectPick(obj, ['a', 'x']);
// Returns: { a: 1, x: undefined }
```

</details>

<details>
<summary><strong>objectPicker(keys)</strong></summary>

Creates a reusable picker function that extracts specific keys from objects.

**Parameters:**
- `keys` (array): Array of keys to pick

**Returns:**
- `Function`: Picker function that takes an object and returns picked object

**Examples:**
```javascript
import { objectPicker } from 'webdetta/common/object';

const pickAC = objectPicker(['a', 'c']);
pickAC({ a: 1, b: 2, c: 3 });
// Returns: { a: 1, c: 3 }

const pickNameEmail = objectPicker(['name', 'email']);
const users = [
  { name: 'John', email: 'john@example.com', age: 30 },
  { name: 'Jane', email: 'jane@example.com', age: 25 }
];
users.map(pickNameEmail);
// Returns: [
//   { name: 'John', email: 'john@example.com' },
//   { name: 'Jane', email: 'jane@example.com' }
// ]
```

</details>
