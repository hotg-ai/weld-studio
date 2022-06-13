
import {ElementType} from "../model";
/**
 * 
 *   | "utf8"
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
 */
export const arrowDataTypeToElementType = (arrowDataType: string): ElementType => {

    switch (arrowDataType) {
        case "Utf8":
            return "utf8";
        case "Int8":
            return "i8";
        case "Double":
            return "f64";
        case "Int16":
            return "i16";
        case "Int32":
            return "i32";
        case "Int64":
            return "i64";
        case "Float32":
            return "f32";
        case "Float64":
            return "f64";
        case "Uint8":
            return "u8";
        case "Uint16":
            return "u16";
        case "Uint32":
            return "u32";
        case "Uint64":
            return "u64";
        case "Date32":
            return "u32";
        case "Boolean":
            return "u8"
        case "Timestamp":
            return "u64";
        default:
            throw new Error(`Unknown arrow data type: ${arrowDataType}`);
    }

}