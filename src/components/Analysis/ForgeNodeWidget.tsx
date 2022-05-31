/* eslint-disable @typescript-eslint/member-ordering */
import {
  DiagramEngine,
  PortWidget,
  PortModel,
  PortModelGenerics,
  PortModelOptions,
  NodeModelListener,
} from "@projectstorm/react-diagrams-core";
import { ListenerHandle } from "@projectstorm/react-canvas-core";
import _ from "lodash";
import * as React from "react";
import { ForgeNodeModel } from "../Analysis/model/ForgeNodeModel";
import { connect } from "react-redux";
import { SelectedNode, SelectNode } from "../../redux/builderSlice";

type DispatchProps = {
  SelectNode: (nodeData?: SelectedNode) => void;
};

type OwnProps = {
  node: ForgeNodeModel;
  engine: DiagramEngine;
  name: string;
  color?: string;
  type: string;
  size?: number;
  demo?: boolean;
};

type Props = DispatchProps & OwnProps;

type State = {
  name: string;
  selected: boolean;
};

export interface ForgeNodePortOptions extends PortModelOptions {
  in?: boolean;
}

export interface ForgeNodePortModelGenerics extends PortModelGenerics {
  OPTIONS: ForgeNodePortOptions;
}

class ForgeNodeWidget extends React.Component<Props> {
  public state: State;
  public listener: NodeModelListener;
  public listenerHandle: ListenerHandle;
  private demo: boolean;
  public constructor(props: Props) {
    super(props);
    this.state = { name: props.name, selected: props.node.isSelected() };
    this.editProperties = this.editProperties.bind(this);
    this.props.SelectNode({ id: this.props.node.id });
    this.listener = {
      // FIXME: Update the listener generics so we have the correct event type here
      selectionChanged: (event: any): void => {
        this.setState({ selected: event.isSelected }, () => {
          this.props.SelectNode({ id: this.props.node.id });
        });
      },

      nodeAdded: () => {
        this.setState({ selected: true }, () => props.node.setSelected(true));
      },
    };
    this.listenerHandle = props.node.registerListener(this.listener);
    this.demo = props.demo || false;
  }

  public componentWillUnmount() {
    if (this.listenerHandle) {
      this.props.node.deregisterListener(this.listenerHandle);
    }
    this.props.SelectNode(undefined);
  }

  public editProperties(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    e.stopPropagation();
    e.preventDefault();
    this.props.SelectNode({ id: this.props.node.id });
  }
  public render() {
    const ports: {
      [s: string]: PortModel<ForgeNodePortModelGenerics>;
    } = this.props.node.getPorts();
    const inports: {
      [s: string]: PortModel<PortModelGenerics>;
    } = {};
    const outports: {
      [s: string]: PortModel<PortModelGenerics>;
    } = {};
    _.each(ports, (port, name) => {
      if (port.getOptions().in) {
        inports[name] = port;
      } else {
        outports[name] = port;
      }
    });

    return (
      <div
        className={`StudioBody--middle__up__item StudioBody--middle__up__item${this.props.color}`}
        style={{
          position: "relative",
          borderLeftStyle: "solid",
          borderRightStyle: !this.state.selected ? "solid" : "dashed",
          borderBottomStyle: !this.state.selected ? "solid" : "dashed",
          borderTopStyle: !this.state.selected ? "solid" : "dashed",
        }}
        onClick={(e) => this.editProperties(e)}
      >
        <input
          type="text"
          onChange={(e) => this.onIdChange(e)}
          onKeyDownCapture={(e) => {
            if (e.key === "Backspace" || e.key === "Delete") {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
          value={this.state.name}
        />
        <div className="StudioBody--middle__up__item__id">
          <span>id</span>
          <span>{this.props.node.id.split("-")[0]}</span>
        </div>
        {/* <div className="StudioBody--middle__up__item__size">
          <span>128</span>
          <span>KB</span>
        </div> */}
        <div className="ForgeNodeWidget--inports_container">
          {_.map(_.keys(inports), (name, idx) => {
            const port = inports[name];
            return (
              <PortWidget key={name} engine={this.props.engine} port={port}>
                <div
                  className={`ForgeNodeWidget--port ForgeNodeWidget--port_${this.props.color}`}
                >
                  {idx + 1}
                </div>
              </PortWidget>
            );
          })}
        </div>
        <div className="ForgeNodeWidget--outports_container">
          {_.map(_.keys(outports), (name, idx) => {
            const port = outports[name];
            return (
              <PortWidget key={name} engine={this.props.engine} port={port}>
                <div
                  className={`ForgeNodeWidget--port ForgeNodeWidget--port_${this.props.color}`}
                >
                  {idx + 1}
                </div>
              </PortWidget>
            );
          })}
        </div>
      </div>
    );
  }

  private onIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value.trim();
    if (value === "") {
      value = `UNK_${this.props.node.id.split("-")[0]}`;
    }

    this.setState({ name: value }, () => {
      this.props.node.name = this.state.name;
    });
  }
}

const mapDispatch: DispatchProps = {
  SelectNode: (selected?: SelectedNode) => SelectNode(selected),
};

export default connect(null, mapDispatch)(ForgeNodeWidget);
