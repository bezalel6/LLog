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
    const data = doc.data();
    return {
      id: doc.id,
      createdAt: data.createdAt.seconds as number,
      attent_dosage: data.attent_dosage,
      event_type: data.event_type,
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
export interface EventLog {
  id: string;
  //in seconds. (epoch obv)
  createdAt: number;
  event_type: string;
  attent_dosage?: string | number;
}
