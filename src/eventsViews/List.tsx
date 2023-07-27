import React, { useRef } from "react";
import { EventLog } from "../Event";
import TimeSince from "../components/TimeSince";
import { formatLabelStr } from "../utils/utils";
import "./List.css";

export default function List({ events }: { events: EventLog[] }) {
  const bottomRef = useRef<HTMLDivElement>();
  if (bottomRef.current)
    bottomRef.current.scrollIntoView({ behavior: "smooth" });
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

export function Event({ event }: EventProps) {
  const timestamp = event.timestamp;

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
