import React from "react";

export interface SelectionProps<T> {
  enumV: any;
  currentValue: T;
  setValue: (val: T) => void;
}

export default function Selection<T>({
  enumV,
  currentValue,
  setValue,
}: SelectionProps<T>) {
  const makeOnClick = (value: T) => {
    return () => {
      setValue(value);
    };
  };

  return (
    <div className="container flex-row margin-bottom">
      {Object.keys(enumV)
        // Enums in TypeScript come in pairs of name-number,
        // so we filter out the numeric keys to avoid duplicates
        .filter((key) => isNaN(Number(key)))
        .map((key, i) => {
          const t = enumV[key];
          const isSelected = t === currentValue;
          return (
            <button
              key={i}
              className={isSelected ? "selected" : ""}
              onClick={makeOnClick(t)}
              aria-pressed={isSelected}
            >
              {key}
            </button>
          );
        })}
    </div>
  );
}
