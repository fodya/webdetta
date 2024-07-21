// This function decodes stringified functions passed to client from server.
// It is moved into the separate module with no variables to prevent scope
// namespace pollution of a newly parsed function.
export default function() {
  return new Function(...Array.prototype.slice.call(arguments, 1))
    .bind(arguments[0]);
}
