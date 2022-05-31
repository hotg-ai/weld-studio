/* eslint-disable no-magic-numbers */

import { Model } from ".";

// The general process for adding a new model is as follows:
//
// 1. Find a model you like
// 2. Download the model, making sure to save the URL somewhere
// 3. Run "rune model-info" on the model to see its inputs/outputs
// 4. Create a new Mode constant for that model and populate its fields
// 5. Add the model to the list returned by models()

const mobileBert: Model = {
  type: "model",
  displayName: "Mobile Bert",
  description:
    "4.3x smaller and 5.5x faster than BERT-Base while achieving competitive results, suitable for on-device scenario",
  helperUrl:
    "https://github.com/hotg-ai/test-runes/blob/master/nlp/bert/Mobilebert_Question_Answer_Model_Maker.ipynb",
  identifier: "models/mobilebert_1_default_1.tflite",
  downloadURL: "https://assets.hotg.ai/models/tflite/mobilebert.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "i32",
      dimensions: [1, 384],
      displayName: "input_ids",
      description: "Tokenized inputs",
      dimensionType: "fixed"
    },
    {
      elementType: "i32",
      dimensions: [1, 384],
      displayName: "input_mask",
      description: "Masked inputs",
      dimensionType: "fixed"
    },
    {
      elementType: "i32",
      dimensions: [1, 384],
      displayName: "segment_ids",
      description: "Segmented inputs",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "f32",
      dimensions: [1, 384],
      displayName: "end_logits",
      description: "logits where string ends",
      dimensionType: "fixed"
    },
    {
      elementType: "f32",
      dimensions: [1, 384],
      displayName: "start_logits",
      description: "logits where strings starts",
      dimensionType: "fixed"
    }
  ]
};

// eslint-disable-next-line
const yamnet: Model = {
  type: "model",
  displayName: "YamNET",
  description:
    "a pre-trained deep neural network that can predict audio events from 521 classes, such as laughter, barking, or a siren.",
  helperUrl:
    "https://github.com/tensorflow/hub/blob/master/examples/colab/yamnet.ipynb",
  identifier: "models/yamnet.tflite",
  format: "tensorflow-lite",
  downloadURL:
    "https://raw.githubusercontent.com/hotg-ai/test-runes/master/audio/yamnet/yamnet.tflite",
  source: "builtin",
  inputs: [
    {
      elementType: "f32",
      dimensions: [1, 15600],
      displayName: "input_1",
      description: "Audio Feature Input",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "f32",
      dimensions: [1, 521],
      displayName: "Identity",
      dimensionType: "fixed"
    },
    {
      elementType: "f32",
      dimensions: [96, 64],
      displayName: "Identity_1",
      dimensionType: "fixed"
    }
  ]
};

const stylePredict: Model = {
  type: "model",
  displayName: "Style Predict",
  description:
    "Model that takes a stylish image as input and extracts style from that image as the style vector.",
  identifier: "models/style_predict.tflite",
  downloadURL: "https://assets.hotg.ai/models/tflite/style_predict.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "f32",
      dimensions: [1, 256, 256, 3],
      displayName: "style_image",
      description: "RGB 256x256 image",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "f32",
      dimensions: [1, 1, 1, 100],
      displayName: "style_vector",
      description: "Vectorized style of the input image",
      dimensionType: "fixed"
    }
  ]
};

const styleTransfer: Model = {
  type: "model",
  displayName: "Style Transfer",
  description:
    "Model to create a new image, known as a pastiche, based on two input images: one representing the artistic style and one representing the content",
  helperUrl:
    "https://github.com/tensorflow/tensorflow/blob/master/tensorflow/lite/g3doc/examples/style_transfer/overview.ipynb",
  identifier: "models/style_transform.tflite",
  downloadURL: "https://assets.hotg.ai/models/tflite/style_transform.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "f32",
      dimensions: [1, 384, 384, 3],
      displayName: "content_image",
      description: "Image to transform with style_vector",
      dimensionType: "fixed"
    },
    {
      elementType: "f32",
      dimensions: [1, 1, 1, 100],
      displayName: "mobilenet_conv/Conv/BiasAdd",
      description: "Vectorized style of the input image",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "f32",
      dimensions: [1, 384, 384, 3],
      displayName: "stylize_normalized_image",
      description: "RGB 384x384 image",
      dimensionType: "fixed"
    }
  ]
};

