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
  eventLogs.forEach((eventLog) => {
    Object.keys(eventLog)
      .filter((k) => !NonGuiEventKeys.has(k as keyof EventLog))
      .forEach((key, i) => {
        if (!defaultOptionValues[i]) defaultOptionValues[i] = new Set();
        optionLabels.set(i, key);
        defaultOptionValues[i].add(eventLog[key] + "");
      });
  });

  const onSubmit = (e: any) => {
    e.preventDefault();
  };

  const onOptionSelected = (selected: string, selectedIndex: number) => {
    // alert(selected);
    //if selected the first element, autofill the next ones to the first event found with that value
    if (selectedIndex === 0) {
      // defaultOptionValues[0].
    }
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
                onSelected={onOptionSelected}
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
