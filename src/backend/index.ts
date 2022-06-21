import { invoke } from "@tauri-apps/api";
import { SerializableError } from "./types/SerializableError";
import { ValidationFailed } from "./types/ValidationFailed";
import { ValidationResponse } from "./types/ValidationResponse";

export type Result<T, E> = { type: "ok", value: T } | { type: "err", error: E };

export function ok<T>(value: T): Result<T, never> {
    return { type: "ok", value };
}

export function err<E>(error: E): Result<never, E> {
    return { type: "err", error };
}

/**
 * Check whether a SQL query is valid.
 * @param sql The SQL query.
 * @param maxRows Limit the number of records in the 
 * @returns
 */
export async function validate_sql(sql: string, maxRows?: number): Promise<Result<ValidationResponse, SerializableError<ValidationFailed>>> {
    try {
        const response = await invoke("validate_sql", { sql, max_rows: maxRows });
        return ok(response as ValidationResponse);
    } catch(e) {
        return err(is_serializable_error(e) ? e : to_serializable_error(e));
    }
}

export function is_serializable_error(value: any): value is SerializableError<any> {
    return typeof value == "object"
        && typeof value.message == "string"
        && Array.isArray(value.causes)
        && value.causes.every((c: any) => typeof c == "string")
        && typeof value.verbose == "string";
}

function to_serializable_error(error: any): SerializableError<never> {
    if (error instanceof Error) {
        return {
            message: error.message,
            verbose: error.stack || error.message,
            causes: [],
        };
    } else {
        return {
            message: error.toString(),
            verbose: error.toString(),
            causes: [],
        }
    }
}