const personDetection: Model = {
  type: "model",
  displayName: "Person Detection",
  identifier: "models/person-detection.tflite",
  downloadURL: "https://assets.hotg.ai/models/tflite/food.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "u8",
      dimensions: [1, 96, 96, 1],
      displayName: "input",
      description: "A grayscale 96x96 image",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "u8",
      dimensions: [1, 1, 1, 3],
      displayName:
        "MobilenetV1/Logits/Conv2d_1c_1x1/act_quant/FakeQuantWithMinMaxVars",
      description: "prediction score for labels (Unknown, Person, Not_person) ",
      dimensionType: "fixed"
    }
  ]
};

const inception: Model = {
  type: "model",
  displayName: "Inception",
  description: "Really tiny Image Classification Model",
  identifier: "models/inception_v3_quant.tflite",
  downloadURL: "https://assets.hotg.ai/models/tflite/inception_v3.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "u8",
      dimensions: [1, 299, 299, 3],
      displayName: "input",
      description: "299x299 RGB image",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "u8",
      dimensions: [1, 1001],
      displayName: "prediction_vectors",
      description: "prediction score for labels",
      dimensionType: "fixed"
    }
  ]
};

const food: Model = {
  type: "model",
  displayName: "Food",
  description: "Food/Dish detection Model",
  helperUrl: "",
  identifier: "models/food.tflite",
  downloadURL: "https://assets.hotg.ai/models/tflite/food.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "u8",
      dimensions: [1, 192, 192, 3],
      displayName: "image",
      description: "192x192 RGB image",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "u8",
      dimensions: [1, 2024],
      displayName: "MobilenetV1/Predictions/Softmax",
      description: "prediction score for labels",
      dimensionType: "fixed"
    }
  ]
};

const microspeech: Model = {
  type: "model",
  displayName: "Microspeech",
  description: "Really tiny hot keyword detection model",
  helperUrl: "",
  identifier: "models/microspeech.tflite",
  downloadURL: "https://assets.hotg.ai/models/tflite/microspeech.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "i8",
      dimensions: [1, 1960],
      displayName: "Reshape",
      description: "Spectrum",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "i8",
      dimensions: [1, 6],
      displayName: "labels_softmax",
      description: "prediction score for labels",
      dimensionType: "fixed"
    }
  ]
};

const bird_classification: Model = {
  type: "model",
  displayName: "Bird Classifier",
  description: "Mobile Bird Classification Model",
  helperUrl:
    "https://tfhub.dev/google/lite-model/aiy/vision/classifier/birds_V1/3",
  identifier: "models/lite-model_aiy_vision_classifier_birds_V1_3.tflite",
  downloadURL: "https://assets.hotg.ai/models/tflite/bird_classifier.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "u8",
      dimensions: [1, 224, 224, 3],
      displayName: "input",
      description: "a 22x224 RGB image",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "u8",
      dimensions: [1, 965],
      displayName: "output",
      description: "prediction score for labels",
      dimensionType: "fixed"
    }
  ]
};

const cartoonGAN: Model = {
  type: "model",
  displayName: "CartoonGAN",
  description:
    "TF Lite quantized version of the CartoonGAN model for cartoonizing images",
  helperUrl: "https://tfhub.dev/sayakpaul/lite-model/cartoongan/dr/1",
  identifier: "models/cartoongan_dr_1.tflite",
  downloadURL: "https://assets.hotg.ai/models/tflite/cartoongan.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "f32",
      dimensions: [1, 512, 512, 3],
      displayName: "input",
      description: "a 512x512 RGB image",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "f32",
      dimensions: [1, 512, 512, 3],
      displayName: "output",
      description: "512x512 RGB image",
      dimensionType: "fixed"
    }
  ]
};

const deepLab: Model = {
  type: "model",
  displayName: "Deep Lab",
  description: "Deep learning model for semantic image segmentation",
  helperUrl: "https://tfhub.dev/tensorflow/lite-model/deeplabv3/1/metadata/2",
  identifier: "models/deeplabv3.tflite",
  downloadURL: "https://assets.hotg.ai/models/tflite/deeplab.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "f32",
      dimensions: [1, 257, 257, 3],
      displayName: "input",
      description:
        "Input image to be segmented. The expected image is 257 x 257, with three channels (red, blue, and green) per pixel. Each element in the tensor is a value between -1 and 1.",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "f32",
      dimensions: [1, 257, 257, 21],
      displayName: "output",
      description: "Masks over the target objects with high accuracy.",
      dimensionType: "fixed"
    }
  ]
};

