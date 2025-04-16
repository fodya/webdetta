let enabled = false;
const DEBUG = Symbol('DEBUG');

const linkOriginalFunction = (func, wrapped) => {
  if (!enabled) return wrapped;

  const entry = wrapped[DEBUG] ??= {};
  entry.originalFunction = func[DEBUG]?.original ?? func;
  (entry.functionWrappers ??= []).push(func);

  return wrapped;
}

export const debug = {
  enabled: enabled,
  enable: () => (debug.enabled = enabled = true),
  linkOriginalFunction
}
