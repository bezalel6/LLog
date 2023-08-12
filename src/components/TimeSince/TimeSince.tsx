import React, { useState, useEffect } from "react";
import moment from "moment";

function TimeSince({ date }) {
  const calculateTime = () => {
    const duration = moment.duration(moment().diff(moment(date)));
    const hours = Math.floor(duration.asHours());
    const minutes = Math.floor(duration.asMinutes()) - hours * 60;
    return `${hours} hours and ${minutes} minutes ago`;
  };

  const [time, setTime] = useState(calculateTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(calculateTime());
    }, 60000); // update every minute

    // Clean up function to clear the interval when the component unmounts
    return () => clearInterval(timer);
  }, [date]); // Recalculate if date prop changes

  return <div className="timestamp">{time}</div>;
}

export default TimeSince;
