/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useContext, useEffect } from "react";
import { FirebaseContext, UserContext } from "./contexts";
import { useCollection } from "react-firebase-hooks/firestore";

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export default function Events() {
  const firebase = useContext(FirebaseContext)!;
  const user = useContext(UserContext)!;

  const db = getFirestore(firebase);

  const q = query(collection(db, "events"));
  const [snapshot] = useCollection(q);

  const events: EventLog[] | undefined = snapshot?.docs.map((doc) => {
    const data = doc.data() as PrimitiveEventLog;
    const createdAt = (data.createdAt as any).seconds;
    return {
      id: doc.id,
      ...data,
      createdAt,
    };
  });

  console.log(events);

  //   const q = query(collection(db, "cities"), where("capital", "==", true));

  return (
    <>
      {events?.map((e) => (
        <Event event={e} key={e.id}></Event>
      ))}
    </>
  );
}
export interface EventProps {
  event: EventLog;
}
export function Event({ event }: EventProps) {
  return <pre>{JSON.stringify(event)}</pre>;
}
interface PrimitiveEventLog {
  //in seconds. (epoch obv)
  createdAt: number;
  amount: number;
  amount_type: string;
  event_type: string;
}
export interface EventLog extends PrimitiveEventLog {
  id: string;
}
