import React from "react";
import Editor from "@monaco-editor/react";

const CodeEditor = ({
  setCode,
  code,
  defaultLanguage="sql",
  defaultValue=""
}: {
  setCode: (v: string | undefined) => void;
  code: string | undefined;
  defaultLanguage?: string;
  defaultValue?: string;
}) => {
  return (
    <Editor
      height="100%"
      defaultLanguage={defaultLanguage}
      defaultValue={defaultValue}
      value={code}
      onChange={(v) => setCode(v)}
    />
  );
};

export default CodeEditor;
