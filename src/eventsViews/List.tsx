import React, { useContext, useRef } from "react";
import { EventLog } from "../Event";
import TimeSince from "../components/TimeSince/TimeSince";
import { formatLabelStr } from "../utils/utils";
import "./List.css";
import ClearValue from "../components/ClearValue/ClearValue";
import { FirebaseContext } from "../contexts";
import firebase from "firebase/app";
import "firebase/firestore";
import { Firestore, getFirestore } from "firebase/firestore";

type EventDelete = (event: EventLog) => Promise<void>;
interface ListProps {
  events: EventLog[];
  deleteEvent: EventDelete;
}
export default function List({ events, deleteEvent }: ListProps) {
  const bottomRef = useRef<HTMLDivElement>();
  const r = () => {
    if (bottomRef.current)
      bottomRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
  };
  setTimeout(r, 10);
  return (
    <div className="events-list">
      {events.map((e, i) => (
        <Event key={i} deleteEvent={deleteEvent} event={e}></Event>
      ))}
      <div ref={bottomRef}></div>
    </div>
  );
}
export interface EventProps {
  event: EventLog;
  deleteEvent: EventDelete;
}

// const deleteDocument = async (
//   fire: firebase.FirebaseApp,
//   collection: string,
//   docId: string
// ): Promise<void> => {
//   try {
//     const db = getFirestore(fire);

//     await db.collection(collection).doc(docId).delete();
//     console.log(`Document with ID ${docId} deleted`);
//   } catch (error) {
//     console.error(`Error removing document: ${docId}`, error);
//   }
// };
export function Event({ event, deleteEvent }: EventProps) {
  const timestamp = event.timestamp;
  // firebase.firestore();
  const deleteMe = () => {
    const sure = prompt("are you sure?", "y");
    if (sure == "y") {
      deleteEvent(event).then(() => alert("Event deleted"));
    }
  };
  // timestamp
  return (
    <div className="event">
      {/* <pre>{JSON.stringify(event)}</pre> */}
      <div className="top">
        <div className="event-type">{formatLabelStr(event.event_type)}</div>
        <TimeSince date={timestamp}></TimeSince>
      </div>
      <div className="dosage">
        <div className="amount">{event.amount}</div>
        <div className="unit">{event.units}</div>
      </div>
      <ClearValue onClear={deleteMe} value="Delete"></ClearValue>
    </div>
  );
}
