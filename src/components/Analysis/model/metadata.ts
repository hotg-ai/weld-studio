import * as wit from "@hotg-ai/rune-wit-files";

import {
  ElementType,
  ElementTypesTensor,
  ProcBlock,
  Property,
  PropertyWithDefaultValue,
  Tensor,
} from ".";

export type ProcBlockMetadata = {
  name: string;
  version: string;
  description?: string;
  repository?: string;
  homepage?: string;
  tags: string[];
  arguments: ArgumentMetadata[];
  inputs: TensorMetadata[];
  outputs: TensorMetadata[];
};

export type TensorMetadata = {
  name: string;
  description?: string;
  hints: TensorHint[];
};

export type ArgumentMetadata = {
  name: string;
  description?: string;
  defaultValue?: string;
  typeHint?: wit.TypeHint;
};

export type MediaHint = {
  type: "interpret-as";
  value: {
    media: "audio" | "image";
  };
};

export type SupportedShapesHint = {
  type: "supported-shape";
  value: {
    accepted_element_types: wit.ElementType[];
    dimensions: Dimensions;
  };
};

export type Dimensions = DimensionsDynamic | DimensionsFixed;

export type DimensionsDynamic = { type: "dynamic" };
export type DimensionsFixed = {
  type: "fixed";
  value: Array<number | null>;
};

export type TensorHint = MediaHint | SupportedShapesHint;

export function isTensorHint(item?: any): item is TensorHint {
  return (
    (item && item.type == "supported-shape") || item.type == "interpret-as"
  );
}

export async function extractMetadata(
  wasm: ArrayBuffer
): Promise<ProcBlockMetadata> {
  const rune = new wit.RuneV1();

  // create the imports object that gets passed to our WebAssembly module
  const imports = {};

  // Register our implementation of the "Runtime" interface
  const runtime = new Runtime();
  wit.addRuntimeV1ToImports(
    imports,
    runtime,
    (name: string) => rune.instance.exports[name]
  );

  console.log("Loading WebAssembly module...");
  // Only now can we finish initializing our Rune
  await rune.instantiate(wasm, imports);

  try {
    // ... and tell it to execute the startup code.
    rune.start();
  } catch (e) {
    console.error("Start failed", e);
    throw e;
  }

  // As part of the proc-block's start() function it should have registered
  // metadata for a node.
  if (runtime.metadata) {
    return runtime.metadata;
  } else {
    throw new Error("No metadata was registered");
  }
}

/**
 * Try to convert the proc-block metadata into its corresponding component
 * for consumption by the UI.
 *
 * @param componentName
 * @param m
 * @returns
 */
export function metadataToComponent(
  componentName: string,
  meta: ProcBlockMetadata
): ProcBlock {
  const {
    name,
    version,
    description,
    homepage,
    repository,
    arguments: args,
    inputs,
    outputs,
  } = meta;
  return {
    type: "proc-block",
    displayName: name,
    // Note: we are hard-coding the hotg-ai/proc-blocks repository and the
    // fact that we'll give version 1.2.3 the tag v1.2.3
    identifier: `hotg-ai/proc-blocks@v${version}#${componentName}`,
    description: stripMarkdown(description),
    richDesciption: description,
    source: "builtin",
    helperUrl: homepage || repository,
    acceptedInputElementTypes: convertElementTypesTensors(inputs),
    acceptedOutputElementTypes: convertElementTypesTensors(outputs),
    exampleInputs: convertTensors(inputs),
    exampleOutputs: convertTensors(outputs),
    properties: convertArguments(args),
    outputs: () => {
      throw new Error();
    },
  };
}

function stripMarkdown(description: string | undefined): string | undefined {
  if (!description) {
    return undefined;
  }

  // TODO: actually remove the markdown so we get an unformatted string
  return description;
}

function convertElementTypesTensors(
  inputs: TensorMetadata[]
): ElementTypesTensor[] {
  return inputs.map(convertElementTypesTensor);
}

function convertElementTypesTensor(tensor: TensorMetadata): ElementTypesTensor {
  const { hints } = tensor;
  const elementTypes: ElementType[] = [];

  for (const hint of hints) {
    if (hint.type == "supported-shape") {
      const convertedTypes = hint.value.accepted_element_types.map((ty) => {
        return convertElementType(ty);
      });
      elementTypes.push(...convertedTypes);
    }
  }

  return { elementTypes };
}

function convertElementType(ty: wit.ElementType): ElementType {
  switch (ty.toString()) {
    case "u8":
      return "u8";
    case "i8":
      return "i8";
    case "u16":
      return "u16";
    case "i16":
      return "i16";
    case "u32":
      return "u32";
    case "i32":
      return "i32";
    case "f32":
      return "f32";
    case "u64":
      return "u64";
    case "i64":
      return "i64";
    case "f64":
      return "f64";
    case "utf8":
      return "utf8";
  }
  return "utf8";
}

function convertTensors(inputs: TensorMetadata[]): Tensor[] {
  return inputs.map((t) => exampleTensor(t));
}

function exampleTensor({ name, description, hints }: TensorMetadata): Tensor {
  const {
    dimensions,
    elementType,
    dimensionType,
  } = deriveExampleFromTensorHints(hints);
  return {
    displayName: name,
    description,
    dimensions,
    dimensionType,
    elementType,
  };
}

