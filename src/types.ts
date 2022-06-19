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
  dict_id: number;
  dict_is_ordered: boolean;
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
