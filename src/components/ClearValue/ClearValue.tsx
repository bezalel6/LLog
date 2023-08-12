import React from "react";
import "./ClearValue.css";
export interface ClearValueProps {
  onClear: () => void;
  value: string;
}
export default function ClearValue({ onClear, value = "X" }: ClearValueProps) {
  return (
    <div className="reset-container">
      <input
        onClick={onClear}
        className="reset-input"
        type="button"
        value={value}
      ></input>
    </div>
  );
}
