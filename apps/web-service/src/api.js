const wsConnections = new Set();

const getUser = async d => d;
const auth = async function (token) {
  this.user = await getUser(token);
  return !!this.user;
}
const methods = {
  sayHiTo(someone) {
    return `Hello, ${someone}. From: ${this.user}`;
  },
  sayHiToAll() {
    for (const conn of wsConnections) if (conn != this)
      conn.cast('message', methods.sayHiTo.call(this, conn.user));
  }
}

export { wsConnections, methods, auth }
