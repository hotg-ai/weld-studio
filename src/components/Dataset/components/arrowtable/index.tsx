import "./table.css";
import moment from "moment";
import React, { useRef, useState, useEffect } from "react";
import { FixedSizeList } from "react-window";
import scrollbarWidth from "./scrollbarwidth";
import { StructRowProxy } from "apache-arrow";
import {
  Column,
  Table as ReactTable,
  PaginationState,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  OnChangeFn,
  flexRender
} from '@tanstack/react-table';

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowDimensions;
}

export function VTable({
  columns,
  data,
}: {
  columns: ColumnDef<any>[];
  data: any[];
}) {
  const { width } = useWindowDimensions();
  const defaultColumn = React.useMemo(
    () => ({
      width: width / columns.length < 100 ? 100 : width / columns.length,
    }),
    [columns.length, width]
  );
  const table = useReactTable({
    data,
    columns,
    // Pipeline
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    //
    debugTable: true,
    defaultColumn: {
      minSize: defaultColumn.width,
      size: defaultColumn.width,
      maxSize: defaultColumn.width,
      

    }
  })

  return (
    <div>
      <div className="pagination" style={{ position: "fixed", zIndex: "1000", bottom: "35%", left: "15px" }}>
        <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
          {'First'}
        </button>{' '}
        <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          {'<'}
        </button>{' '}
        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          {'>'}
        </button>{' '}
        <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
          {'Last'}
        </button>{' '}
        <span>
          Page{' '}
          <strong>
            {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </strong>{' '}
        </span>
        <span>
          | Go to page:{' '}
          <input
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              table.setPageIndex(page)
            }}
            style={{ width: '100px' }}
          />
        </span>{' '}
        <select
          value={table.getState().pagination.pageSize}
          onChange={e => {
            table.setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>

      <table className="table">
        <thead className="tableHeader">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} className="tr">
              {headerGroup.headers.map(header => {
                return (
                  <th key={header.id} >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => {
            return (
              <tr key={row.id} className="tr">
                {row.getVisibleCells().map(cell => {
                  return (
                    <td key={cell.id} className="td">
                      {cell.renderValue()}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
}

// declare type Column = { Header: string; accessor: string  };

export const computeColumns = (header: string[]): ColumnDef<any>[] => {
  let columns: ColumnDef<any>[] = [];
  header.forEach((head) => {
    columns.push({
      accessorKey: head,
      cell: (hexad: StructRowProxy | any) => {
        try {
          if (hexad !== null && typeof hexad.toJSON === "function") {
            let res = hexad.toJSON()[head];

            if (res && typeof res.getMonth === "function") {
              return moment(res).toISOString();
            }
            if (hexad.toJSON()[head] === null)
              return <i style={{ color: "salmon" }}>null</i>;

            if (
              typeof hexad.toJSON()[head].toString() !== "string" &&
              isNaN(hexad.toJSON()[head])
            )
              return <i style={{ color: "salmon" }}>NaN</i>;

            if (hexad.toJSON()[head] === undefined)
              return <i style={{ color: "salmon" }}>undefined</i>;

            return hexad.toJSON()[head].toString();
          } else {
            return hexad[head];
          }
        } catch (e) {
          console.log("BOOOOM", head, hexad, e);
        }
      },
    });
  });
  return columns;
};

const ArrowTable = ({ data }: { data: any[] }) => {
  const header = Object.keys(data[0].toJSON());

  const columns = React.useMemo(() => computeColumns(header), [header]);
  return <VTable columns={columns} data={data} />;
};

export default ArrowTable;
