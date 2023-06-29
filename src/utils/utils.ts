export function sortKeys<T>(obj: T) {
  return (
    Object.keys(obj)
      .sort()
      // .reverse()
      .reduce((objEntries, key) => {
        objEntries[key] = obj[key];

        return objEntries as T;
      }, {}) as T
  );
}
export function isNumber(value?: string | number): boolean {
  return (
    value != null &&
    value.toString().trim() !== "" &&
    !isNaN(Number(value.toString()))
  );
}
export function formatLabelStr(str: string) {
  const words = str.split(/[_ ]/);
  // eslint-disable-next-line no-debugger
  // debugger;
  return words
    .map((w) =>
      w.length ? w.substring(0, 1).toUpperCase() + w.substring(1) : w
    )
    .join(" ");
}
