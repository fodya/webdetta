## Webdetta — web application building blocks

## Modules list

### Core modules

\> [`webdetta/builder`](./packages/builder/docs/README.md)\
Implements expressive, chainable DSL syntax using [builder pattern](https://en.wikipedia.org/wiki/Builder_pattern).

\> [`webdetta/context`](./packages/context/docs/README.md) \
A flexible way of handling scoped variables. Supports sync, async and reactive contexts.

\> [`webdetta/convert`](./packages/convert/docs/README.md)\
Data conversion utilities: text, base64, datauri, file/bytes, formdata, json.

\> [`webdetta/i18n`](./packages/i18n/docs/README.md)\
Internationalization utility for translating UI texts.

\> [`webdetta/reactivity`](./packages/reactivity/docs/README.md)\
Reactive variables and effects library. Inspired by SolidJS.

\> [`webdetta/realcss`](./packages/realcss/docs/README.md)\
Library for generating CSS at runtime.

\> [`webdetta/realdom`](./packages/realdom/docs/README.md)\
Lightweight and efficient DOM manipulation library.

\> [`webdetta/router`](./packages/router/docs/README.md)\
Client-side history/hash routing library.

\> [`webdetta/rpc`](./packages/rpc/docs/README.md)\
Remote Procedure Call library for realtime APIs.

\> [`webdetta/templater`](./packages/templater/docs/README.md)\
Extensible template engine.

---

### Common modules

\> [`webdetta/common/dom`](./packages/common/docs/README.md)\
DOM-specific functions.

\> [`webdetta/common/environment`](./packages/common/docs/README.md)\
JavaScript runtime environment detection: browser, node, webworker, jsdom, deno, bun.\
Also provides browser-specific detection (e.g., `mobile`).

\> [`webdetta/common/utils`](./packages/common/docs/README.md)\
General-purpose utilities for throttling, memoization, error handling, data formatting and more.

---

### Configuration modules

\> [`webdetta/config/enable-http-modules`](./packages/config/docs/README.md)\
Enables NodeJS http(s) imports.

\> [`webdetta/config/enable-websockets-node`](./packages/config/docs/README.md)\
Enables NodeJS websocket client support.

\> [`webdetta/config/handle-uncaught-errors`](./packages/config/docs/README.md)\
Automatically handles global uncaught errors and logs them to console.\
Prevents a NodeJS process from exiting on an unhandled promise rejection.

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
