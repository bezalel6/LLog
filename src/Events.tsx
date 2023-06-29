/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useContext, useEffect, useRef } from "react";
import { FirebaseContext, UserContext } from "./contexts";
import { useCollection } from "react-firebase-hooks/firestore";

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { sortKeys } from "./utils/utils";
import { EventLog, PrimitiveEventLog, Event } from "./components/Event";

import "./Events.css";

export interface EventsProps {
  setEventLogs: (eventLogs: EventLog[]) => void;
  currentLogs: EventLog[];
}
export default function Events({ setEventLogs, currentLogs }: EventsProps) {
  const bottomRef = useRef<HTMLDivElement>();

  const firebase = useContext(FirebaseContext)!;
  const user = useContext(UserContext)!;

  const db = getFirestore(firebase);

  const q = query(collection(db, "events"), orderBy("createdAt"));
  const [snapshot] = useCollection(q);

  const _events: EventLog[] = snapshot?.docs.map((doc) => {
    const data = doc.data() as PrimitiveEventLog;
    if (!data.createdAt) return null;
    console.log("new data", data);

    const createdAt = (data.createdAt as any).seconds;
    return {
      id: doc.id,
      ...data,
      createdAt,
    };
  });
  const events = (_events ? _events.filter((o) => !!o) : []).map((e) => {
    return sortKeys(e);
  });
  console.log(events);

  // inside Events component
  useEffect(() => {
    // fetch or calculate new logs

    if (JSON.stringify(currentLogs) !== JSON.stringify(events)) {
      setEventLogs(events);
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [events, currentLogs, setEventLogs]);

  return (
    <div className="events">
      {events?.map((e) => (
        <Event event={e} key={e.id}></Event>
      ))}
      <div ref={bottomRef}></div>
    </div>
  );
}
