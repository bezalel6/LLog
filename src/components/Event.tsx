import { FieldValue } from "firebase/firestore";
import "./Event.css";
import { formatLabelStr } from "../utils/utils";

import moment from "moment";
import TimeSince from "./TimeSince";
export interface EventProps {
  event: EventLog;
}

export function Event({ event }: EventProps) {
  let timestamp = new Date();

  timestamp.setTime((event.createdAt as number) * 1000);
  if (timestamp.getTime() > new Date().getTime()) timestamp = new Date();

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
    </div>
  );
}
export interface PrimitiveEventLog {
  //in seconds. (epoch obv)
  createdAt: number | FieldValue;
  amount: number;
  units: string;
  event_type: string;
}
export interface EventLog extends PrimitiveEventLog {
  id: string;
}
