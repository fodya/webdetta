let debugEnabled = false;
const DEBUG = Symbol('DEBUG');

const linkOriginalFunction = (func, wrapped) => {
  if (!debugEnabled) return wrapped;

  const entry = wrapped[DEBUG] ??= {};
  entry.originalFunction = func[DEBUG]?.original ?? func;
  (entry.functionWrappers ??= []).push(func);

  return wrapped;
}

export const debug = {
  enable: () => (debugEnabled = true),
  linkOriginalFunction
}
