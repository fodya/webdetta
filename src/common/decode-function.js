// Decodes stringified functions passed to client from server.
// The module has no variables to prevent generated function scope pollution.
export default function() { return new Function(...arguments); }
