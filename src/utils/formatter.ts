import moment from "moment";
// export interface DateFormatOptions{
//     timePassed:
// }
export interface DateFormatOutput {
  desc: string;
  date: string;
  exact: string;
}
function exact(date: Date) {
  let diff = moment().diff(date);
  // execution
  let f = moment.utc(diff).format("HH:mm:ss");
  return f;
}
export function fomratDate(input: Date | number): DateFormatOutput {
  let date: Date;

  if (typeof input === "number") {
    date = new Date(input); // Convert epoch time to Date object
  } else {
    date = input;
  }
  return {
    desc: moment(date).fromNow(),
    date: dateFunc(date),
    exact: exact(date),
  };
}
const dateFunc = (date: Date) => {
  return moment(date).toString();
};
export function fomratDatePassed(input: Date | number): DateFormatOutput {
  let date: Date;

  if (typeof input === "number") {
    date = new Date(input); // Convert epoch time to Date object
  } else {
    date = input;
  }
  const passedFunc = () => {
    const duration = moment.duration(moment().diff(moment(date)));
    const hours = Math.floor(duration.asHours());
    const minutes = Math.floor(duration.asMinutes()) - hours * 60;
    if (hours > 12) {
      return moment(date).fromNow();
    }
    if (!hours && !minutes) {
      return "Now";
    }
    if (!minutes) {
      return `${hours} hours ago`;
    }
    if (!hours) return `${minutes} minutes ago`;
    return `${hours} hours and ${minutes} minutes ago`;
  };

  return {
    desc: passedFunc(),
    date: dateFunc(date),
    exact: "not imp yet",
  };
}
