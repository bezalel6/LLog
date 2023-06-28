import { Component, createRef } from "react";
import "./Dropdown.css";

export interface DropdownProps<T = string> {
  label?: string;
  options: T[];
  onSelected: (selected: T, index: number) => void;
}

type DropdownState = {
  isActive: boolean;
};

export default class Dropdown extends Component<DropdownProps, DropdownState> {
  static dropdownInstances: Dropdown[] = [];
  public static getDropdown(index: number) {
    return this.dropdownInstances[index];
  }
  private dropdownRef = createRef<HTMLDivElement>();

  constructor(props: DropdownProps) {
    super(props);

    this.state = {
      isActive: false,
    };
    Dropdown.dropdownInstances.push(this);
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
    throw new Error("No active option found");
  }

  makeRet(i: number) {
    return { option: this.props.options[i], index: i };
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
  }
  public setSelected(index: number, triggerSelectionCallback = true) {
    const opts = this.getOptions();

    for (let i = 0; i < opts.length; i++) {
      const option = opts[i];
      if (i != index) option.dataset.active = "false";
      /*if (option.dataset.active !== "true")*/ else {
        option.dataset.active = "true";
        if (triggerSelectionCallback)
          this.props.onSelected(this.makeRet(i).option, this.makeRet(i).index);
      }
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
      <div className="container flex-col">
        {this.props.label && <h4>{this.props.label}</h4>}
        <div
          onClick={this.onClick}
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
      </div>
    );
  }
}
