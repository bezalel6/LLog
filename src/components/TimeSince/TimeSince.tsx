import React, { useState, useEffect } from "react";
import moment from "moment";

import PropTypes from "prop-types";

export default class TimeSince extends React.Component<
  { date: Date },
  { stringifiedDate: string }
> {
  static allComponents = new Array<TimeSince>();
  static initGlobalTimer() {
    setInterval(() => {
      console.log("global timer running...");

      TimeSince.allComponents.forEach((comp) => {
        comp.calculateStringifiedDate();
      });
    }, 60_000);
  }
  constructor(props) {
    super(props);
    TimeSince.allComponents.push(this);
    this.state = { stringifiedDate: "" };
  }
  calculateStringifiedDate() {
    const calculateTime = () => {
      const date = this.props.date;
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
    this.setState({ stringifiedDate: calculateTime() });
  }
  componentDidMount() {
    this.calculateStringifiedDate();
  }
  render() {
    return <div className="timestamp">{this.state.stringifiedDate}</div>;
  }
}
TimeSince.initGlobalTimer();
