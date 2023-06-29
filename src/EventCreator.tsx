import React, { useContext, useRef } from "react";
import Dropdown from "./components/Dropdown";
import { EventLog, PrimitiveEventLog } from "./components/Event";
import { formatLabelStr, isNumber } from "./utils/utils";
import {
  getFirestore,
  query,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { FirebaseContext, UserContext } from "./contexts";
import "./EventCreator.css";
export interface EventCreatorProps {
  eventLogs: EventLog[];
}
export type InputType = "number";
// export type InputType = "number"  | "text";
export interface GUIEventLog {
  amount: number;
  amount_type: string;
  event_type: string;
  // input_type: InputType;
}
function convertEventLogToGUI(eventLog: EventLog): GUIEventLog {
  return {
    amount: eventLog.amount,
    amount_type: eventLog.units,
    event_type: eventLog.event_type,

    // input_type: "number",
  };
}
function convertGUIEventLogToSend(eventLogGUI: GUIEventLog): PrimitiveEventLog {
  return {
    amount: eventLogGUI.amount,
    units: eventLogGUI.amount_type,
    event_type: eventLogGUI.event_type,
    createdAt: serverTimestamp(),
  };
}
function validateDoc(doc: any) {
  return (
    doc &&
    doc.uid &&
    !Object.keys(doc).find(
      (key) => doc[key] && (doc[key] + "").trim().length == 0
    )
  );
}

export default function EventCreator({ eventLogs }: EventCreatorProps) {
  const convertedEvents = eventLogs.map(convertEventLogToGUI);
  // console.log(convertedEvents);
  const resetor = {
    onreset: null,
  };

  const formData = useRef<GUIEventLog>({
    amount: -1,
    amount_type: " ",
    event_type: " ",
  }).current;

  const defaultOptionValues: Array<Set<string>> = [];
  const optionLabels: Map<number, string> = new Map();

  convertedEvents.forEach((convertedEvents) => {
    Object.keys(convertedEvents).forEach((key, i) => {
      if (!defaultOptionValues[i]) defaultOptionValues[i] = new Set();
      optionLabels.set(i, key);
      defaultOptionValues[i].add(convertedEvents[key] + "");
    });
  });

  const firebase = useContext(FirebaseContext)!;
  const user = useContext(UserContext)!;

  const onSubmit = async (e: any) => {
    e.preventDefault();
    console.log("submitting", formData);

    const db = getFirestore(firebase);

    const eventsRef = collection(db, "events");
    const doc = { ...convertGUIEventLogToSend(formData), uid: user.uid };
    if (!validateDoc(doc)) {
      console.error("update wasnt validated");
    }
    await addDoc(eventsRef, doc)
      .then(() => {
        console.log("succesfully added " + formData.event_type);
        if (resetor.onreset) resetor.onreset();
      })
      .catch((e) => {
        alert("error writing to the db: " + e);
      });
  };

  const makeOnSelectionFunc = (dropdownIndex: number) => {
    return (selected: string, _: number) => {
      function k(i: number) {
        return Object.keys(formData)[i];
      }
      const key = k(dropdownIndex);
      console.log("key", key, "val", selected);
      if (isNumber(formData[key])) formData[key] = Number(selected);
      else formData[key] = selected;
      console.log("set val", formData[key]);
    };
  };

  for (let i = 0; i < optionLabels.size; i++) {
    console.log(optionLabels.get(i), defaultOptionValues[i]);
  }
  // console.log(optionsForOptions);
  return (
    <>
      <form onSubmit={onSubmit}>
        <div className="container flex-row dropdowns">
          {defaultOptionValues.map((options, index) => {
            return (
              <Dropdown
                resetor={resetor}
                customInput={true}
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
