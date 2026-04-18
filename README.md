## Webdetta — web application building blocks

## Modules list

### Core modules

<table>
  <colgroup>
    <col style="width: 33.333%;" />
    <col style="width: 66.667%;" />
  </colgroup>
  <tr>
    <td><a href="./packages/builder/docs/README.md"><code>webdetta/builder</code></a></td>
    <td>Implements expressive, chainable DSL syntax using <a href="https://en.wikipedia.org/wiki/Builder_pattern">builder pattern</a>.</td>
  </tr>
  <tr>
    <td><a href="./packages/context/docs/README.md"><code>webdetta/context</code></a></td>
    <td>A flexible way of handling scoped variables. Supports sync, async and reactive contexts.</td>
  </tr>
  <tr>
    <td><a href="./packages/convert/docs/README.md"><code>webdetta/convert</code></a></td>
    <td>Data conversion utilities: text, base64, datauri, file/bytes, formdata, json.</td>
  </tr>
  <tr>
    <td><a href="./packages/i18n/docs/README.md"><code>webdetta/i18n</code></a></td>
    <td>Internationalization utility for translating UI texts.</td>
  </tr>
  <tr>
    <td><a href="./packages/reactivity/docs/README.md"><code>webdetta/reactivity</code></a></td>
    <td>Reactive variables and effects library. Inspired by SolidJS.</td>
  </tr>
  <tr>
    <td><a href="./packages/realcss/docs/README.md"><code>webdetta/realcss</code></a></td>
    <td>Library for generating CSS at runtime.</td>
  </tr>
  <tr>
    <td><a href="./packages/realdom/docs/README.md"><code>webdetta/realdom</code></a></td>
    <td>Lightweight and efficient DOM manipulation library.</td>
  </tr>
  <tr>
    <td><a href="./packages/router/docs/README.md"><code>webdetta/router</code></a></td>
    <td>Client-side history/hash routing library.</td>
  </tr>
  <tr>
    <td><a href="./packages/rpc/docs/README.md"><code>webdetta/rpc</code></a></td>
    <td>Remote Procedure Call library for realtime APIs.</td>
  </tr>
  <tr>
    <td><a href="./packages/templater/docs/README.md"><code>webdetta/templater</code></a></td>
    <td>Extensible template engine.</td>
  </tr>
</table>

---

### Common modules

<table>
  <colgroup>
    <col style="width: 33.333%;" />
    <col style="width: 66.667%;" />
  </colgroup>
  <tr>
    <td><a href="./packages/common/docs/README.md"><code>webdetta/common/dom</code></a></td>
    <td>DOM-specific functions.</td>
  </tr>
  <tr>
    <td><a href="./packages/common/docs/README.md"><code>webdetta/common/environment</code></a></td>
    <td>JavaScript runtime environment detection: browser, node, webworker, jsdom, deno, bun. Also provides browser-specific detection (e.g., <code>mobile</code>).</td>
  </tr>
  <tr>
    <td><a href="./packages/common/docs/README.md"><code>webdetta/common/utils</code></a></td>
    <td>General-purpose utilities for throttling, memoization, error handling, data formatting and more.</td>
  </tr>
</table>

---

### Configuration modules

<table>
  <colgroup>
    <col style="width: 33.333%;" />
    <col style="width: 66.667%;" />
  </colgroup>
  <tr>
    <td><a href="./packages/config/docs/README.md"><code>webdetta/config/enable-http-modules</code></a></td>
    <td>Enables NodeJS http(s) imports.</td>
  </tr>
  <tr>
    <td><a href="./packages/config/docs/README.md"><code>webdetta/config/enable-websockets-node</code></a></td>
    <td>Enables NodeJS websocket client support.</td>
  </tr>
  <tr>
    <td><a href="./packages/config/docs/README.md"><code>webdetta/config/handle-uncaught-errors</code></a></td>
    <td>Automatically handles global uncaught errors and logs them to console. Prevents a NodeJS process from exiting on an unhandled promise rejection.</td>
  </tr>
</table>

---

<br>

Developed by Fedot Kriutchenko.

> **Backstory:**\
The creation of this library was inspired by the frameorc project — a collaborative effort that began in 2015 during a scientific and practical conference in which I participated. \
\
Over the course of several years, we — Michael Lazarev, Anton Baranov, Daniil Terlyakhin, Elnur Yusifov and Fedot Kriutchenko — worked together, exchanging ideas.\
The goal was to develop a methodology that would allow a single developer to operate at the speed and efficiency of a multi-person team.\
Some of these ideas were eventually published to the [frameorc GitHub](https://github.com/frameorc/frameorc).\
\
In recent years,\
I’ve been polishing and refining these ideas, applying them in practice and preserving the results, in the form of this library.

<br>
