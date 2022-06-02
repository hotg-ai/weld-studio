import capabilities from "./capabilities";
import models from "./models";
import outputs from "./outputs";

export function prefixKeys(
  items: Record<string, Component>
): Record<string, Component> {
  const properties = Object.entries(items).map(
    ([key, value]) => [`${value.type}/${key}`, value] as const
  );
  return Object.fromEntries(properties);
}

/**
 * Get all the capability, model, proc-block, and output nodes that are known
 * by Rune.
 *
 * Note: it is fine to add/remove nodes, but you may not modify any existing
 * values because they may be shared.
 *
 * @returns a description of known node.
 */
export function builtinComponents(): Record<string, Component> {
  return {
    // ...prefixKeys(capabilities()),
    // ...prefixKeys(procBlo)
    // ...prefixKeys(models()),
    // ...prefixKeys(outputs()),
  };
}

/**
 * Generic Component
 */
export type Component = Capability | Model | ProcBlock | Output;

/**
 * Common fields shared by all nodes.
 */
type Common = {
  /** A human-friendly name that would be shown to a user. */
  readonly displayName: string;
  /** The identifier that would be used in a Runefile. */
  readonly identifier: string;
  /** Where did this component come from? */
  readonly source: "builtin" | "custom";
  /** A human-friendly description that can be shown to a user. */
  readonly description?: string;
  /** A rich/formatted description that can be shown to a user. */
  readonly richDesciption?: string;
  /** Web URL for further information */
  readonly helperUrl?: string;
};

export type Capability = Common & {
  type: "capability";
  /** Properties that may be passed to this capability. */
  readonly properties: Record<string, Property>;
  /**
   * supported input types
   */
  readonly acceptedInputElementTypes?: ElementTypesTensor[];
  /**
   * supported onput types
   */
  readonly acceptedOutputElementTypes?: ElementTypesTensor[];
  /**
   * Based on the property values that have been provided by the UI, what
   * outputs should this node have?
   */
  readonly outputs: CapabilityOutputFunc;
};

/**
 * A machine learning model.
 */
export type Model = Common & {
  type: "model";
  /**
   * A URL the frontend can use to fetch the model.
   */
  readonly downloadURL?: string;
  /**
  /**
   * supported input types
   */
  readonly acceptedInputElementTypes?: ElementTypesTensor[];
  /**
   * supported onput types
   */
  readonly acceptedOutputElementTypes?: ElementTypesTensor[];
  /**
   * Which format is this model stored in?
   */
  readonly format: ModelFormat;
  readonly inputs: Tensor[];
  readonly outputs: Tensor[];
};

export type ModelFormat = "tensorflow-lite";

export type ProcBlock = Common & {
  type: "proc-block";
  /** Properties that may be passed to this proc block. */
  readonly properties: Record<string, Property>;
  // /** data types supported by a particular proc-blocks*/
  // readonly dtype: dtype,
  /**
   * supported input types
   */
  readonly acceptedInputElementTypes?: ElementTypesTensor[];
  /**
   * supported onput types
   */
  readonly acceptedOutputElementTypes?: ElementTypesTensor[];
  /**
   * Calculate this proc block's outputs based on its inputs and provided properties.
   */
  readonly outputs: (
    /**
     * What type of value does this tensor contain?
     */
    // elementType: string,
    inputs: Tensor[],

    properties: PropertyValues
  ) => ProcBlockResult;
  // TODO: The inputs and outputs for a proc-block node should actually be
  // calculated at runtime. However, we need to get things working *now* so
  // we'll hard-code one known good set of inputs/outputs that users can adapt.
  exampleInputs: Tensor[];
  exampleOutputs: Tensor[];
};

export type Output = Common & {
  type: "output";
  /**
   * supported input types
   */
  readonly acceptedInputElementTypes?: ElementTypesTensor[];
  /**
   * supported onput types
   */
  readonly acceptedOutputElementTypes?: ElementTypesTensor[];
  readonly outputs: (
    /**
     * What type of value does this tensor contain?
     */
    // elementType: string,
    inputs: Tensor[],

    properties: PropertyValues
  ) => ProcBlockResult;
  readonly exampleInputs: Tensor[];
};

/**
 * A function which will determine a capability's outputs based on the
 * properties it has been provided.
 *
 * Implementations may assume that all properties have been validated already.
 */
export type CapabilityOutputFunc = (properties: PropertyValues) => Tensor[];

/**
 * The property values associated with a node at runtime.
 */