const eastTextDetector: Model = {
  type: "model",
  displayName: "East Text Detector",
  description: "EAST model for text detection from natural scenes",
  helperUrl:
    "https://colab.research.google.com/github/sayakpaul/Adventures-in-TensorFlow-Lite/blob/master/EAST_TFLite.ipynb",
  identifier: "models/east-text-detector_fp16_1.tflite",
  downloadURL:
    "https://assets.hotg.ai/models/tflite/craft_text_detector.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "f32",
      dimensions: [1, 320, 320, 3],
      displayName: "input",
      description: "320x320 RGB image",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "f32",
      dimensions: [1, 80, 80, 1],
      displayName: "feature_fusion/Conv_7/Sigmoid",
      description: "80x80 GrayScale image",
      dimensionType: "fixed"
    },
    {
      elementType: "f32",
      dimensions: [1, 80, 80, 5],
      displayName: "feature_fusion/concat_3",
      description:
        "rank 5 tensor with bounding box coordinates and output probabilities of text",
      dimensionType: "fixed"
    }
  ]
};

const efficientDet: Model = {
  type: "model",
  displayName: "EfficientDet",
  description: "A custom object detection model",
  helperUrl:
    "https://github.com/tensorflow/tensorflow/blob/master/tensorflow/lite/g3doc/tutorials/model_maker_object_detection.ipynb",
  identifier: "models/efficientdet_lite4_detection_default_2.tflite",
  downloadURL:
    "https://raw.githubusercontent.com/hotg-ai/test-runes/master/image/efficientdet_lite4_detection/efficientdet_lite4_detection_default_2.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "u8",
      dimensions: [1, 640, 640, 3],
      displayName: "input",
      description: "a 640x640 RGB image",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "f32",
      dimensions: [1, 25, 4],
      displayName: "detection_boxes",
      description: "bounding box coordinates",
      dimensionType: "fixed"
    },
    {
      elementType: "f32",
      dimensions: [1, 25],
      displayName: "detection_scores",
      description: "class index from the label file",
      dimensionType: "fixed"
    },
    {
      elementType: "f32",
      dimensions: [1, 25],
      displayName: "detection_classes",
      description: "bounding probabilities",
      dimensionType: "fixed"
    },
    {
      elementType: "f32",
      dimensions: [1],
      displayName: "num_detections",
      description: "number of detections",
      dimensionType: "fixed"
    }
  ]
};

const efficientNet: Model = {
  type: "model",
  displayName: "EfficientNet",
  description: "Image Classification Model",
  helperUrl:
    "https://github.com/tensorflow/tensorflow/blob/master/tensorflow/lite/g3doc/tutorials/model_maker_image_classification.ipynb",
  identifier: "models/lite-model_efficientnet_lite0_uint8_2.tflite",
  downloadURL:
    "https://raw.githubusercontent.com/hotg-ai/test-runes/master/image/efficientnet/lite-model_efficientnet_lite0_uint8_2.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "u8",
      dimensions: [1, 224, 224, 3],
      displayName: "input",
      description:
        " a 240 x 240 RGB image with three channels (red, blue, and green) per pixel. ",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "u8",
      dimensions: [1, 1000],
      displayName: "feature_fusion/Conv_7/Sigmoid",
      description: "Probabilities of the 1000 labels respectively",
      dimensionType: "fixed"
    }
  ]
};

const esrGAN: Model = {
  type: "model",
  displayName: "EsrGAN",
  description:
    "Model for recovering a high resolution (HR) image from its low resolution counterpart",
  helperUrl:
    "https://github.com/tensorflow/tensorflow/blob/master/tensorflow/lite/g3doc/examples/super_resolution/overview.ipynb",
  identifier: "models/esrgan-tf2_1.tflite",
  downloadURL: "https://assets.hotg.ai/models/tflite/esrgan.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "f32",
      dimensions: [1, 50, 50, 3],
      displayName: "input",
      description: "a 50x50 low-resolution RGB image",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "f32",
      dimensions: [1, 200, 200, 3],
      displayName: "LightEnhancer",
      description: "a high resolution 200x200 RGB image",
      dimensionType: "fixed"
    }
  ]
};

