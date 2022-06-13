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
  ProcBlock,
  Dimensions,
  ElementType,
  Tensor,
  TensorDescriptor,
  SupportedArgumentType,
  Tensors,
} from "@hotg-ai/rune";
import { runtime_v1 } from "@hotg-ai/rune-wit-files";
import {
  Property,
  PropertyWithDefaultValue,
  KnownType,
  Component,
  TensorDescriptionModel,
  ElementType as ModelElementType,
} from ".";

export function isTensorHint(item?: any): item is TensorHint {
  return (
    (item && item.type == "supported-shape") || item.type == "interpret-as"
  );
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
  procBlock: ProcBlock,
  url: string
): Component {
  const {
    name,
    version,
    description,
    homepage,
    repository,
    arguments: args,
    inputs,
    outputs,
  } = procBlock.metadata();

  return {
    type: "proc-block",
    displayName: name,
    identifier: url /*`wapm:///${name}?version=${version}`*/,
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

export type ElementTypesTensor = {
  /**
   * A default type of Element Type which will not change
   */
  readonly elementTypes: ModelElementType[];
};

function convertElementTypesTensor(tensor: TensorMetadata): ElementTypesTensor {
  const { hints } = tensor;
  const elementTypes: ModelElementType[] = [];

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

export function convertElementType(ty: ElementType): ModelElementType {
  switch (ty.toString()) {
    case "0":
      return "u8";
    case "1":
      return "i8";
    case "2":
      return "u16";
    case "3":
      return "i16";
    case "4":
      return "u32";
    case "5":
      return "i32";
    case "6":
      return "f32";
    case "7":
      return "u64";
    case "8":
      return "i64";
    case "9":
      return "f64";
    case "10":
      return "utf8";
  }
}

export function modelToTensorElementType(ty: ModelElementType): ElementType {
  switch (ty.toString()) {
    case "utf8":
      return ElementType.Utf8;
      break;
    case "u8":
      return ElementType.U8;
      break;
    case "u16":
      return ElementType.U16;
      break;
    case "u32":
      return ElementType.U32;
      break;
    case "u64":
      return ElementType.U64;
      break;
    case "i8":
      return ElementType.I8;
      break;
    case "i16":
      return ElementType.I16;
      break;
    case "i32":
      return ElementType.I32;
      break;
    case "i64":
      return ElementType.I64;
      break;
    case "f32":
      return ElementType.F32;
      break;
    case "f64":
      return ElementType.F64;
      break;
  }
}

function convertTensors(inputs: TensorMetadata[]): TensorDescriptionModel[] {
  return inputs.map((t) => exampleTensor(t));
}

function exampleTensor({
  name,
  description,
  hints,
}: TensorMetadata): TensorDescriptionModel {
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
): Pick<
  TensorDescriptionModel,
  "dimensions" | "elementType" | "dimensionType"
> {
  let dimensions: number[] = [1];
  let elementType: ModelElementType | undefined;
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
    const prop: PropertyWithDefaultValue = convertDefaults(
      hints,
      defaultValue,
      description
    );

    const property: Property = {
      required: defaultValue ? defaultValue.length > 0 : false,
      description,
      ...prop,
    };

    properties[name] = property;
  }
  // console.log("properties/arguments", args, properties);
  return properties;
}

function convertDefaults(
  typeHint: ArgumentHint[] | undefined,
  defaultValue: string | undefined,
  description: string | undefined
): Property {
  switch (typeHint[0].type) {
    // let property: Property = {
    //   required: true,
    //   defaultValue,
    //   description
    // }
    //"string-enum" | "number-in-range" | "non-negative-number" | "supported-argument-type"
    case "string-enum": {
      let enumValues: KnownType[] = [];
      typeHint[0].possibleValues.forEach((value) =>
        enumValues.push({
          name: value,
          value: parseInt(value),
        })
      );
      return {
        type: "string-enum",
        enumValues,
        defaultValue,
        required: true,
        description,
      };
      break;
    }
    case "non-negative-number": {
      return {
        type: "float",
        defaultValue: parseFloat(defaultValue),
        description,
        required: true,
        valueConstraint: {
          type: "range",
          min: 0,
        },
      };
      break;
    }
    case "number-in-range": {
      return {
        type: "float",
        defaultValue: parseFloat(
          defaultValue || typeHint[0].min || typeHint[0].max
        ),
        description,
        required: true,
        valueConstraint: {
          type: "range",
          min: parseFloat(typeHint[0].min),
          max: parseFloat(typeHint[0].max),
        },
      };
      break;
    }
    case "supported-argument-type": {
      return {
        type: typeHint[0].argumentType === 2 ? "float" : "integer",
        defaultValue:
          typeHint[0].argumentType === 2
            ? parseFloat(defaultValue)
            : parseInt(defaultValue),
        required: true,
        description,
        valueConstraint: {
          type: "range",
          min: typeHint[0].argumentType === 0 ? 0 : undefined,
          max: undefined,
        },
      };
      break;
    }
  }
}
