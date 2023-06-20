const hasOwn = (obj: unknown, prop: string) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

export { hasOwn };
