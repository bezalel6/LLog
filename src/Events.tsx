/* eslint-disable no-debugger */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { FirebaseContext, UserContext } from "./contexts";
import { useCollection } from "react-firebase-hooks/firestore";
import Selection from "./components/SelectionButtons";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { EventLog, PrimitiveEventLog } from "./Event";

import "./Events.css";
import List from "./eventsViews/List";
import LineChart from "./eventsViews/LineChart";

export interface EventsProps {
  setEventLogs: (eventLogs: EventLog[]) => void;
  currentLogs: EventLog[];
}
export default function Events({ setEventLogs, currentLogs }: EventsProps) {
  const firebase = useContext(FirebaseContext)!;
  const user = useContext(UserContext)!;

  const db = getFirestore(firebase);

  const q = query(collection(db, "events"), orderBy("createdAt"));
  const [snapshot] = useCollection(q);

  const _events: EventLog[] = snapshot?.docs.map((doc) => {
    const data = doc.data() as PrimitiveEventLog;
    if (!data.createdAt) return null;
    // console.log("new data", data);

    const createdAt = (data.createdAt as any).seconds;
    const e = new EventLog();
    const id = doc.id;
    e.amount = data.amount;
    e.createdAt = createdAt;
    e.event_type = data.event_type;
    e.units = data.units;
    e.id = id;

    return e;
  });
  // const events = (_events ? _events.filter((o) => !!o) : []).map((e) => {
  //   return sortKeys(e);
  // });
  const events = (_events ? _events.filter((o) => !!o) : []).map((e) => {
    return e;
  });
  // console.log(events);

  // inside Events component
  useEffect(() => {
    // fetch or calculate new logs

    if (JSON.stringify(currentLogs) !== JSON.stringify(events)) {
      console.log("got new events", events);

      setEventLogs(events);
    }
  }, [events, currentLogs, setEventLogs]);

  const [currentViewStyle, setCurrentViewStyle] = useState(EventViewStyle.List);
  return (
    <div className="events">
      {/* <ViewStyleSelector
        currentViewStyle={currentViewStyle}
        setViewStyle={setCurrentViewStyle}
      ></ViewStyleSelector> */}
      <Selection<EventViewStyle>
        currentValue={currentViewStyle}
        enumV={EventViewStyle}
        setValue={setCurrentViewStyle}
      ></Selection>

      {currentViewStyle === EventViewStyle.LineChart && (
        <LineChart events={events}></LineChart>
      )}
      {currentViewStyle === EventViewStyle.List && (
        <List events={events}></List>
      )}

      {/* {currentViewStyle === EventViewStyle.BarChart && <Fitness></Fitness>} */}
    </div>
  );
}

export enum EventViewStyle {
  BarChart,
  LineChart,
  List,
}
