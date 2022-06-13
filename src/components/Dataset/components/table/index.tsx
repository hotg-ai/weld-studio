import React from "react";
import "./table.css";

const Table = ({ data }: { data: any[] }) => {
  let header = [];
  if (data !== undefined && data.length > 0) {
    if (data[0]) header = Object.keys(data[0]);
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
                {header.map((h) =>
                  d[h] !== undefined ? <td key={h}>{d[h]}</td> : <td key={h}><i>null</i></td>
                )}  
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  } else return null;
};

export default Table;
