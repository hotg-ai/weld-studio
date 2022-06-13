
import {ElementType} from "../model";
import { ElementType as RunicElementType } from "@hotg-ai/rune";
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
export const arrowDataTypeToElementType = (_arrowDataType: string | Record<string, null>): ElementType => {
    
    let data_type = typeof _arrowDataType == "string" ? _arrowDataType : Object.keys(_arrowDataType)[0]; 
    switch (data_type) {
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
            throw new Error(`Unknown arrow data type: ${JSON.stringify(_arrowDataType)}`);
    }

}

export const arrowDataTypeToRunicElementType = (_arrowDataType: string | Record<string, null>): RunicElementType => {

    let data_type = typeof _arrowDataType == "string" ? _arrowDataType : Object.keys(_arrowDataType)[0]; 
    

    switch (data_type) {
        case "Utf8":
            return RunicElementType.Utf8
        case "Int8":
            return RunicElementType.I8;
        case "Double":
            return RunicElementType.F64;
        case "Int16":
            return RunicElementType.I16;
        case "Int32":
            return RunicElementType.I32;
        case "Int64":
            return RunicElementType.I64;
        case "Float32":
            return RunicElementType.F32;
        case "Float64":
            return RunicElementType.F64;
        case "Uint8":
            return RunicElementType.U8;
        case "Uint16":
            return RunicElementType.U16;
        case "Uint32":
            return RunicElementType.U32;
        case "Uint64":
            return RunicElementType.U64;
        case "Date32":
            return RunicElementType.U32;
        case "Boolean":
            return RunicElementType.U8;
        case "Timestamp":
            return RunicElementType.U64;
        default:
            throw new Error(`Unknown arrow data type: ${JSON.stringify(_arrowDataType)}`);
    }

}


