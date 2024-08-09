import { processCall } from '../rpc/proto.js';
import { RpcServer } from '../rpc/server.js';
import FunctionParser from 'parse-function';

const parser = FunctionParser();
parser.use((self) => (node, result) => {
  let params = node.params;
  if (node.type == 'ObjectExpression') params = node.properties[0].params;
  if (!Array.isArray(params)) return;
  result.rawArgs = [];
  for (const [param, i] of params.map((d, i) => [d, i])) {
    const { start, end } = param.loc;
    result.rawArgs[i] = result.value.slice(start.index, end.index);
  }
});
export const parseFn = val => {
  try {
    const res = parser.parse(val);
    res.args = res.rawArgs;
    // if (res.isArrow) throw new Error('Arrow functions are not allowed.');
    return res;
  } catch (e) {
    console.error(val, e);
    throw new Error('Failed to parse function.');
  }
}

export const obj2code = (obj, vars=[], pad='  ') => {
  if (typeof obj == 'function') {
    const { args, body, isAsync, value, params } = parseFn(obj);
    const hasCurly = value.replace(params, '').replace(body, '').includes('{');
    return [isAsync ? 'async ' : '',
      `function (${args.join(',')}) {`,
        vars.length == 0 ? '' : `var ${vars.join(',')};`,
        hasCurly ? '' : 'return ', body.trim(),
      '}'
    ].join('');
  }
  if (Array.isArray(obj))
    return `[${obj.map(d => obj2code(d, vars, pad)).join(',')}]`;
  if (typeof obj == 'object' && obj !== null)
    return '{\n' +
      Object.entries(obj).map(([k, v]) =>
        pad + JSON.stringify(k) + ':' + obj2code(v, vars, pad + '  ')
      ).join(',\n')
    + `\n${pad.slice(0, -2)}}`;
  return JSON.stringify(obj);
}

const onrequest = async (methods, ctx, req, res) => {
  if (!methods.$onrequest) return;
  await methods.$onrequest.call(ctx, req, res);
}

const onsocket = async (methods, ctx, req, ws) => {
  if (!methods.$onsocket) return;
  await methods.$onsocket.call(ctx, req, ws);
}

export const Api = {
  HTTP: (methods) => {
    const processRequest = async (req, res) => {
      try {
        const name = req.params.name;
        const args = req.body;

        const ctx = {};
        await onrequest(methods, ctx, req, res);

        const [result, err] = await processCall(methods, ctx, name, args);

        if (err) throw err;
        res.status(200).send(JSON.stringify(result));
      } catch (e) {
        console.error(e);
        res.status(500).send(JSON.stringify(e));
      }
    }
    return { processRequest }
  },
  WS: (methods) => {
    const upgrade_ = RpcServer();
    upgrade_.methods = methods;
    const upgrade = async (req, ws) => {
      const ctx = upgrade_(ws);
      await onsocket(methods, ctx, req, ws);
      return ctx;
    }
    return { upgrade };
  }
};
