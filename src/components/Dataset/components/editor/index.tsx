import React from "react";
import Editor from "@monaco-editor/react";

const CodeEditor = () => {
  return (
    <Editor
      height="100%"
      defaultLanguage="javascript"
      defaultValue="// some comment"
    />
  );
};

export default CodeEditor;
