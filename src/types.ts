
export type FileDropEvent = {
    payload: string[]
}

export type TableData = {
    table_name: string;
    column_names: string[];
    column_types: string[];
}

export type FieldSchema = {
    name: string;
    data_type: string;
    nullable: boolean;
    dict_id: number;
    dict_is_ordered: boolean;
  }