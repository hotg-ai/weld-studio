import "./table.css";

const ArrowTable = ({ data }: { data: any[] }) => {
  let header = [];
  if (data !== undefined && data.length > 0) {
    if (data[0]) header = Object.keys(data[0].toJSON());

    return (
      <table>
        <thead>
          <tr>
            {header.map((h) => (
              <th key={h}>
                {h}{" "}
                {/* {h === header[header.length - 1] && (
                  <button>
                    <img src={downloadIcon} alt="" /> Download
                  </button>
                )} */}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            const d = row.toJSON();
            return (
              <tr key={idx}>
                {header.map((h) =>
                  d[h] !== undefined ? (
                    <td key={h}>{d[h]}</td>
                  ) : (
                    <td key={h}>
                      <i>null</i>
                    </td>
                  )
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  } else return null;
};

export default ArrowTable;
