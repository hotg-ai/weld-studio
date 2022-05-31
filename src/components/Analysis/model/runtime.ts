// Note: Bindings generated using the following command:
//
// ```
// $ wit-bindgen js \
//     --import wit-files/proc-block-v1.wit
//     --export wit-files/runtime-v1.wit \
//     --out-dir src/bindings
// ```
import { isArguments } from "lodash";
import { ProcBlockV1 } from "./bindings/proc-block-v1";
import * as rt from "./bindings/runtime-v1";
import { ProcBlockMetadata } from "./metadata";

export type State = {
  arguments: Record<string, string>;
  inputs: Record<string, rt.Tensor>;
  outputs: Record<string, rt.Tensor>;
};

export type Evaluate = (
  inputs: Record<string, rt.Tensor>
) => Record<string, rt.Tensor>;

export async function load(
  wasm: Response | Promise<Response>
): Promise<Evaluate> {
  const sharedState: State = {
    arguments: {},
    inputs: {},
    outputs: {},
  };
  const pb = new ProcBlockV1();

  const imports: Record<string, any> = {};
  rt.addRuntimeV1ToImports(
    imports,
    new Runtime(sharedState),
    (name) => pb.instance.exports[name]
  );
  pb.addToImports(imports);

  await pb.instantiate(wasm, imports);

  return (inputs) => {
    sharedState.inputs = inputs;
    const result = pb.kernel("");

    if (result.tag == "err") {
      console.error(result.val);
      throw new Error("An error occurred (╯°□°）╯︵ ┻━┻");
    }

    return sharedState.outputs;
  };
}

type ArgumentHint = {};

export type ArgumentMetadata = {
  name: string;
  description?: string;
  defaultValue?: string;
  hints: ArgumentHint[];
};

const isArgumentHint = (hint: rt.ArgumentHint): hint is ArgumentHint => {
  throw new Error("Method not implemented.");
};

class ArgumentMetadataWrapper implements rt.ArgumentMetadata {
  metadata: ArgumentMetadata;

  constructor(name: string) {
    this.metadata = { name, hints: [] };
  }

  addHint(hint: rt.ArgumentHint): void {
    if (isArgumentHint(hint)) this.metadata.hints.push(hint);
  }

  setDescription(description: string) {
    this.metadata.description = description;
  }

  setDefaultValue(defaultValue: string) {
    this.metadata.defaultValue = defaultValue;
  }
}

class ProcBlockMetadataWrapper implements rt.Metadata {
  metadata: ProcBlockMetadata;

  constructor(name: string, version: string) {
    this.metadata = {
      name,
      version,
      tags: [],
      arguments: [],
      inputs: [],
      outputs: [],
    };
  }

  setDescription(description: string) {
    this.metadata.description =
      description.length > 0 ? description : undefined;
  }

  setRepository(url: string) {
    this.metadata.repository = url || undefined;
  }

  setHomepage(url: string) {
    this.metadata.homepage = url || undefined;
  }

  addTag(tag: string) {
    this.metadata.tags.push(tag);
  }

  addArgument(arg: rt.ArgumentMetadata) {
    if (arg instanceof ArgumentMetadataWrapper) {
      this.metadata.arguments.push(arg.metadata);
    } else {
      throw new Error("Unreachable");
    }
  }

  addInput(tensor: rt.TensorMetadata) {
    if (tensor instanceof TensorMetadataWrapper) {
      this.metadata.inputs.push(tensor.metadata);
    } else {
      throw new Error("Unreachable");
    }
  }

  addOutput(tensor: rt.TensorMetadata) {
    if (tensor instanceof TensorMetadataWrapper) {
      this.metadata.outputs.push(tensor.metadata);
    } else {
      throw new Error("Unreachable");
    }
  }
}

class TensorMetadataWrapper implements rt.TensorMetadata {
  public metadata: {
    name: string;
    description?: string | undefined;
    hints: rt.TensorHint[];
  };

  constructor(name: string) {
    this.metadata = { name, description: undefined, hints: [] };
  }

  setDescription(description: string) {
    this.metadata.description = description;
  }

  addHint(hint: rt.TensorHint) {
    this.metadata.hints.push(hint);
  }
}

export class Runtime implements rt.RuntimeV1 {
  constructor(private state: State) {}

  //   metadataNew(name: string, version: string): ProcBlockMetadataWrapper {
  //     return new ProcBlockMetadataWrapper(name, version);
  //   }

  kernelContextForNode(nodeId: string): rt.KernelContext | null {
    return new KernelContext(this.state);
  }

  metadataNew(name: string, version: string): rt.Metadata {
    return new ProcBlockMetadataWrapper(name, version);
  }
  argumentMetadataNew(name: string): rt.ArgumentMetadata {
    throw new Error("Method not implemented.");
  }
  tensorMetadataNew(name: string): rt.TensorMetadata {
    throw new Error("Method not implemented.");
  }
  interpretAsImage(): rt.TensorHint {
    throw new Error("Method not implemented.");
  }
  interpretAsAudio(): rt.TensorHint {
    throw new Error("Method not implemented.");
  }
  supportedShapes(
    supportedElementTypes: rt.ElementType[],
    dimensions: rt.Dimensions
  ): rt.TensorHint {
    throw new Error("Method not implemented.");
  }
  interpretAsNumberInRange(min: string, max: string): rt.ArgumentHint {
    throw new Error("Method not implemented.");
  }
  interpretAsStringInEnum(stringEnum: string[]): rt.ArgumentHint {
    throw new Error("Method not implemented.");
  }
  nonNegativeNumber(): rt.ArgumentHint {
    throw new Error("Method not implemented.");
  }
  supportedArgumentType(hint: rt.ArgumentType): rt.ArgumentHint {
    throw new Error("Method not implemented.");
  }
  registerNode(metadata: rt.Metadata): void {
    throw new Error("Method not implemented.");
  }
  graphContextForNode(nodeId: string): rt.GraphContext | null {
    return new GraphContext(this.state);
  }
  isEnabled(metadata: rt.LogMetadata): boolean {
    throw new Error("Method not implemented.");
  }
  log(metadata: rt.LogMetadata, message: string, data: rt.LogValueMap): void {
    throw new Error("Method not implemented.");
  }
}

class KernelContext implements rt.KernelContext {
  constructor(private state: State) {}

  getArgument(name: string): string | null {
    return this.state.arguments[name] || null;
  }
  getInputTensor(name: string): rt.Tensor | null {
    return this.state.inputs[name] || null;
  }
  setOutputTensor(name: string, tensor: rt.Tensor): void {
    this.state.outputs[name] = tensor;
  }
}

type Shape = { elementType: rt.ElementType; dimensions: rt.Dimensions };

class GraphContext implements rt.GraphContext {
  constructor(
    private state: {
      arguments: Record<string, string>;
      inputs: Record<string, Shape>;
      outputs: Record<string, Shape>;
    }
  ) {}
  getArgument(name: string): string | null {
    return this.state.arguments[name] || null;
  }
  addInputTensor(
    name: string,
    elementType: rt.ElementType,
    dimensions: rt.Dimensions
  ): void {
    this.state.inputs[name] = {
      dimensions,
      elementType,
    };
  }

  addOutputTensor(
    name: string,
    elementType: rt.ElementType,
    dimensions: rt.Dimensions
  ): void {
    this.state.outputs[name] = {
      dimensions,
      elementType,
    };
  }
}
