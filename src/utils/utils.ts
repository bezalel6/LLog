export function sortKeys<T>(obj: T) {
  return Object.keys(obj)
    .sort()
    .reduce((objEntries, key) => {
      objEntries[key] = obj[key];

      return objEntries as T;
    }, {}) as T;
}

export function formatLabelStr(str: string) {
  const words = str.split(/[_ ]/);
  return words
    .map((w) =>
      w.length ? w.substring(0, 1).toUpperCase() + w.substring(1) : w
    )
    .join(" ");
}
