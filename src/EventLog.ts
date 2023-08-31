import { FieldValue } from "firebase/firestore";

export interface PrimitiveEventLog {
  //in seconds. (epoch obv)
  created_at: number | FieldValue;
  amount: number;
  units: string;
  event_type: string;
  uid: string;
}
export class EventLog implements PrimitiveEventLog {
  created_at: number | FieldValue;
  amount: number;
  units: string;
  event_type: string;
  uid: string;
  id: string;

  public get timestamp() {
    if (isNaN(Number(this.created_at))) {
      console.error({ ...this });
      return null;
    }
    const ret = new Date();
    const converted = (this.created_at as number) * 1000;
    if (converted < ret.getTime()) ret.setTime(converted);
    return ret;
  }

  public get normalized() {
    const reg = /attent/i;
    return reg.test(this.event_type) ? this.amount / 15 : this.amount;
  }
}
