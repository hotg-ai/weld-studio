import "./table.css";
import moment from "moment";
import React, { useRef, useState, useEffect } from "react";
import { useTable, useBlockLayout, Column, usePagination } from "react-table";
import { FixedSizeList } from "react-window";
import scrollbarWidth from "./scrollbarwidth";
import { StructRowProxy } from "apache-arrow";

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
  columns: Column<any>[];
  data: any[];
}) {
  // Use the state and functions returned from useTable to build your UI
  const { width } = useWindowDimensions();

  const defaultColumn = React.useMemo(
    () => ({
      width: width / columns.length < 100 ? 100 : width / columns.length,
    }),
    [columns.length, width]
  );

  const scrollBarSize = React.useMemo(() => scrollbarWidth(), []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    totalColumnsWidth,
    prepareRow,
    page, // Instead of using 'rows', we'll use page,
    // which has only the rows for the active page

    // The rest of these things are super handy, too ;)
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
      initialState: { pageIndex: 0 }
    },
    useBlockLayout,
    usePagination
  );

  const RenderRow = React.useCallback(
    ({
      row,
      style,
    }: {
      row: any;
      style: React.CSSProperties | undefined;
    }) => {
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
              <div style={style} {...cell.getCellProps()} className="td">
                {cell.render("Cell")}
              </div>
            );
          })}
        </div>
      );
    },
    [prepareRow, page]
  );

  // Render the UI for your table
  return (
    <div {...getTableProps()} className="table">
      <div className="tableHeader">
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
        {/* <FixedSizeList
          height={400}
          itemCount={page.length}
          itemSize={35}
          width={totalColumnsWidth + scrollBarSize}
        > */}
          {page.map((row) => {
            { RenderRow({row: row, style: {}}) }
          })}
        {/* </FixedSizeList> */}
      </div>
      <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </button>{' '}
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>{' '}
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>{' '}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {'>>'}
        </button>{' '}
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{' '}
        </span>
        <span>
          | Go to page:{' '}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              gotoPage(page)
            }}
            style={{ width: '100px' }}
          />
        </span>{' '}
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// declare type Column = { Header: string; accessor: string  };

export const computeColumns = (header: string[]): Column<any>[] => {
  let columns: Column<any>[] = [];
  header.forEach((head) => {
    columns.push({
      Header: head,
      accessor: (hexad: StructRowProxy | any) => {
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
