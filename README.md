## Webdetta — web application building blocks
Developed by Fedot Kriutchenko.\
The library contains a list of 100+ useful functions that accelerated and simplified my work on the last 30+ web-development projects.

<br>

> **Backstory:**\
The creation of this library was inspired by the frameorc project — a collaborative effort that began in 2015 during a scientific and practical conference in which I participated. \
\
Over the course of more than eight years, we — Michael Lazarev, Anton Baranov, Daniil Terlyakhin, Elnur Yusifov and Fedot Kriutchenko — worked together, exchanging ideas.\
The goal was to develop a methodology that would allow a single developer to operate at the speed and efficiency of a multi-person team.\
Some of these ideas were eventually published to the [frameorc GitHub](https://github.com/frameorc/frameorc).\
\
In recent years,\
I’ve been polishing and refining these ideas, applying them in practice and preserving the results, in the form of this library.

<br>

The library is in active development and is being improved day by day.\
Every function in each published module has been used in real-world production projects at least a dozen of times.


## Modules list

### Feature modules

\- `webdetta/i18n`\
Internationalization toolkit for translating UI texts.


\- `webdetta/reactivity`\
Reactive variables and effects library. Inspired by SolidJS.

\- `webdetta/realdom`\
Lightweight DOM wrapper designed for building Single Page Applications.\
Works best in combination with the `webdetta/reactivity` library.

\- `webdetta/router`\
History and hash router library for Single Page Applications.

\- `webdetta/rpc`\
Remote Procedure Call library for realtime APIs.\
Uses msgpackr for encoding and WebSockets as a transport layer.

\- `webdetta/sdk` _Deprecated, will be rewritten soon._\
Code generation tool for exposing server-defined functions to the client.

\- `webdetta/server` _Deprecated, will be removed soon._\
ExpressJS wrapper for easier server creation.

\- `webdetta/state` _Unfinished, more functions will be added._\
State persistency for client and server.

\- `webdetta/subprocess`\
child_process syntax sugar — spawns OS processes as async functions.

\- `webdetta/vcss`\
Virtual CSS library for generating UI styles at runtime.

\- `webdetta/vdom` _Deprecated, will be removed soon, use webdetta/realdom instead_\
Snabbdom-based Virtual DOM library.

\- `webdetta/webcomp`\
Functions for creating [Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components).\
Useful for integrating existing web apps with third-party teams that don't use our libraries.

---

### Common modules

A collection of common modules not attributable to any specific submodule.\
These modules are used by many of the other modules throught the webdetta library.

\- `webdetta/common/browserenv`\
Detection of browser environment type at runtime.

\- `webdetta/common/builder`\
Implements expressive, chainable syntax using the builder pattern.

\- `webdetta/common/context`\
A flexible way of handling scoped variables.

\- `webdetta/common/debug`\
Library debugging module.

\- `webdetta/common/dom`\
DOM-specific functions.

\- `webdetta/common/errors`\
Functions for handling global uncaught exceptions.

\- `webdetta/common/jsenv`\
JavaScript runtime environment detection: browser, node, webworker, jsdom, deno, bun.

\- `webdetta/common/utils`\
General-purpose utilities for throttling, memoization, error handling, data formatting and more.

---

### Configuration modules

These modules do not export anything, so just import the module itself for it to take effect.

\- `webdetta/config/enable-debug`\
Enables webdetta library debugging/inspection features.\
Must not be used in production.

\- `webdetta/config/enable-http-modules`\
Enables NodeJS http(s) imports.

\- `webdetta/config/enable-websockets-node`\
Enables NodeJS websocket client support.

\- `webdetta/config/handle-uncaught-errors`\
Automatically handles global uncaught errors and logs them to console.\
Prevents a NodeJS process from exiting on unhandled promise rejection.

---

### Third party systems integrations

\- `webdetta/telegram/server`\
Server-side module for authorizing Telegram Mini Apps users.

\- `webdetta/telegram/tma`\
Client-side syntax sugar for the [Telegram Web App](https://telegram.org/js/telegram-web-app.js) library.