function deriveExampleFromTensorHints(
  hints: TensorHint[]
): Pick<Tensor, "dimensions" | "elementType" | "dimensionType"> {
  let dimensions: number[] = [1];
  let elementType: ElementType | undefined;
  let dimensionType = "fixed";
  for (const hint of hints) {
    if (hint.type == "supported-shape") {
      elementType = convertElementType(hint.value.accepted_element_types[0]);
      dimensionType = hint.value.dimensions.type;
      if (hint.value.dimensions.type == "fixed") {
        dimensions = [];

        hint.value.dimensions.value.forEach((d) => {
          if (typeof d == "number") {
            dimensions.push(d);
          } else {
            // Note: This dimension may have an arbitrary length,
            // but because we need to provide *something* we'll use
            // 0 as a default.
            dimensions.push(0);
          }
        });
      }
    }
  }

  return { dimensions, elementType, dimensionType };
}

function convertArguments(args: ArgumentMetadata[]): Record<string, Property> {
  const properties: Record<string, Property> = {};

  for (const arg of args) {
    const { typeHint, name, defaultValue, description } = arg;
    const prop: PropertyWithDefaultValue = convertDefaults(
      typeHint,
      defaultValue
    );

    const property: Property = {
      required: defaultValue ? defaultValue.length > 0 : false,
      description,
      ...prop,
    };

    properties[name] = property;
  }

  return properties;
}

function convertDefaults(
  typeHint: wit.TypeHint | undefined,
  defaultValue: string | undefined
): PropertyWithDefaultValue {
  switch (typeHint) {
    case wit.TypeHint.Float:
      return {
        type: "float",
        defaultValue: defaultValue ? parseFloat(defaultValue) : 0,
      };
    case wit.TypeHint.Integer:
      return {
        type: "integer",
        defaultValue: defaultValue ? parseInt(defaultValue) : 0,
      };
    case wit.TypeHint.OnelineString:
      return { type: "string", defaultValue: defaultValue || "" };
    case wit.TypeHint.MultilineString:
      return { type: "longstring", defaultValue: defaultValue || "" };
    case undefined:
      return { type: "string", defaultValue: "" };
  }
}

class ArgumentMetadataWrapper implements wit.ArgumentMetadata {
  metadata: ArgumentMetadata;

  constructor(name: string) {
    this.metadata = { name };
  }

  setDescription(description: string) {
    this.metadata.description = description;
  }

  setDefaultValue(defaultValue: string) {
    this.metadata.defaultValue = defaultValue;
  }

  setTypeHint(hint: wit.TypeHint) {
    this.metadata.typeHint = hint;
  }
}

class TensorMetadataWrapper implements wit.TensorMetadata {
  metadata: TensorMetadata;

  constructor(name: string) {
    this.metadata = { name, hints: [] };
  }

  setDescription(description: string) {
    this.metadata.description = description;
  }

  addHint(hint: wit.TensorHint) {
    if (isTensorHint(hint)) {
      this.metadata.hints.push(hint);
    } else {
      throw new Error("Unreachable");
    }
  }
}

class ProcBlockMetadataWrapper implements wit.Metadata {
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

  addArgument(arg: wit.ArgumentMetadata) {
    if (arg instanceof ArgumentMetadataWrapper) {
      this.metadata.arguments.push(arg.metadata);
    } else {
      throw new Error("Unreachable");
    }
  }

  addInput(tensor: wit.TensorMetadata) {
    if (tensor instanceof TensorMetadataWrapper) {
      this.metadata.inputs.push(tensor.metadata);
    } else {
      throw new Error("Unreachable");
    }
  }

  addOutput(tensor: wit.TensorMetadata) {
    if (tensor instanceof TensorMetadataWrapper) {
      this.metadata.outputs.push(tensor.metadata);
    } else {
      throw new Error("Unreachable");
    }
  }
}

class Runtime implements wit.RuntimeV1 {
  metadata?: ProcBlockMetadata;

  metadataNew(name: string, version: string): ProcBlockMetadataWrapper {
    return new ProcBlockMetadataWrapper(name, version);
  }

  argumentMetadataNew(name: string): ArgumentMetadataWrapper {
    return new ArgumentMetadataWrapper(name);
  }

  tensorMetadataNew(name: string): TensorMetadataWrapper {
    return new TensorMetadataWrapper(name);
  }

  interpretAsImage(): TensorHint {
    return { type: "interpret-as", value: { media: "image" } };
  }

  interpretAsAudio(): TensorHint {
    return { type: "interpret-as", value: { media: "audio" } };
  }

  supportedShapes(
    supportedElementTypes: wit.ElementType[],
    dimensions: wit.Dimensions
  ): TensorHint {
    let dims: Dimensions;

    switch (dimensions.tag) {
      case "dynamic":
        dims = { type: "dynamic" };
        break;
      case "fixed":
        const dimensionLengths = [...dimensions.val];
        dims = {
          type: "fixed",
          value: dimensionLengths.map((d) => (d == 0 ? null : d)),
        };
        break;
    }

    return {
      type: "supported-shape",
      value: {
        accepted_element_types: supportedElementTypes,
        dimensions: dims,
      },
    };
  }

  registerNode(m: wit.Metadata) {
    if (m instanceof ProcBlockMetadataWrapper) {
      this.metadata = m.metadata;
    } else {
      throw new Error("Unreachable");
    }
  }
}
