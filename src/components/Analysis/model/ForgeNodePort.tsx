/* eslint-disable @typescript-eslint/member-ordering */
import { DeserializeEvent } from "@projectstorm/react-canvas-core";
import {
  DefaultPortModel,
  DefaultPortModelOptions,
  RightAngleLinkModel,
} from "@projectstorm/react-diagrams";
import { TensorDescriptionModel as Tensor } from ".";

export interface ForgeNodePortOptions extends DefaultPortModelOptions {
  idx: number;
  tensor: Tensor;
  // Note: this is actually required, but the super class has marked it as
  // optional
  label: string;
}

export default class ForgeNodePort extends DefaultPortModel {
  public idx: number;
  public tensor: Tensor;

  public constructor(options: ForgeNodePortOptions) {
    super(options);
    this.idx = options.idx;
    this.tensor = options.tensor;
  }

  public serialize() {
    const { idx, tensor } = this;
    return {
      ...super.serialize(),
      idx,
      tensor,
    };
  }

  public deserialize(event: DeserializeEvent<this>) {
    super.deserialize(event);
    this.idx = event.data.idx;
    this.tensor = event.data.tensor;
  }

  public createLinkModel() {
    return new RightAngleLinkModel();
  }
}
