import React from "react";
import Editor from "@monaco-editor/react";

const CodeEditor = ({
  setSql,
  sql,
}: {
  setSql: (v: string | undefined) => void;
  sql: string | undefined;
}) => {
  return (
    <Editor
      height="100%"
      defaultLanguage="sql"
      defaultValue="-- Type your SQL query here"
      value={sql}
      onChange={(v) => setSql(v)}
    />
  );
};

export default CodeEditor;
