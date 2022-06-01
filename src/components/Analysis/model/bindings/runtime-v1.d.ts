/**
 * The various types of values a tensor may contain.
 */
export enum ElementType {
  U8 = 0,
  I8 = 1,
  U16 = 2,
  I16 = 3,
  U32 = 4,
  I32 = 5,
  F32 = 6,
  U64 = 7,
  I64 = 8,
  F64 = 9,
  /**
   * A string as UTF-8 encoded bytes.
   */
  Utf8 = 10,
}
/**
 * The dimensions that a tensor may have.
 */
export type Dimensions = DimensionsDynamic | DimensionsFixed;
/**
 * There can be an arbitrary number of dimensions with arbitrary sizes.
 */
export interface DimensionsDynamic {
  tag: "dynamic";
}
/**
 * The tensor has a fixed rank with the provided dimension sizes.
 *
 * If a particular dimension's length is zero, that is interpreted as the
 * dimension being allowed to have any arbitrary length.
 */
export interface DimensionsFixed {
  tag: "fixed";
  val: Uint32Array;
}
/**
 * How will an argument be interpreted?
 *
 * All nodes receive arguments as strings. This enum lets the node hint to the
 * runtime that an argument may be formatted in a particular way.
 */
export enum ArgumentType {
  /**
   * An unsigned integer.
   */
  UnsignedInteger = 0,
  /**
   * An integer, possibly signed.
   */
  Integer = 1,
  /**
   * A decimal number.
   */
  Float = 2,
  /**
   * A short string.
   */
  String = 3,
  /**
   * A multi-line string.
   */
  LongString = 4,
}
/**
 * The shape of a concrete tensor.
 */
export interface Shape {
  elementType: ElementType;
  dimensions: Dimensions;
}
/**
 * A tensor with fixed dimensions.
 */
export interface Tensor {
  /**
   * The type of data this tensor contains.
   */
  elementType: ElementType;
  /**
   * The tensor's dimensions.
   */
  dimensions: Uint32Array;
  /**
   * The raw bytes used by this tensor, as little-endian values.
   *
   * Note: because string tensors are represented using a variable-length
   * encoding where each string is prefixed by its length as a little-endian
   * `u32`.
   */
  buffer: Uint8Array;
}
/**
 * The verbosity level used while logging.
 */
export enum LogLevel {
  Trace = 0,
  Debug = 1,
  Info = 2,
  Warn = 3,
  Error = 4,
  /**
   * An unrecoverable error occurred.
   */
  Fatal = 5,
}
/**
 * A value that can be used when logging structured data.
 */
export type LogValue =
  | LogValueUnit
  | LogValueBoolean
  | LogValueInteger
  | LogValueFloat
  | LogValueString;
export interface LogValueUnit {
  tag: "unit";
}
export interface LogValueBoolean {
  tag: "boolean";
  val: boolean;
}
export interface LogValueInteger {
  tag: "integer";
  val: bigint;
}
export interface LogValueFloat {
  tag: "float";
  val: number;
}
export interface LogValueString {
  tag: "string";
  val: string;
}
/**
 * Metadata for a log event.
 */
export interface LogMetadata {
  name: string;
  target: string;
  level: LogLevel;
  file?: string;
  line?: number;
  module?: string;
}
/**
 * A list of key-value pairs used when logging structured data.
 */
