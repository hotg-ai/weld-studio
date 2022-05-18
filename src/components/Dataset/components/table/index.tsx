import React from "react";
import "./table.css";

const Table = ({data}: {data: any[]}) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Column 1</th>
          <th>Column 2</th>
          <th>Column 3</th>
        </tr>
      </thead>
      <tbody>
      <tr>
        <td className="null">null</td>
        <td className="null">null</td>
        <td>May 17, 2022</td>
      </tr>
      <tr>
        <td>aa5295</td>
        <td className="null">null</td>
        <td className="null">null</td>
      </tr>
      <tr>
        <td>bb2305</td>
        <td className="null">null</td>
        <td className="null">null</td>
      </tr>
      <tr>
        <td>as2412</td>
        <td className="null">null</td>
        <td>Oct 31, 2021</td>
      </tr>
      <tr>
        <td>bb2142</td>
        <td className="null">null</td>
        <td className="null">null</td>
      </tr>
      <tr>
        <td>aa5412</td>
        <td className="null">null</td>
        <td className="null">null</td>
      </tr>
      </tbody>
    </table>
  );
};

export default Table;
