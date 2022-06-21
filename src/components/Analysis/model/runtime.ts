import * as rt from "./bindings/runtime-v1";
import { ProcBlock } from "@hotg-ai/rune";

ProcBlock.load;

export type State = {
  arguments: Record<string, string>;
  inputs: Record<string, rt.Tensor>;
  outputs: Record<string, rt.Tensor>;
};

export type Evaluate = (
  inputs: Record<string, rt.Tensor>
) => Record<string, rt.Tensor>;

type ArgumentHint = {};

export type ArgumentMetadata = {
  name: string;
  description?: string;
  defaultValue?: string;
  hints: ArgumentHint[];
};