export type LogValueMap = [string, LogValue][];
export function addRuntimeV1ToImports(
  imports: any,
  obj: RuntimeV1,
  get_export: (name: string) => WebAssembly.ExportValue
): void;
export interface RuntimeV1 {
  /**
   * Create a new metadata object with the provided name and version number.
   *
   * The name should typically be one or two words that concisely describe
   * the node and will be used as the human-friendly label shown to users
   * when referring to it.
   */
  metadataNew(name: string, version: string): Metadata;
  /**
   * Create a new named argument.
   */
  argumentMetadataNew(name: string): ArgumentMetadata;
  /**
   * Create a new named tensor.
   */
  tensorMetadataNew(name: string): TensorMetadata;
  /**
   * Hint to the runtime that a tensor may be displayed as an image.
   */
  interpretAsImage(): TensorHint;
  /**
   * Hint to the runtime that a tensor may be interpreted as an audio clip.
   */
  interpretAsAudio(): TensorHint;
  /**
   * Hint that a tensor may have a particular shape and the element types it
   * supports.
   *
   * Note: This hint will be removed in the future in favour of a more flexible
   * mechanism.
   */
  supportedShapes(
    supportedElementTypes: ElementType[],
    dimensions: Dimensions
  ): TensorHint;
  /**
   * Hint to the runtime that an argument may be interpreted as a number in `[min, max]`
   */
  interpretAsNumberInRange(min: string, max: string): ArgumentHint;
  /**
   * Hint to the runtime that an argument may be interpreted as a string in a defined list
   */
  interpretAsStringInEnum(stringEnum: string[]): ArgumentHint;
  /**
   * Hint to the runtime that an argument may be interpreted as a non-negative number
   */
  nonNegativeNumber(): ArgumentHint;
  /**
   * Tell the runtime that this argument may have a certain type.
   */
  supportedArgumentType(hint: ArgumentType): ArgumentHint;
  /**
   * Register a node type with the runtime.
   */
  registerNode(metadata: Metadata): void;
  /**
   * Get the graph context for a particular node.
   *
   * Note: this should only be used from within the `graph()` function.
   */
  graphContextForNode(nodeId: string): GraphContext | null;
  /**
   * Get the kernel context for a particular node.
   *
   * Note: this should only be used from within the `kernel()` function.
   */
  kernelContextForNode(nodeId: string): KernelContext | null;
  /**
   * Check whether a particular message would be logged, allowing the guest to
   * avoid potentially expensive work.
   */
  isEnabled(metadata: LogMetadata): boolean;
  /**
   * Record a log message with some structured data.
   */
  log(metadata: LogMetadata, message: string, data: LogValueMap): void;
  dropMetadata?: (val: Metadata) => void;
  dropArgumentMetadata?: (val: ArgumentMetadata) => void;
  dropTensorMetadata?: (val: TensorMetadata) => void;
  dropTensorHint?: (val: TensorHint) => void;
  dropArgumentHint?: (val: ArgumentHint) => void;
  dropGraphContext?: (val: GraphContext) => void;
  dropKernelContext?: (val: KernelContext) => void;
}
export interface Metadata {
  /**
   * A human-friendly description of the node.
   *
   * The text may include markdown.
   */
  setDescription(description: string): void;
  /**
   * A repository containing this node's source code.
   */
  setRepository(url: string): void;
  /**
   * The node's home page.
   *
   * This will typically point to a `README` file or a page on the internet
   * that users can go to when they want to find out more about the node.
   */
  setHomepage(url: string): void;
  /**
   * Associate this node with a particular tag.
   *
   * Tags are typically used to assist in search and filtering.
   */
  addTag(tag: string): void;
  /**
   * Arguments this node accepts.
   */
  addArgument(arg: ArgumentMetadata): void;
  /**
   * Information about this node's input tensors.
   */
  addInput(metadata: TensorMetadata): void;
  /**
   * Information about this node's output tensors.
   */
  addOutput(metadata: TensorMetadata): void;
}
export interface ArgumentMetadata {
  /**
   * A human-friendly description of the argument.
   *
   * The text may include markdown.
   */
  setDescription(description: string): void;
  /**
   * A useful default value for this argument.
   */
  setDefaultValue(defaultValue: string): void;
  addHint(hint: ArgumentHint): void;
}
export interface TensorMetadata {
  /**
   * A human-friendly description of the tensor.
   *
   * The text may include markdown.
   */
  setDescription(description: string): void;
  /**
   * Add a hint that provides the runtime with contextual information about
   * this node.
   */
  addHint(hint: TensorHint): void;
}
export interface TensorHint {}
export interface ArgumentHint {}
export interface GraphContext {
  /**
   */
  getArgument(name: string): string | null;
  addInputTensor(
    name: string,
    elementType: ElementType,
    dimensions: Dimensions
  ): void;
  addOutputTensor(
    name: string,
    elementType: ElementType,
    dimensions: Dimensions
  ): void;
}
export interface KernelContext {
  /**
   * Get a named argument.
   */
  getArgument(name: string): string | null;
  getInputTensor(name: string): Tensor | null;
  setOutputTensor(name: string, tensor: Tensor): void;
}
