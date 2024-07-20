import { processCall } from '../rpc/proto.js';
export default (methods) => {
  const processCall = (ctx, name, args) => {
    try {
      const [result, err] = await processCall(methods, ctx_, name, args);
      if (err) throw err;
      return { status: 200, result: JSON.stringify(result) };
    } catch (e) {
      console.error(e);
      return { status: 500, result: JSON.stringify(e) };
    }
  }
  return { processCall }
}