export type PropertyValues = Record<string, number | string | undefined>;

export type KnownType = {
  name: string;
  value: number;
};

export type PropertyWithDefaultValue =
  | {
      /**
       * What data type are we expecting the user to provide?
       */
      readonly type: "integer" | "float";
      readonly defaultValue: number;
    }
  | {
      /**
       * What data type are we expecting the user to provide?
       */
      readonly type: "string" | "longstring";
      readonly defaultValue: string;
    }
  | {
      /**
       * What data type are we expecting the user to provide?
       */
      readonly type: "string-enum";
      readonly enumValues: KnownType[];
      readonly defaultValue: string;
    };

/**
 * Information about a node's property.
 *
 * This can be used to generate forms and perform validation in the frontend.
 */
export type Property = PropertyWithDefaultValue & {
  /**
   *
   */
  readonly description?: string;
  /**
   * Is this a required property?
   */
  readonly required: boolean;
  /**
   * Additional constraints that may be applied to the property's value.
   */
  readonly valueConstraint?: Constraint;
};

type Constraint = StringEnum | NumberEnum | NumberRange;

/**
 * The property is only allowed to take one of the specified string values.
 */
type StringEnum = {
  readonly type: "string-enum";
  readonly values: string[];
};

/**
 * The property is only allowed to take one of the specified numeric values.
 */
type NumberEnum = {
  readonly type: "number-enum";
  readonly values: number[];
};

/**
 * The property's value must lie within a certain range.
 */
type NumberRange = {
  readonly type: "range";
  readonly min?: number;
  readonly max?: number;
};

/**
 * The type of element a @see Tensor may contain.
 */
export type ElementType =
  | "utf8"
  | "u8"
  | "u16"
  | "u32"
  | "u64"
  | "i8"
  | "i16"
  | "i32"
  | "i64"
  | "f32"
  | "f64";

export const UnsignedIntegers: readonly ElementType[] = [
  "u8",
  "u16",
  "u32",
  "u64",
];
export const SignedIntegers: readonly ElementType[] = [
  "i8",
  "i16",
  "i32",
  "i64",
];
export const Floats: readonly ElementType[] = ["f32", "f64"];
export const NumericTypes: readonly ElementType[] = [
  ...UnsignedIntegers,
  ...SignedIntegers,
  ...Floats,
];
export const AllElementTypes: readonly ElementType[] = [
  ...NumericTypes,
  "utf8",
];

export function IsElementType(name: string): name is ElementType {
  const names: string[] = [...AllElementTypes];
  return names.includes(name);
}

// // A description of a input/output types supported
// export type dtype = {
//   /**
//    * Supported Input types
//    */
//   readonly inputType: string[];
//   /**
//    * The tensor's shape.
//    */
//   readonly outputType: string[];
// };

// A description of a tensor.
export type Tensor = {
  /**
   * What type of value does this tensor contain?
   */
  readonly elementType?: ElementType;
  /**
   * The tensor's shape.
   */
  readonly dimensions: Dimension[];
  /**
   * The tensor's type either dynamic or fixed,
   */
  readonly dimensionType?: string;
  /**
   * An optional name that may be used for display purposes.
   */
  readonly displayName?: string;
  /**
   * An optional description.
   */
  readonly description?: string;
};

export type ElementTypesTensor = {
  /**
   * A default type of Element Type which will not change
   */
  readonly elementTypes: ElementType[];
};

/**
 * The length of a particular dimension in a tensor.
 *
 * This may be "null" if the dimension can have an arbitrary size.
 */
export type Dimension = number | null;

export type ProcBlockResult = ProcBlockOutput | ProcBlockError;
export type ProcBlockOutput = { error: null; tensors: Tensor[] };
export type ProcBlockError =
  | ProcBlockErrorIncorrectValue
  | ProcBlockErrorExpectedOneOf;
export type ProcBlockErrorIncorrectValue = {
  readonly error: "incorrect-value";
  readonly identifier: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly actual: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly expected: any;
};
export type ProcBlockErrorExpectedOneOf = {
  readonly error: "expected-one-of";
  readonly identifier: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly actual: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expected: readonly any[];
};

export const outputProperties: Record<string, Property> = {};

export const modelProperties: Record<string, Property> = {
  "model-format": {
    type: "string",
    required: false,
    description: "The ML framework used to train the model",
    defaultValue: "tensorflow-lite",
    valueConstraint: {
      type: "string-enum",
      values: ["tensorflow-lite"],
    },
  },
};
