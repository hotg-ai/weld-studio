import React from "react";
import "./table.css";

const Table = ({ data }: { data: any[] }) => {
  let header = [];
  if (data && data.length > 0) {
    if (data[0]) header = Object.keys(data[0]);
  } else return null;
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
