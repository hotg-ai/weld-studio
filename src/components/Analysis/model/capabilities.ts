/* eslint-disable no-magic-numbers, @typescript-eslint/no-use-before-define */

import { Capability } from ".";

const image: Capability = {
  type: "capability",
  displayName: "Image",
  identifier: "IMAGE",
  source: "builtin",
  properties: {
    width: {
      type: "integer",
      required: true,
      defaultValue: 256,
      description: "image width"
    },
    height: {
      type: "integer",
      required: true,
      defaultValue: 256,
      description: "image height"
    },
    pixel_format: {
      type: "string-enum",
      required: true,
      defaultValue: "@PixelFormat::RGB",
      enumValues: [
        { name: "@PixelFormat::RGB", value: 3 },
        { name: "@PixelFormat::Grayscale", value: 1 }
      ],
      description:
        "Choose '@PixelFormat::RGB' if the image is RGB (channel 3); Choose '@PixelFormat::GrayScale' if the image is GrayScale (channel 1)"
    },
    source: {
      type: "integer",
      required: true,
      defaultValue: 0,
      description:
        "Specify which input to use when multiple inputs are provided"
    }
  },
  description: "Adds image or streaming video capability",
  acceptedOutputElementTypes: [{ elementTypes: ["u8"] }],
  outputs: p => {
    const { pixel_format, width, height } = p;

    if (
      typeof width !== "number" ||
      typeof height !== "number" ||
      typeof pixel_format !== "string"
    ) {
      throw new Error();
    }

    const knownPixelFormats: Partial<Record<string, number>> = {
      "@PixelFormat::GrayScale": 1,
      "@PixelFormat::RGB": 3
    };

    const channels = knownPixelFormats[pixel_format];
    if (!channels) {
      throw new Error();
    }

    return [
      {
        elementType: "u8",
        defaultElementType: ["u8"],
        dimensions: [1, width, height, channels],
        displayName: "image",
        description:
          "Takes a u8 RGB or GrayScale as input. Fill the dimensions in this format [1, image height, image width, 3 (if RGB)/ 1 (if GrayScale)]",
        dimensionType: "fixed"
      }
    ];
  }
};

const accel: Capability = {
  type: "capability",
  displayName: "Accelerometer",
  identifier: "ACCEL",
  source: "builtin",
  properties: {
    n: {
      type: "integer",
      description: "The number of samples",
      required: true,
      defaultValue: 1000
    },
    source: {
      type: "integer",
      required: true,
      defaultValue: 0,
      description:
        "Specify which input to use when multiple inputs are provided"
    }
  },
  description:
    "Adds capability to read samples from an accelerometer as 3 `f32`s, X, Y, and Z",
  acceptedOutputElementTypes: [{ elementTypes: ["f32"] }],
  outputs: p => {
    const { n } = p;
    if (typeof n !== "number") {
      throw new Error();
    }
    return [
      {
        elementType: "f32",
        defaultElementType: ["f32"],
        dimensions: [1, n, 3, 1],
        displayName: "motion_stream",
        description: "Batch output from a accelerometer (x,y,z) capability",
        dimensionType: "fixed"
      }
    ];
  }
};

const sound: Capability = {
  type: "capability",
  displayName: "Sound",
  identifier: "SOUND",
  source: "builtin",
  properties: {
    hz: {
      type: "integer",
      required: true,
      description: "The sample rate in Hz",
      defaultValue: 16000
    },
    sample_duration_ms: {
      type: "integer",
      required: true,
      description: "The sample duration in milliseconds",
      defaultValue: 1000
    },
    source: {
      type: "integer",
      required: true,
      defaultValue: 0,
      description:
        "Specify which input to use when multiple inputs are provided"
    }
  },
  description:
    "Adds capability to read 16-bit Pulse Code Modulated audio samples",
  acceptedOutputElementTypes: [{ elementTypes: ["i16"] }],
  outputs: p => {
    const { hz, sample_duration_ms } = p;
    if (typeof hz !== "number" || typeof sample_duration_ms !== "number") {
      throw new Error();
    }

    return [
      {
        elementType: "i16",
        defaultElementType: ["i16"],
        dimensions: [Math.round((hz * sample_duration_ms) / 1000)],
        displayName: "sound",
        description:
          "Pulse-code modulated output from a sound/audio capability",
        dimensionType: "fixed"
      }
    ];
  }
};

const raw: Capability = {
  type: "capability",
  displayName: "Binary (U8IntArray)",
  identifier: "RAW",
  source: "builtin",
  properties: {
    length: {
      type: "integer",
      defaultValue: 1,
      required: true,
      description: "Length of raw data in bytes"
    },
    source: {
      type: "integer",
      required: true,
      defaultValue: 0,
      description:
        "Specify which input to use when multiple inputs are provided"
    }
  },
  description:
    "Adds capability to read raw data from an opaque user-specified source",
  outputs: p => {
    const { length } = p;
    if (typeof length !== "number") {
      throw new Error();
    }

    return [
      {
        elementType: "u8",
        dimensions: [length],
        displayName: "data",
        description: "Raw output from Binary Capability",
        dimensionType: "fixed"
      }
    ];
  }
};

const random: Capability = {
  type: "capability",
  displayName: "Random",
  identifier: "RAND",
  source: "builtin",
  properties: {
    // amount: {
    //   type: "integer",
    //   defaultValue: 1,
    //   required: true
    // },
  },
  description:
    "Random data generated from the runtime's random number generator",
  acceptedOutputElementTypes: [
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
        "f64"
      ]
    }
  ],
  outputs: p => {
    // Note: We removed the "amount" parameter from the UI in #106 to deal with
    // #107, so for now we hard-code the dimensions instead of deriving them.

    // const { amount } = p;
    // if (typeof amount !== "number") {
    //   throw new Error(`The "amount" should be a number, but received "${typeof amount}"`);
    // }
    // const dimensions = [amount];
    const dimensions = [1];

    return [
      {
        elementType: "i32",
        defaultElementType: [
          "u8",
          "u16",
          "u32",
          "u64",
          "i8",
          "i16",
          "i32",
          "i64",
          "f32",
          "f64"
        ],
        dimensions,
        displayName: "rng",
        description: "Random number from RAND Capability",
        dimensionType: "fixed"
      }
    ];
  }
};

export default function capabilities(): Record<string, Capability> {
  return { accel, raw, image, sound, random };
}
