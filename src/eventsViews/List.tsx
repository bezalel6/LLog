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

export default function List({ events }: { events: EventLog[] }) {
  const bottomRef = useRef<HTMLDivElement>();
  const r = () => {
    if (bottomRef.current)
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
  };
  setTimeout(r, 10);
  return (
    <div className="events-list">
      {events.map((e, i) => (
        <Event key={i} event={e}></Event>
      ))}
      <div ref={bottomRef}></div>
    </div>
  );
}
export interface EventProps {
  event: EventLog;
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
export function Event({ event }: EventProps) {
  const timestamp = event.timestamp;
  const firebase = useContext(FirebaseContext);
  firebase.firestore();
  const deleteMe = () => {
    const sure = prompt("are you sure?", "y");
    if (sure == "y") {
      alert("deleted (not actually tho. implement it already)");
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
