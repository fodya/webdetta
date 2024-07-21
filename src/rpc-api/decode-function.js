// This function decodes stringified functions passed to client from server.
// It is moved into the separate module with no variables to prevent scope
// namespace pollution of a newly parsed function.
// The parser exposes only one variable to the function scope -- `rpc`.
export default function() {
  // arguments : [rpc, thisArg, args, body];
  const rpc = arguments[0];
  return new Function(
    ...Array.prototype.slice.call(arguments, 2)
  ).bind(arguments[1]);
}
