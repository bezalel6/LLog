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

  public get timestamp() {
    if (isNaN(Number(this.createdAt))) {
      return null;
    }
    const ret = new Date();
    const converted = (this.createdAt as number) * 1000;
    if (converted < ret.getTime()) ret.setTime(converted);
    return ret;
  }

  public get normalized() {
    const reg = /attent/i;
    return reg.test(this.event_type) ? this.amount / 15 : this.amount;
  }
}

class Normalizer {}
