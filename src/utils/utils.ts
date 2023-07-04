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
