import React from "react";
import "./table.css";

const Table = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return;
  let header = Object.keys(data[0]);
  return (
    <table>
      <thead>
        <tr>
          {header.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((d, idx) => {
          return (
            <tr key={idx}>
              {header.map((h) => (
                <td key={h}>{d[h]}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default Table;
