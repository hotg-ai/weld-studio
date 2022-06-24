import { invoke } from "@tauri-apps/api";
import { tableFromIPC, Table } from "apache-arrow";

import { SerializableError } from "./types/SerializableError";
import { ValidationFailed } from "./types/ValidationFailed";
import { DatasetInfo } from "./types/DatasetInfo";
import { PaginationConfig } from "./types/PaginationConfig";
import { ValidationResponse as RawValidationResponse  } from "./types/ValidationResponse";
import { Package } from "./types/Package";
import { DatasetPage } from "./types/DatasetPage";
import { Pipeline } from "./types/Pipeline";
import { ColumnMapping } from "./types/ColumnMapping";
import { Analysis } from "./types/Analysis";

export type ValidationResponse = {
  numRows: number;
  preview: Table;
};

export type Result<T, E = SerializableError<unknown>> =
  | { type: "ok"; value: T }
  | { type: "err"; error: E };

function ok<T>(value: T): Result<T, never> {
  return { type: "ok", value };
}

function err<E>(error: E): Result<never, E> {
  return { type: "err", error };
}

/**
 * Log a message on the backend.
 */
export async function log_message(message: string): Promise<void> {
    await invoke("log_message", { message });
}

/**
 * Rapidly check whether a SQL query is valid.
 *
 * @param sql The SQL query.
 * @param maxRows Limit the number of records in the preview.
 * @returns
 */
export async function validate_sql(sql: string, maxRows: number = 10): Promise<Result<ValidationResponse, SerializableError<ValidationFailed>>> {

    try {
        const {row_count, preview}: RawValidationResponse = await invoke("validate_sql", { sql, maxRows});
        let previewX = tableFromIPC(preview); 
        console.log(previewX)
        return ok({
            numRows: row_count,
            preview: previewX,
        });
    } catch(e) {
        return err(is_serializable_error(e) ? e : to_serializable_error(e));
    }
}

/**
 * Execute a SQL query and save the results to disk.
 * @param sql The SQL query to execute.
 * @param path The filename to save as.
 */
export async function save_sql(sql: string, path: string): Promise<Result<undefined>> {
    try {
        await invoke("save_sql", { sql, path });
        return ok(undefined);
    } catch(e) {
        return err(is_serializable_error(e) ? e : to_serializable_error(e));
    }
}

/**
 * Create a new dataset that can be used as an input for analysis.
 * @param name The human-friendly name to use.
 * @param sql The SQL query that defines this dataset.
 * @returns
 */
export async function create_dataset(
  name: string,
  sql: string
): Promise<Result<DatasetInfo>> {
  try {
    const response = await invoke("create_dataset", { name, sql });
    return ok(response as DatasetInfo);
  } catch (e) {
    return err(is_serializable_error(e) ? e : to_serializable_error(e));
  }
}

/**
 * List all the datasets that have been created (e.g. by uploading a CSV or
 * saving a SQL query).
 */
export async function list_datasets(): Promise<Result<DatasetInfo[]>> {
    try {
        const response = await invoke("list_datasets");
        return ok(response as DatasetInfo[]);
    } catch(e) {
        return err(is_serializable_error(e) ? e : to_serializable_error(e));
    }
}

/**
 * Lookup the metadata for a dataset by ID.
 * @param id The dataset's ID.
 */
export async function get_dataset_info(id: string): Promise<Result<DatasetInfo>> {
    try {
        const response = await invoke("get_dataset_info", { id });
        return ok(response as DatasetInfo);
    } catch(e) {
        return err(is_serializable_error(e) ? e : to_serializable_error(e));
    }
}

/**
 * Read a page of data from the dataset.
 *
 * @param id The dataset's ID.
 * @param options Configure how much data to return.
 */
export async function read_dataset_page(
    id: string,
    options: Partial<PaginationConfig>,
): Promise<Result<DatasetPage>> {
    try {
        const response = await invoke("read_dataset_page", { id, options });
        return ok(response as DatasetPage);
    } catch(e) {
        return err(is_serializable_error(e) ? e : to_serializable_error(e));
    }
}

export async function execute_analysis(pipeline: Pipeline, column_mapping: ColumnMapping): Promise<Result<Analysis>> {
    try {
        const response = await invoke("execute_analysis", { pipeline, column_mapping });
        return ok(response as Analysis);
    } catch(e) {
        return err(is_serializable_error(e) ? e : to_serializable_error(e));
    }
}

/**
 * Get a list of all available proc-blocks.
 */
export async function known_proc_blocks(): Promise<Package[]> {
    return await invoke("known_proc_blocks");
}

export function is_serializable_error(value: any): value is SerializableError<any> {
    return typeof value == "object"
        && typeof value.message == "string"
        && Array.isArray(value.causes)
        && value.causes.every((c: any) => typeof c == "string")
        && typeof value.verbose == "string";
}

/**
 * Try to convert a random JavaScript object (typically, an exception that was
 * caught) into a SerializableError.
 */
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
    };
  }
}
