import React, { useState, useEffect } from "react";

import PropTypes from "prop-types";
import { fomratDate } from "../../utils/formatter";

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
    this.setState({ stringifiedDate: fomratDate(this.props.date).desc });
  }
  componentDidMount() {
    this.calculateStringifiedDate();
  }
  render() {
    return <div className="timestamp">{this.state.stringifiedDate}</div>;
  }
}
TimeSince.initGlobalTimer();