const gestureRecognition: Model = {
  type: "model",
  displayName: "Gesture Recognition",
  identifier: "models/gesture-up-down.tflite",
  description:
    "A pre-trained network that can recognize Thumbs-Up and Thumbs-Down signs",
  // helperUrl: "",
  downloadURL:
    "https://assets.hotg.ai/models/tflite/gesture_recognition.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "f32",
      dimensions: [1, 224, 224, 3],
      displayName: "input",
      description: "224x224 RGB image",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "f32",
      dimensions: [1, 2],
      displayName: "output",
      description: "Confidence scores for each label",
      dimensionType: "fixed"
    }
  ]
};

const midas: Model = {
  type: "model",
  displayName: "Midas",
  description:
    "Mobile real-time convolutional neural network for monocular depth estimation from a single RGB image",
  helperUrl: "https://tfhub.dev/intel/lite-model/midas/v2_1_small/1/lite/1",
  identifier: "models/midas_v2_1_small_1_lite_1.tflite",
  downloadURL:
    "https://raw.githubusercontent.com/hotg-ai/test-runes/master/image/midas/midas_v2_1_small_1_lite_1.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "f32",
      dimensions: [1, 256, 256, 3],
      displayName: "input",
      description: "a 256x256 RGB image",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "f32",
      dimensions: [1, 256, 256, 1],
      displayName: "LightEnhance",
      description: "inverse depth maps",
      dimensionType: "fixed"
    }
  ]
};

const mirnet: Model = {
  type: "model",
  displayName: "MIRNet",
  description: "Model for low-light image enhancement",
  helperUrl:
    "https://colab.research.google.com/github/keras-team/keras-io/blob/master/examples/vision/ipynb/mirnet.ipynb",
  identifier: "models/mirnet-fixed_fp16_1.tflite",
  downloadURL: "https://assets.hotg.ai/models/tflite/mirnet.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "f32",
      dimensions: [1, 400, 400, 3],
      displayName: "input",
      description:
        "The expected image is 400 x 400, with three channels (red, blue, and green) per pixel. Each value in the tensor is between 0 and 1.",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "f32",
      dimensions: [1, 400, 400, 3],
      displayName: "LightEnhancer",
      description: "Image enhanced",
      dimensionType: "fixed"
    }
  ]
};

const mobileObjectLocalizer: Model = {
  type: "model",
  displayName: "Mobile Object Localizer",
  identifier: "models/object_localizer_v1_1_default_1.tflite",
  downloadURL:
    "https://raw.githubusercontent.com/hotg-ai/test-runes/master/image/mobile_object_localizer_v1/object_localizer_v1_1_default_1.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "u8",
      dimensions: [1, 192, 192, 3],
      displayName: "input",
      description: "a 192x192 RGB image",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "f32",
      dimensions: [1, 100, 4],
      displayName: "detection_boxes",
      description: "Bounding box for each detection",
      dimensionType: "fixed"
    },
    {
      elementType: "f32",
      dimensions: [1, 100],
      displayName: "detection_classes",
      description: " Object class for each detection",
      dimensionType: "fixed"
    },
    {
      elementType: "f32",
      dimensions: [1, 100],
      displayName: "detection_scores",
      description: "Confidence scores for each detection",
      dimensionType: "fixed"
    },
    {
      elementType: "f32",
      dimensions: [1],
      displayName: "num_detections",
      description: "Total number of detections",
      dimensionType: "fixed"
    }
  ]
};

const mobilenet: Model = {
  type: "model",
  displayName: "MobileNet",
  identifier: "models/mobilenet_v2_1.0_224_1_default_1.tflite",
  description:
    "A pre-trained network that can classify images into 1000 object categories",
  helperUrl:
    "https://github.com/tensorflow/models/blob/master/research/slim/nets/mobilenet/mobilenet_example.ipynb",
  downloadURL: "https://assets.hotg.ai/models/tflite/mobilenet_v2.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "f32",
      dimensions: [1, 224, 224, 3],
      displayName: "input",
      description: "224x224 RGB image",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "f32",
      dimensions: [1, 1001],
      displayName: "output",
      description: "Confidence scores for each label",
      dimensionType: "fixed"
    }
  ]
};

const movenetSingleposeLightning: Model = {
  type: "model",
  displayName: "Movenet Singlepose Lightning",
  description:
    "A convolutional neural network model that runs on RGB images and predicts human joint locations of a single person.",
  helperUrl:
    "https://tfhub.dev/google/lite-model/movenet/singlepose/lightning/3",
  identifier: "models/movenet_singlepose_lightning_3.tflite",
  downloadURL:
    "https://raw.githubusercontent.com/hotg-ai/test-runes/master/image/movenet_pose_estimation/movenet_singlepose_lightning_3.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "f32",
      dimensions: [1, 192, 192, 3],
      displayName: "input",
      description: "an 1992x192 RGB image",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "f32",
      dimensions: [1, 1, 17, 3],
      displayName: "output",
      description: "co-ordinates of all 17 labels",
      dimensionType: "fixed"
    }
  ]
};

