import React, { useState, useEffect } from "react";
import moment from "moment";

function TimeSince({ date }) {
  const calculateTime = () => moment(date).fromNow();

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
