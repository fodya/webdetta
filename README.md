## Webdetta — web application building blocks

The library contains a list of useful functions that accelerated and simplified my work.
<br>

The purpose of this project:
- never write the same repetitive code again, when starting a new project
- provide a curated list of tools that work well together
- eleminate dependency hell — simply use webdetta for most common needs

## Modules list

### Core modules

\> `webdetta/builder`\
Implements expressive, chainable DSL syntax using the [builder pattern](https://en.wikipedia.org/wiki/Builder_pattern).

\> `webdetta/context` \
A flexible way of handling scoped variables. Supports sync, async and reactive contexts.

\> `webdetta/convert`\
Data conversion utilities: text, base64, data URI, blob/file, formdata, json, and more.

\> `webdetta/i18n`\
Internationalization utility for translating UI texts.

\> `webdetta/reactivity`\
Reactive variables and effects library. Inspired by SolidJS.

\> `webdetta/realcss`\
Library for generating CSS at runtime.

\> `webdetta/realdom`\
Lightweight and efficient DOM manipulation library.

\> `webdetta/router`\
Client-side history/hash routing library.

\> `webdetta/rpc`\
Remote Procedure Call library for realtime APIs.

\> `webdetta/subprocess`\
child_process syntax sugar — spawns OS processes as promises and makes the code cleaner.

\> `webdetta/templater`\
Extensible template engine.

\> `webdetta/webcomp`\
Functions for creating [Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components).\
Useful for integrating existing web apps with third-party teams that don't use webdetta.

---

### Common modules

\> `webdetta/common/dom`\
DOM-specific functions.

\> `webdetta/common/environment`\
JavaScript runtime environment detection: browser, node, webworker, jsdom, deno, bun.\
Also provides browser-specific detection (e.g., `mobile`).

\> `webdetta/common/errors`\
Functions for handling global uncaught exceptions.

\> `webdetta/common/utils`\
General-purpose utilities for throttling, memoization, error handling, data formatting and more.

---

### Configuration modules

\> `webdetta/config/enable-http-modules`\
Enables NodeJS http(s) imports.

\> `webdetta/config/enable-websockets-node`\
Enables NodeJS websocket client support.

\> `webdetta/config/handle-uncaught-errors`\
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
