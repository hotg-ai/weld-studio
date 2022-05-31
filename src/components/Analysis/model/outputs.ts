import { Output, ProcBlockOutput, Tensor } from ".";

function success(...tensors: Tensor[]): ProcBlockOutput {
  return {
    error: null,
    tensors
  };
}

const serial: Output = {
  type: "output",
  displayName: "Output",
  identifier: "SERIAL",
  source: "builtin",
  description:
    "Mechanism used to pass information processed by the Rune to the outside world (e.g. the host application)",
  acceptedInputElementTypes: [
    {
      elementTypes: [
        "u8",
        "u16",
        "u32",
        "u64",
        "i8",
        "i16",
        "i32",
        "i64",
        "f32",
        "f64",
        "utf8"
      ]
    }
  ],
  exampleInputs: [
    {
      elementType: "utf8",
      dimensions: [1],
      dimensionType: "dynamic"
    }
  ],
  outputs: inputs => success(...inputs)
};

export default function outputs(): Record<string, Output> {
  return { serial };
}
