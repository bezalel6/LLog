import React, { useRef } from "react";
import "./Dropdown.css";
export default function EventCreator() {
  const onSubmit = (e: any) => {
    e.preventDefault();
  };
  const onOptionSelected = (selected: string, index: number) => {
    alert(selected);
  };

  return (
    <>
      <form onSubmit={onSubmit}>
        <Dropdown
          onSelected={onOptionSelected}
          options={["one", "two", "three"]}
        ></Dropdown>
        <button type="submit"></button>
      </form>
    </>
  );
}

export interface DropdownProps<T = string> {
  options: T[];
  onSelected: (selected: T, index: number) => void;
}
import { Component } from "react";

type DropdownState = {
  isActive: boolean;
};

class Dropdown extends Component<DropdownProps, DropdownState> {
  constructor(props: DropdownProps) {
    super(props);
    this.state = {
      isActive: false,
    };
  }
  getOptions = () => {
    return document.querySelectorAll<HTMLDivElement>(".dropdown_option");
  };
  public getSelected() {
    const opts = this.getOptions();
    for (let i = 0; i < opts.length; i++) {
      if (opts[i].dataset.active) {
        return this.makeRet(i);
      }
    }
    throw new Error("how tf");
  }
  makeRet(i: number) {
    const opts = this.getOptions();
    return { option: this.props.options[i], index: i };
  }
  componentDidMount() {
    const height = document.querySelector(".dropdown_option")?.clientHeight;
    if (height) {
      console.log("dropdown element height", height);
      document.documentElement.style.setProperty(
        "--single_element_height",
        `${height}px`
      );
    }

    const opts = this.getOptions();

    for (let i = 0; i < opts.length; i++) {
      const option = opts[i];
      option.onclick = () => {
        this.getOptions().forEach((o, inner) => {
          if (inner != i) o.dataset.active = "false";
        });
        if (option.dataset.active !== "true") {
          option.dataset.active = "true";
          this.props.onSelected(this.makeRet(i).option, this.makeRet(i).index);
        }
      };
    }
  }

  onClick = () => {
    this.setState((prevState) => ({
      isActive: !prevState.isActive,
    }));
  };

  render() {
    const { isActive } = this.state;
    const { options } = this.props;
    const activeClass = isActive ? "active" : "";

    return (
      <div onClick={this.onClick} className={`dropdown ${activeClass}`}>
        {options.map((option, i) => (
          <div
            className="dropdown_option"
            data-active={i == 0 ? "true" : ""}
            data-index={i}
            key={i}
          >
            {option}
          </div>
        ))}
      </div>
    );
  }
}
