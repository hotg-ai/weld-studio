import "./table.css";
import moment from "moment";
import React, { useRef, useState, useEffect } from "react";
import { useTable, useBlockLayout, Column } from "react-table";
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
              <div style={style} {...cell.getCellProps()} className="td">
                {cell.render("Cell", {
                  style: { height: "auto", width: "auto" },
                })}
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

// declare type Column = { Header: string; accessor: string  };

export const computeColumns = (header: string[]): Column<any>[] => {
  let columns: Column<any>[] = [];
  header.forEach((head) => {
    columns.push({
      Header: head,
      accessor: (hexad: StructRowProxy | any) => {
        try {
          console.log(hexad.toJSON()[head])
          if (hexad !== null && hexad.toJSON) {
            let res = hexad.toJSON()[head];

            if (res && typeof res.getMonth === "function") {
              return moment(res).toISOString();
            }
            if (hexad.toJSON()[head] === null)
              return <i style={{ color: "salmon" }}>null</i>;

            if (typeof hexad.toJSON()[head].toString() !== "string" && isNaN(hexad.toJSON()[head]))
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
