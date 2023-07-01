import { Component, createRef } from "react";
import "./Dropdown.css";
import { EventEmittor } from "../EventCreator";

export interface DropdownProps<T = string> {
  label?: string;
  customInput: boolean;
  options: T[];
  onSelected: (selected: T, index: number) => void;
  eventEmittor: EventEmittor;
}

type DropdownState = {
  isActive: boolean;
  inputStr: string;
};

export default class Dropdown extends Component<DropdownProps, DropdownState> {
  private dropdownRef = createRef<HTMLDivElement>();
  private inputRef = createRef<HTMLInputElement>();

  constructor(props: DropdownProps) {
    super(props);

    this.state = {
      isActive: false,
      inputStr: "",
    };
    props.eventEmittor.addListener(this.onInputReset);
  }

  getOptions = () => {
    if (!this.dropdownRef.current) {
      return [];
    }
    return Array.from(
      this.dropdownRef.current.querySelectorAll<HTMLDivElement>(
        ".dropdown_option"
      )
    );
  };

  public getSelected() {
    const opts = this.getOptions();
    for (let i = 0; i < opts.length; i++) {
      if (opts[i].dataset.active) {
        return this.makeRet(i);
      }
    }
    // throw new Error("No active option found");
    return { option: this.state.inputStr, index: -1 };
  }

  makeRet(i: number) {
    const ret = {
      option: i === -1 ? this.state.inputStr : this.props.options[i],
      index: i,
    };

    console.log(`making ret for ${i} made `, ret);

    return ret;
  }

  componentDidMount() {
    const height =
      this.dropdownRef.current?.querySelector(".dropdown_option")?.clientHeight;
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
        this.setSelected(i);
      };
    }
    console.log(
      "---calling onSelected when initializing with default values---"
    );
    this.setSelected(0, true);

    this.inputRef.current.onkeyup = (e) => {
      const newStr = this.inputRef.current.value;
      if (newStr === this.state.inputStr) return;
      // console.log(newStr);
      this.setState(
        (prev) => {
          return {
            inputStr: newStr,
            isActive: prev.isActive,
          };
        },
        () => {
          this.setSelected(newStr.trim().length === 0 ? 0 : -1);
        }
      );
    };
  }
  public setSelected(index: number, triggerSelectionCallback = true) {
    const opts = this.getOptions();
    const trigger = (i: number) => {
      this.props.onSelected(this.makeRet(i).option, this.makeRet(i).index);
    };
    for (let i = 0; i < opts.length; i++) {
      const option = opts[i];
      if (i != index) option.dataset.active = "false";
      /*if (option.dataset.active !== "true")*/ else {
        option.dataset.active = "true";
        if (triggerSelectionCallback) trigger(i);
      }
    }
    if (index === -1) {
      this.inputRef.current.dataset.active = "true";
      if (triggerSelectionCallback) trigger(-1);
    } else {
      this.inputRef.current.dataset.active = "false";
    }
  }
  onClick = () => {
    this.setState((prevState) => ({
      isActive: !prevState.isActive,
      inputStr: prevState.inputStr,
    }));
  };
  mouseLeave = () => {
    this.setState((prevState) => ({
      isActive: false,
      inputStr: prevState.inputStr,
    }));
  };
  onInputReset = () => {
    if (!this.inputRef || !this.inputRef.current) return;
    this.inputRef.current.value = "";
    this.inputRef.current.onkeyup(null);
  };
  render() {
    const { isActive } = this.state;
    const { options } = this.props;
    const activeClass = isActive ? "active" : "";

    return (
      <div className="container flex-col">
        {this.props.label && <h4>{this.props.label}</h4>}

        <div
          onClick={this.onClick}
          onMouseLeave={this.mouseLeave}
          className={`dropdown ${activeClass}`}
          ref={this.dropdownRef}
        >
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
        {this.props.customInput && (
          <div className="input-container">
            <input
              className="dropdown_custom"
              type="text"
              ref={this.inputRef}
            />
            <input
              onClick={this.onInputReset}
              className="reset-input"
              type="button"
              value="X"
            ></input>
          </div>
        )}
      </div>
    );
  }
}
