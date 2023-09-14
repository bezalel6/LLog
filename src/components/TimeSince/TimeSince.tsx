import React, { useState, useEffect } from "react";

import PropTypes from "prop-types";
import { fomratDate } from "../../utils/formatter";

export default class TimeSince extends React.Component<
  { date: Date },
  { stringifiedDate: string; stringifiedExact: string; isHovered: boolean }
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
    this.state = {
      stringifiedDate: "",
      stringifiedExact: "",
      isHovered: false,
    };
  }
  calculateStringifiedDate() {
    let f = fomratDate(this.props.date);
    this.setState({ stringifiedDate: f.desc, stringifiedExact: f.exact });
  }
  componentDidMount() {
    this.calculateStringifiedDate();
  }
  handleMouseEnter = () => {
    this.setState({ isHovered: true });
  };
  handleMouseLeave = () => {
    this.setState({ isHovered: false });
  };
  render() {
    const displayText = this.state.isHovered
      ? this.state.stringifiedExact
      : this.state.stringifiedDate;

    return (
      <div
        className="timestamp"
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        {displayText}
      </div>
    );
  }
}
TimeSince.initGlobalTimer();