const plantClassifier: Model = {
  type: "model",
  displayName: "Plant Classifier",
  description: "",
  identifier: "models/lite-model_aiy_vision_classifier_plants_V1_3.tflite",
  downloadURL:
    "https://assets.hotg.ai/models/tflite/plant_classification.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "u8",
      dimensions: [1, 224, 224, 3],
      displayName: "input",
      description: "a 224x224 RGB image",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "u8",
      dimensions: [1, 2102],
      displayName: "output",
      description: "Confidence scores for each label",
      dimensionType: "fixed"
    }
  ]
};

const poseNet: Model = {
  type: "model",
  displayName: "PoseNet",
  description:
    "A model to estimate the pose of a person from an image or a video by estimating the spatial locations of key body joints (keypoints)",
  helperUrl:
    "https://github.com/tensorflow/tensorflow/blob/master/tensorflow/lite/g3doc/tutorials/pose_classification.ipynb",
  identifier: "models/posenet_mobilenet_float_075_1_default_1.tflite",
  downloadURL:
    "https://raw.githubusercontent.com/hotg-ai/test-runes/master/image/posenet/posenet_mobilenet_float_075_1_default_1.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "f32",
      dimensions: [1, 353, 257, 3],
      displayName: "input",
      description:
        "	Input image to be classified. The expected image is 353 x 257, with three channels (red, blue, and green) per pixel.",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "f32",
      dimensions: [1, 23, 17, 17],
      displayName: "heatmaps",
      description:
        "a tensor represents the heatmap of each keypoints detected by this model. Each position in that heatmap has a confidence score, which is the probability that a part of that keypoint type exists in that position.",
      dimensionType: "fixed"
    },
    {
      elementType: "f32",
      dimensions: [1, 23, 17, 34],
      displayName: "offsets",
      description:
        "The Offset vectors are used to predict the exact location of the keypoints as they give the distance vectors from the corresponding heatmap point.",
      dimensionType: "fixed"
    },
    {
      elementType: "f32",
      dimensions: [1, 23, 17, 64],
      displayName: "forward_displacements",
      description:
        "Forward displacements are used to traverse along a part-based graph (edges) to locate a target keypoint from a known parent source keypoint.",
      dimensionType: "fixed"
    },
    {
      elementType: "f32",
      dimensions: [1, 23, 17, 1],
      displayName: "backward_displacements",
      description:
        "Backward displacements are used to traverse along a part-based graph (edges) to locate a target keypoint from a known child source keypoint.",
      dimensionType: "fixed"
    }
  ]
};

const yolo: Model = {
  type: "model",
  displayName: "YOLO",
  description:
    "A family of object detection architectures and models pretrained on the COCO dataset",
  helperUrl:
    "https://colab.research.google.com/github/ultralytics/yolov5/blob/master/tutorial.ipynb",
  identifier: "models/yolo-v5-tflite_tflite_model_1.tflite",
  downloadURL: "https://assets.hotg.ai/models/tflite/yolo.tflite",
  format: "tensorflow-lite",
  source: "builtin",
  inputs: [
    {
      elementType: "f32",
      dimensions: [1, 320, 320, 3],
      displayName: "input",
      description: "a 320x320 RGB image",
      dimensionType: "fixed"
    }
  ],
  outputs: [
    {
      elementType: "f32",
      dimensions: [1, 6300, 85],
      displayName: "output",
      description:
        "remove duplicate detection for a single objects with [...80 labels + bounding box co-ordinate + confidence value]",
      dimensionType: "fixed"
    }
  ]
};

export default function models(): Record<string, Model> {
  return {
    bird_classification,
    cartoonGAN,
    deepLab,
    // eastTextDetector,
    // efficientDet,
    // efficientNet,
    esrGAN,
    food,
    gestureRecognition,
    inception,
    microspeech,
    // midas,
    mirnet,
    mobileBert,
    mobilenet,
    // mobileObjectLocalizer,
    // movenetSingleposeLightning,
    personDetection,
    plantClassifier,
    // poseNet,
    stylePredict,
    styleTransfer,
    yolo
  };
}
