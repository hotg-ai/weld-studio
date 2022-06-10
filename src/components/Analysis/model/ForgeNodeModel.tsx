/* eslint @typescript-eslint/member-ordering: 0 */
import {
  NodeModel,
  // PortModelAlignment,
  NodeModelGenerics,
} from "@projectstorm/react-diagrams";
import {
  BaseModelOptions,
  DeserializeEvent,
} from "@projectstorm/react-canvas-core";
import {
  Component,
  modelProperties,
  outputProperties,
  Property,
  PropertyValues,
  TensorDescriptionModel as Tensor,
} from ".";

import { ColorFromComponentTypeString } from "../utils/ForgeNodeUtils";
import ForgeNodePort from "./ForgeNodePort";

declare enum PortModelAlignment {
  TOP = "top",
  LEFT = "left",
  BOTTOM = "bottom",
  RIGHT = "right",
}

type Port = {
  name: string;
  alignment: PortModelAlignment;
  parentNode: string;
  links: string[];
  x: number;
  y: number;
  type: string;
  selected: boolean;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  extras: any;
  id: string;
  locked: boolean;
};
type RawSerialized = {
  ports: Port[];
  x: number;
  y: number;
  type: string;
  selected: boolean;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  extras: any;
  id: string;
  locked: boolean;
};

export type ForgeNodeModelSerialized = {
  /**
   * An identifier like "hotg-ai/proc-blocks#fft" which tells Rune what type of
   * capability/proc-block/whatever to use.
   */
  componentIdentifier?: string;
  propertiesValueMap: Record<string, string | number | undefined>;
} & RawSerialized &
  ForgeNodeModelOptions;

export interface ForgeNodeModelOptions extends BaseModelOptions {
  id: string;
  name: string;
  type: Component["type"];
  /**
   * A unique id for the Component this node is based on.
   */
  componentID: string;
  color?: string;
}

function componentProperties(component: Component): Record<string, Property> {
  switch (component.type) {
    case "capability":
    case "proc-block":
      return component.properties;
    case "model":
      return modelProperties;
    case "output":
      return outputProperties;
    default:
      throw new Error(
        "Typescript makes sure this is unreachable, but eslint insists on the branch anyway 🤷"
      );
  }
}

function defaultPropertyValues(
  component: Component
): Record<string, string | number> {
  const values: Record<string, string | number> = {};
  const properties = componentProperties(component);

  for (const [name, property] of Object.entries(properties)) {
    values[name] = property.defaultValue;
  }

  return values;
}

function inputs(component: Component): Tensor[] {
  switch (component.type) {
    case "capability":
      return [];
    case "model":
      return component.inputs;
    case "proc-block":
      // TODO: Proc-blocks can be generic over their inputs, so we should
      // probably do something smarter here
      return component.exampleInputs;
    case "output":
      // TODO: figure out how to represent "any tensor"
      return component.exampleInputs;
  }
}

function outputs(
  component: Component,
  propertyValues: PropertyValues
): Tensor[] {
  switch (component.type) {
    case "capability":
      return component.outputs(propertyValues);
    case "model":
      return component.outputs;
    case "proc-block":
      // TODO: Compute this using component.outputs()
      return component.exampleOutputs;
    default:
      return [];
  }
}
// Note: we get better autocomplete on ForgeNodeModel by specifying our options
// type.
interface Generics extends NodeModelGenerics {
  OPTIONS: ForgeNodeModelOptions;
}
export type Resource = {
  path: string;
  type: "string" | "binary";
};

export class ForgeNodeModel extends NodeModel<Generics> {
  public id: string;
  public color: string;
  public name: string;
  public type: Component["type"];
  public component: Component & { inputs?: any };
  public propertiesValueMap: Record<string, string | number | undefined>;

  public constructor(options: ForgeNodeModelOptions, component: Component) {
    super({ ...options });
    this.color = ColorFromComponentTypeString(options.type);
    this.id = options.id;
    this.name = options.name;
    this.type = options.type;
    this.component = component;
    this.propertiesValueMap = defaultPropertyValues(component);
    this.preparePorts();
  }

  public get properties(): Record<string, Property> {
    return componentProperties(this.component);
  }

  public addPropertyValues(
    value: Record<string, string | number | undefined>
  ): void {
    this.propertiesValueMap = { ...this.propertiesValueMap, ...value };
  }

  public serialize(): ForgeNodeModelSerialized {
    return {
      ...super.serialize(),
      name: `${this.name}----${this.id}`,
      propertiesValueMap: this.propertiesValueMap,
      type: this.type,
      id: this.id,
      color: this.color,
      componentIdentifier: this.component?.identifier,
      componentID: this.options.componentID,
    };
  }

  public deserialize(event: DeserializeEvent<this>) {
    this.preparePorts();
    super.deserialize(event);
    const {
      data: { id, name, propertiesValueMap, type, color },
    } = event;
    this.id = id;
    this.name = name.split("----")[0];
    this.propertiesValueMap = { ...propertiesValueMap } || {};
    this.type = type;
    this.color = color || ColorFromComponentTypeString(this.type);
    // TODO: Allow deserialization of component from componentIdentifier
    // this.component = getComponentFromIdentifier(data.componentIdentifier);
    // Before the actual Deserialize event we mount SerializedDiagram's componentData to the Store/Ether and getComponentFromIdentifier fetches from there
  }

  private ports_registration: Record<string, boolean> = {};

  private preparePorts() {
    Object.values(this.getPorts()).forEach((p) => this.removePort(p));

    inputs(this.component).forEach((tensor, idx) => {
      const name = tensor.displayName || `${this.name} input ${idx + 1}`;
      const key = `inputs_${name}`;
      if (!this.ports_registration[key]) {
        this.addPort(
          new ForgeNodePort({
            in: true,
            name,
            label: name,
            idx,
            tensor,
          })
        );
      }
      this.ports_registration[key] = true;
    });

    outputs(this.component, this.propertiesValueMap).forEach((tensor, idx) => {
      const name = tensor.displayName || `${this.name} output ${idx + 1}`;
      const key = `outputs_${name}`;
      if (!this.ports_registration[key]) {
        this.addPort(
          new ForgeNodePort({
            in: false,
            name,
            label: name,
            idx,
            tensor,
          })
        );
      }
      this.ports_registration[key] = true;
    });
  }
}
