/* eslint-disable no-debugger */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { FirebaseContext, GoogleAuthContext, UserContext } from "./contexts";
import { useCollection } from "react-firebase-hooks/firestore";
import Selection from "./components/SelectionButtons/SelectionButtons";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { EventLog, PrimitiveEventLog } from "./EventLog";

import "./Events.css";
import List from "./eventsViews/List";
import LineChart from "./eventsViews/LineChart";

export interface EventsProps {
  setEventLogs: (eventLogs: EventLog[]) => void;
  currentLogs: EventLog[];
  shown: boolean;
}
export default function Events({
  shown,
  setEventLogs,
  currentLogs,
}: EventsProps) {
  const firebase = useContext(FirebaseContext)!;
  const user = useContext(UserContext)!;
  const db = getFirestore(firebase);

  const q = query(collection(db, "events"), orderBy("createdAt"));
  const [snapshot] = useCollection(q);

  let events: EventLog[] = snapshot?.docs.map((doc) => {
    // console.log("doc data", doc.data());

    const data = doc.data() as PrimitiveEventLog;
    let createdAt;

    if (!data.createdAt) createdAt = new Date().getTime();
    else createdAt = (data.createdAt as any).seconds;
    // console.log("new data", data);

    const e = new EventLog();
    const id = doc.id;
    e.amount = data.amount;
    e.createdAt = createdAt;
    e.event_type = data.event_type;
    e.units = data.units;
    e.id = id;
    e.created_by = data.created_by;
    return e;
    console.log({ e });
  });
  events = (events ? events.filter((o) => !!o) : []).map((e) => {
    return e;
  });
  const deleteEvent = async (event: EventLog) => {
    return deleteDoc(doc(db, "events", event.id));
  };
  // inside Events component
  useEffect(() => {
    // fetch or calculate new logs

    if (JSON.stringify(currentLogs) !== JSON.stringify(events)) {
      // console.log("got new events", events);

      setEventLogs(events);
    }
  }, [events, currentLogs, setEventLogs]);
  const [currentViewStyle, setCurrentViewStyle] = useState(EventViewStyle.List);
  return (
    <>
      {shown && (
        <div className="events">
          <Selection<EventViewStyle>
            currentValue={currentViewStyle}
            enumV={EventViewStyle}
            setValue={setCurrentViewStyle}
          ></Selection>

          {currentViewStyle === EventViewStyle.LineChart && (
            <LineChart events={events}></LineChart>
          )}
          {currentViewStyle === EventViewStyle.List && (
            <List deleteEvent={deleteEvent} events={events}></List>
          )}

          {/* {currentViewStyle === EventViewStyle.BarChart && <Fitness></Fitness>} */}
        </div>
      )}
    </>
  );
}

export enum EventViewStyle {
  // BarChart,
  LineChart,
  List,
}
