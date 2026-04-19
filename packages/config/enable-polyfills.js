const { hasOwnProperty } = Object.prototype;

if (!Object.hasOwn) {
  Object.hasOwn = (object, property) => {
    if (object == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    return hasOwnProperty.call(Object(object), property);
  };
}

if (!Promise.withResolvers) {
  Promise.withResolvers = function withResolvers() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

if (!Array.prototype.at) {
  Array.prototype.at = function at(index) {
    const relative = Math.trunc(index) || 0;
    const k = relative >= 0 ? relative : this.length + relative;
    if (k < 0 || k >= this.length) return undefined;
    return this[k];
  };
}
