import "./table.css";
import React from "react";
import { useTable, useBlockLayout } from "react-table";
import { FixedSizeList } from "react-window";
import scrollbarWidth from "./scrollbarwidth";

function VTable({ columns, data }: { columns: any[]; data: any[] }) {
  // Use the state and functions returned from useTable to build your UI

  const defaultColumn = React.useMemo(
    () => ({
      width: 120,
    }),
    []
  );

  const scrollBarSize = React.useMemo(() => scrollbarWidth(), []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    totalColumnsWidth,
    prepareRow,
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
    },
    useBlockLayout
  );

  const RenderRow = React.useCallback(
    ({
      index,
      style,
    }: {
      index: number;
      style: React.CSSProperties | undefined;
    }) => {
      const row = rows[index];
      prepareRow(row);
      return (
        <div
          {...row.getRowProps({
            style,
          })}
          className="tr"
        >
          {row.cells.map((cell) => {
            return (
              <div {...cell.getCellProps()} className="td">
                {cell.render("Cell")}
              </div>
            );
          })}
        </div>
      );
    },
    [prepareRow, rows]
  );

  // Render the UI for your table
  return (
    <div {...getTableProps()} className="table">
      <div>
        {headerGroups.map((headerGroup) => (
          <div {...headerGroup.getHeaderGroupProps()} className="tr">
            {headerGroup.headers.map((column) => (
              <div {...column.getHeaderProps()} className="th">
                {column.render("Header")}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div {...getTableBodyProps()}>
        <FixedSizeList
          height={400}
          itemCount={rows.length}
          itemSize={35}
          width={totalColumnsWidth + scrollBarSize}
        >
          {RenderRow}
        </FixedSizeList>
      </div>
    </div>
  );
}

declare type Column = { Header: string; accessor: string };

const computeColumns = (header: string[]): Column[] => {
  let columns: Column[] = [];
  header.forEach((head) => {
    columns.push({
      Header: head,
      accessor: head,
    });
  });
  return columns;
};

const ArrowTable = ({ data }: { data: any[] }) => {
  const header = Object.keys(data[0].toJSON());
  const columns = React.useMemo(() => computeColumns(header), [data]);
  return <VTable columns={columns} data={data} />;
};

export default ArrowTable;
