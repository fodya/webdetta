// This function decodes stringified functions passed to client from server.
// It is moved into the separate module with no variables to prevent scope pollution.
export default function() { return new Function(...arguments); }
