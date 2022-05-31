// import * as wit from "@hotg-ai/rune-wit-files";
import {
  Metadata,
  ArgumentMetadata,
  TensorHint,
  ArgumentHint,
  MediaHint,
  Runtime,
  Rune,
  TensorMetadata,
  // ProcBlock,
} from "@hotg-ai/rune";
import { runtime_v1 } from "@hotg-ai/rune-wit-files";
import {
  ProcBlock,
  ElementTypesTensor,
  Property,
  PropertyWithDefaultValue,
  Tensor,
  KnownType,
  ElementType,
} from ".";
import { ArgumentType } from "./bindings/runtime-v1";

export type ProcBlockMetadata = {
  name: string;
  version: string;
  description?: string;
  repository?: string;
  homepage?: string;
  tags: string[];
  arguments: ArgumentMetadata[];
  inputs: Metadata[];
  outputs: Metadata[];
};

// export type ArgumentMetadata = {
//   name: string;
//   description?: string;
//   defaultValue?: string;
//   typeHint?: wit.TypeHint;
// };

// export type MediaHint = {
//   type: "interpret-as";
//   value: {
//     media: "audio" | "image";
//   };
// };

// export type SupportedShapesHint = {
//   type: "supported-shape";
//   value: {
//     accepted_element_types: wit.ElementType[];
//     dimensions: Dimensions;
//   };
// };

export type Dimensions = DimensionsDynamic | DimensionsFixed;

export type DimensionsDynamic = { type: "dynamic" };
export type DimensionsFixed = {
  type: "fixed";
  value: Array<number | null>;
};

// export type TensorHint = MediaHint | SupportedShapesHint;

export function isTensorHint(item?: any): item is TensorHint {
  return (
    (item && item.type == "supported-shape") || item.type == "interpret-as"
  );
}

// export async function extractMetadata(
//   wasm: ArrayBuffer
// ): Promise<ProcBlockMetadata> {
//   const rune = new Rune();

//   // create the imports object that gets passed to our WebAssembly module
//   const imports = {};

//   // // Register our implementation of the "Runtime" interface

//   // wit.addRuntimeV1ToImports(
//   //   imports,
//   //   runtime,
//   //   (name: string) => rune.instance.exports[name]
//   // );

//   console.log("Loading WebAssembly module...");
//   // Only now can we finish initializing our Rune
//   await rune.instantiate(wasm, imports);

//   await rune.load(wasm);
//   try {
//     // ... and tell it to execute the startup code.

//   } catch (e) {
//     console.error("Start failed", e);
//     throw e;
//   }

//   // As part of the proc-block's start() function it should have registered
//   // metadata for a node.
//   if (runtime.metadata) {
//     return runtime.metadata;
//   } else {
//     throw new Error("No metadata was registered");
//   }
// }

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
  meta: Metadata
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
    // exampleInputs: convertTensors(inputs),
    // exampleOutputs: convertTensors(outputs),
    exampleInputs: [],
    exampleOutputs: [],
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
    if (hint.type == "supported-shapes") {
      const convertedTypes = hint.supportedElementTypes.map((ty) => {
        return convertElementType(ty);
      });
      elementTypes.push(...convertedTypes);
    }
  }

  return { elementTypes };
}

function convertElementType(
  ty: ElementType | runtime_v1.ElementType
): ElementType {
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
  const { dimensions, elementType, dimensionType } =
    deriveExampleFromTensorHints(hints);
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
    if (hint.type == "supported-shapes") {
      elementType = convertElementType(hint.supportedElementTypes[0]);

      if (hint.dimensions.tag == "fixed") {
        dimensions = [];
        dimensionType = hint.dimensions.tag;
        hint.dimensions.val.forEach((d) => {
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
    const { hints, name, defaultValue, description } = arg;
    const prop: PropertyWithDefaultValue = convertDefaults(hints, defaultValue);

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
  typeHint: ArgumentHint[] | undefined,
  defaultValue: string | undefined
): Property {
  switch (typeHint[0].type) {
    case "string-enum":
      let enumValues: KnownType[] = [];
      typeHint[0].possibleValues.forEach((value) =>
        enumValues.push({
          name: value,
          value: parseFloat(value),
        })
      );
      return {
        type: "string-enum",
        enumValues,
        defaultValue: enumValues[0].name,
        required: true,
      };
    // case "number-in-range":
    //   return {
    //     valueConstraint: {
    //       type: "range",
    //     },
    //     type: "integer",
    //     defaultValue: defaultValue ? parseInt(defaultValue) : 0,
    //   };
    // case "non-negative-number":
    //   return { type: "integer", defaultValue: defaultValue || "" };
    // case "supported-argument-type":
    //   return { type: "longstring", defaultValue: defaultValue || "" };
  }
}

// class Runtime implements wit.RuntimeV1 {
//   metadata?: ProcBlockMetadata;

//   metadataNew(name: string, version: string): ProcBlockMetadataWrapper {
//     return new ProcBlockMetadataWrapper(name, version);
//   }

//   argumentMetadataNew(name: string): ArgumentMetadataWrapper {
//     return new ArgumentMetadataWrapper(name);
//   }

//   tensorMetadataNew(name: string): TensorMetadataWrapper {
//     return new TensorMetadataWrapper(name);
//   }

//   interpretAsImage(): TensorHint {
//     return { type: "interpret-as", value: { media: "image" } };
//   }

//   interpretAsAudio(): TensorHint {
//     return { type: "interpret-as", value: { media: "audio" } };
//   }

//   // supportedShapes(
//   //   supportedElementTypes: wit.ElementType[],
//   //   dimensions: wit.Dimensions
//   // ): TensorHint {
//   //   let dims: Dimensions;

//   //   switch (dimensions.tag) {
//   //     case "dynamic":
//   //       dims = { type: "dynamic" };
//   //       break;
//   //     case "fixed":
//   //       const dimensionLengths = [...dimensions.val];
//   //       dims = {
//   //         type: "fixed",
//   //         value: dimensionLengths.map((d) => (d == 0 ? null : d)),
//   //       };
//   //       break;
//   //   }

//   //   return {
//   //     type: "supported-shape",
//   //     value: {
//   //       accepted_element_types: supportedElementTypes,
//   //       dimensions: dims,
//   //     },
//   //   };
//   // }

//   // registerNode(m: wit.Metadata) {
//   //   if (m instanceof ProcBlockMetadataWrapper) {
//   //     this.metadata = m.metadata;
//   //   } else {
//   //     throw new Error("Unreachable");
//   //   }
//   // }
// }
