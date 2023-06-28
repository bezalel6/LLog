import React, { useRef } from "react";
import Dropdown from "./components/Dropdown";
import { EventLog } from "./Events";
import { formatLabelStr } from "./utils/utils";

export interface EventCreatorProps {
  eventLogs: EventLog[];
}
const NonGuiEventKeys: Set<keyof EventLog> = new Set(["createdAt", "id"]);
export default function EventCreator({ eventLogs }: EventCreatorProps) {
  const defaultOptionValues: Array<Set<string>> = [];
  const optionLabels: Map<number, string> = new Map();

  const filteredLogKeys = eventLogs.length
    ? Object.keys(eventLogs[0]).filter(
        (k) => !NonGuiEventKeys.has(k as keyof EventLog)
      )
    : [];
  eventLogs.forEach((eventLog) => {
    filteredLogKeys.forEach((key, i) => {
      if (!defaultOptionValues[i]) defaultOptionValues[i] = new Set();
      optionLabels.set(i, key);
      defaultOptionValues[i].add(eventLog[key] + "");
    });
  });

  const onSubmit = (e: any) => {
    e.preventDefault();
  };

  const makeOnSelectionFunc = (dropdownIndex: number) => {
    return (selected, index) => {
      //
    };
  };

  for (let i = 0; i < optionLabels.size; i++) {
    console.log(optionLabels.get(i), defaultOptionValues[i]);
  }
  // console.log(optionsForOptions);
  return (
    <>
      <form onSubmit={onSubmit}>
        <div className="container flex-row">
          {defaultOptionValues.map((options, index) => {
            return (
              <Dropdown
                label={formatLabelStr(optionLabels.get(index))}
                key={index}
                onSelected={makeOnSelectionFunc(index)}
                options={[...options]}
              ></Dropdown>
            );
          })}
        </div>
        <br />
        <button type="submit">Send</button>
      </form>
    </>
  );
}
