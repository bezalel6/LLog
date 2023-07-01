import { FieldValue } from "firebase/firestore";

export interface PrimitiveEventLog {
  //in seconds. (epoch obv)
  createdAt: number | FieldValue;
  amount: number;
  units: string;
  event_type: string;
}
export class EventLog implements PrimitiveEventLog {
  createdAt: number | FieldValue;
  amount: number;
  units: string;
  event_type: string;
  id: string;

  get timestamp() {
    if (typeof this.createdAt !== "number") return null;
    const ret = new Date();
    const converted = (this.createdAt as number) * 1000;
    if (converted < ret.getTime()) ret.setTime(converted);
    return ret;
  }
}
