import React from "react";
import Editor from "@monaco-editor/react";
import { debounce } from "lodash"

const CodeEditor = ({
  setSql,
  sql,
}: {
  setSql: (v: string | undefined) => void;
  sql: string | undefined;
}) => {

  const debouncedQuery = React.useRef(
    debounce(async (v) => {
    setSql(v);
    }, 500)
  ).current;

  React.useEffect(() => {
    return () => {
      debouncedQuery.cancel();
    };
  }, [debouncedQuery]);

  const handleChange = async (v: string) => {
    debouncedQuery(v);
  };

  return (
    <Editor
      height="100%"
      defaultLanguage="sql"
      defaultValue="-- Type your SQL query here"
      options={{
        mouseWheelZoom: true,
        fontSize: 15
      }}
      value={sql}
      onChange={(v) => handleChange(v)}
    />
  );
};

export default CodeEditor;
