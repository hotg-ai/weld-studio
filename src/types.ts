import { Tensor } from "@hotg-ai/rune";

export type FileDropEvent = {
  payload: string[];
};

export type TableData = {
  table_name: string;
  column_names: string[];
  column_types: string[];
  selected?: boolean;
  group?: string;
};

export type FieldSchema = {
  name: string;
  data_type: string | Record<string, null>;
  nullable: boolean;
  dict_id?: number;
  dict_is_ordered?: boolean;
};

// This dataset is `capability` block in the drag and drop editor
export type QueryData = {
  query: string;
  fields: FieldSchema[];
  tensor: Tensor;
  data: Array<Record<string, any>>;
  selected: boolean;
  createdAt: Date;
  group?: string;
};

export type AppState = {
  tabs: WeldProject[];
  selectedTab?: string;
};

export type WeldProject = {
  id: string;
  name?: string;
  data: any[];
  querySchema: { fields: FieldSchema[] };
  sql: string | undefined;
  queryError: string | undefined;
  tables: Record<string, TableData>;
  isLoadingTable: boolean;
  isQueryLoading: boolean;
  datasetRegistry: Record<string, QueryData>;
  selectedDatasets: string[];
  searchValue: string;
  logs: any[];
};

// Some versions of Safari doesn't support BigUint64Array and friends, and
// it's not possible to polyfill these types because bigint is a builtin type.
//
// This workaround lets us use them when possible and throws an exception at
// runtime when they aren't.
//
// https://github.com/hotg-ai/weld-studio/issues/65

class NotImplemented {
  static readonly BYTES_PER_ELEMENT: number = 8;

  constructor() {
    throw new Error("64-bit integers aren't supported on this device");
  }

  static of(): never {
    throw new Error("64-bit integers aren't supported on this device");
  }

  static from(): never {
    throw new Error("64-bit integers aren't supported on this device");
  }
}

export const BigInt64ArrayShim: BigInt64ArrayConstructor = window.BigInt64Array || NotImplemented as any as BigInt64ArrayConstructor;
export const BigUint64ArrayShim: BigUint64ArrayConstructor = window.BigUint64Array || NotImplemented as any as BigUint64ArrayConstructor;
