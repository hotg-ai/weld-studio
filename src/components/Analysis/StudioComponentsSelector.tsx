import _, { result } from "lodash";
import { useState, useEffect, useRef, useMemo, DragEvent } from "react";
import {
  Upload,
  Button,
  message,
  Popover,
  Empty,
  Input,
  Collapse,
  Switch,
  Table,
  Checkbox,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";

import { QuestionMark, WebWhite } from "../../assets/index";

import { Capability, Component, prefixKeys } from "./model";
import { ColorFromComponentTypeString } from "./utils/ForgeNodeUtils";
import { UploadChangeParam } from "antd/lib/upload";
import { UploadFile } from "antd/lib/upload/interface";
import Modal from "../Dataset/components/modal";
import TextArea from "antd/lib/input/TextArea";
import { DatasetTypes } from "../Dataset";
import { UpdateComponents } from "src/redux/builderSlice";
import outputs from "./model/outputs";
export type ComponentListItemProps = {
  id: string;
  component: Component;
  onAddComponent: (component: Component) => void;
};

const nodeType2Color = (
  type: string
):
  | "purple"
  | "pink"
  | "red"
  | "yellow"
  | "orange"
  | "cyan"
  | "green"
  | "blue"
  | "geekblue"
  | "magenta"
  | "volcano"
  | "gold"
  | "lime"
  | "#00b594"
  | "#cb4ebc" => {
  switch (type) {
    case "capability":
      return "purple";
    case "model":
      return "#cb4ebc";
    case "proc-block":
      return "cyan";
    case "output":
      return "#00b594";
    default:
      return "purple";
  }
};

const ComponentListItem = ({ id, component, onAddComponent }: ComponentListItemProps) => {
  const onDragStart = (event: DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.setData("application/json", JSON.stringify(component));
    event.dataTransfer.effectAllowed = "move";
  };

  const color = ColorFromComponentTypeString(component.type);
  return (
    <div
      style={{ cursor: "pointer" }}
      draggable
      className={`StudioBody--left__card StudioBody--left__card${color}`}
      onDragStart={(event) => {
        event.dataTransfer.setData("forge-node-dragged", id);
        onDragStart(event, component.type);
      }}
      onClick={(event) => {

        onAddComponent(component);
      }}
    >
      <p style={{ margin: "0" }}>{component.displayName}</p>
      <Popover
        style={{
          fontWeight: "600",
        }}
        color={nodeType2Color(component.type)}
        placement="right"
        title={`A ${component.type}`}
        content={
          <div>
            <p style={{ width: "200px", wordWrap: "break-word" }}>
              {component.description}
            </p>
            <p
              hidden={
                component.helperUrl === undefined || component.helperUrl === ""
              }
            >
              <br />
              Link:{" "}
              <a href={component.helperUrl} target="_blank" rel="noreferrer">
                <img src={WebWhite} className="select--icon" />
              </a>
            </p>
          </div>
        }
        trigger="hover"
      >
        {component.description && <img src={QuestionMark} width="16" />}
      </Popover>
    </div>
  );
};

type NodesListProps = {
  components: Record<string, Component>;
  setIsmodalVisible: any;
};

const NodesList = ({ components, setIsmodalVisible }: NodesListProps) => {
  const getComponentTypes = (components: [string, Component][]): string[] => {
    return components
      .reduce((acc: string[], [_, component]) => {
        if (acc.indexOf(component.type) === -1) acc.push(component.type);
        return acc;
      }, [])
      .filter((type) => type !== "model")
      .map((type) => (type === "capability" ? "input" : type)); // NOTICE: this replaces capability with input in the collapse headers list. OMG!
  };
  const uploadedComponents = Object.entries(
    filter(components, (c) => c.source === "custom")
  );

  const [states, setStates] = useState<{
    componentTypeKeys: string[];
    filteredListItems: [string, Component][];
    activeCollapseKeys: string[];
  }>({
    componentTypeKeys: [] as string[],
    filteredListItems: [] as [string, Component][],
    activeCollapseKeys: [] as string[],
  });

  useEffect(() => {
    const rawComponents = Object.entries(components);
    const componentTypeKeys = getComponentTypes(rawComponents);

    setStates({
      componentTypeKeys,
      filteredListItems: rawComponents,
      activeCollapseKeys: componentTypeKeys,
    });
  }, [components]);

  const [nodesListHeight, setNodesListHeight] = useState("80vh");
  const nodesListRef = useRef<HTMLDivElement>(null);

  const applyNodesListRefHeight = () => {
    if (nodesListRef) {
      const leftSidebarHeight =
        nodesListRef.current?.parentElement?.parentElement?.clientHeight;
      if (leftSidebarHeight) {
        const otherElementsHeight = 125;
        setNodesListHeight(
          String(`${leftSidebarHeight - otherElementsHeight}px`)
        );
      }
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const rawComponents = Object.entries(components);
    let filteredListItems = rawComponents;

    if (value.length) {
      filteredListItems = rawComponents.filter(([_, component]) =>
        component.displayName.toLowerCase().includes(value.toLowerCase())
      );
    }

    const componentTypeKeys = getComponentTypes(filteredListItems);

    setStates({
      componentTypeKeys,
      filteredListItems,
      activeCollapseKeys: [...componentTypeKeys],
    });
  };

  const toggleActiveCollapseKeys = (key: string) => {
    const activeCollapseKeys = [...states.activeCollapseKeys];
    const keyIndex = activeCollapseKeys.indexOf(key);

    if (keyIndex === -1) {
      activeCollapseKeys.push(key);
    } else {
      activeCollapseKeys.splice(keyIndex, 1);
    }

    setStates({ ...states, activeCollapseKeys });
  };

  useEffect(() => {
    // applyNodesListRefHeight();
    // window.addEventListener("resize", applyNodesListRefHeight);
    // return () => window.removeEventListener("resize", applyNodesListRefHeight);
  }, [nodesListRef]);

  return (
    <>
      <div ref={nodesListRef} className="nodeList__container">
        <aside>
          {states.componentTypeKeys.length ? (
            states.componentTypeKeys.map((type: string) => (
              <Collapse
                className="StudioBody--left__cards"
                ghost
                activeKey={states.activeCollapseKeys}
              >
                <Collapse.Panel
                  header={
                    <div
                      onClick={() => toggleActiveCollapseKeys(type)}
                      className="itemCollapseName"
                    >
                      {type === "input" ? "Data Columns" : type}
                      {type === "input" && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setIsmodalVisible(true);
                          }}
                        >
                          <PlusOutlined />
                          Add Schema
                        </button>
                      )}
                    </div>
                  }
                  key={type}
                >
                  {states.filteredListItems.map(
                    ([id, component]: [string, Component]) => {
                      // NOTICE: the same as above replacement, FOR GOD'S SAKE.
                      if (
                        type === "input"
                          ? component.type === "capability"
                          : type.includes(component.type) &&
                            component.source !== "custom" &&
                            ["input", "output", "proc-block"].includes(type)
                      ) {
                        return (
                          <ComponentListItem
                            key={id}
                            id={id}
                            component={component}
                          />
                        );
                      }
                    }
                  )}
                </Collapse.Panel>
              </Collapse>
            ))
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No component(s) to show."
            />
          )}
        </aside>
      </div>
    </>
  );
};

function filter<V>(
  items: Record<string, V>,
  predicate: (value: V) => boolean
): Record<string, V> {
  const entries = Object.entries(items);
  const retained = entries.filter((pair) => predicate(pair[1]));
  return Object.fromEntries(retained);
}

const generateCapabilities = (
  dataColumns: string[],
  dataTypes: DatasetTypes
): Record<string, Capability> => {
  let result: Record<string, Capability> = {};
  Object.values(dataTypes).forEach((v) => {
    Object.entries(v).forEach(([column, value]) => {
      if (dataColumns.filter((col) => col === column).length > 0) {
        column = column.replaceAll('"', "");
        result[column] = {
          type: "capability",
          displayName: column,
          identifier: "RAW",
          source: "custom",
          properties: {
            length: {
              type: "integer",
              defaultValue: 1,
              required: true,
              description: "Length of raw data in bytes",
            },
            source: {
              type: "integer",
              required: true,
              defaultValue: 0,
              description:
                "Specify which input to use when multiple inputs are provided",
            },
          },
          description: "",
          acceptedOutputElementTypes: [{ elementTypes: ["f32"] }],
          outputs: (p) => {
            const { length } = p;
            if (typeof length !== "number") {
              throw new Error();
            }

            return [
              {
                elementType: "u8",
                dimensions: [length],
                displayName: "data",
                description: `Raw output from ${column} Column`,
                dimensionType: "fixed",
              },
            ];
          },
        };
      }
    });
  });
  return result;
};

export const ComponentsSelector = ({ data, dataColumns, dataTypes }) => {
  const dispatch = useAppDispatch();
  const components = useAppSelector((s) => s.builder.components);
  const [nodesType, setNodesType] = useState<Component["source"]>("builtin");
  const [progressState, setProgressState] = useState({
    show: false,
    active: false,
    done: false,
  });

  useMemo(() => {
    dispatch(
      UpdateComponents({
        ...prefixKeys(generateCapabilities(dataColumns, dataTypes)),
        ...prefixKeys(outputs()),
      })
    );
  }, [dataColumns, dataTypes]);

  // dispatch(ClearComponents());

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [schemaCode, setSchemaCode] = useState("");
  const [showSchematable, setShowSchematable] = useState<boolean>(false);
  const [tableData, setTableData] = useState<any[]>([
    { name: "Unknown Title", dataType: "UB", parameter: "", nullable: true },
    { name: "Unknown!", dataType: "", parameter: "", nullable: false },
  ]);

  const onUpload = async (info: UploadChangeParam<UploadFile<any>>) => {
    const { name: fileName, status: uploadStatus, originFileObj } = info?.file;

    if (uploadStatus === "error") {
      message.error(`${fileName} file upload failed.`);
      return;
    }

    try {
      setProgressState({
        done: false,
        show: true,
        active: true,
      });

      const [model] = await Promise.all([originFileObj?.arrayBuffer()]);

      const displayName = _.startCase(fileName.replace(/\..*$/, ""));

      let results;
      // if (model && token && fileName && displayName)
      //   results = await dispatch(
      //     uploadModel({
      //       displayName,
      //       path: fileName,
      //       token,
      //       model,
      //     })
      //   );

      if (results && results.meta.requestStatus !== "fulfilled") {
        setProgressState({
          show: false,
          active: false,
          done: false,
        });
        message.error(`${info.file.name} file upload failed with error.`);
        return;
      }

      if (results && results.meta.requestStatus === "fulfilled") {
        message.success(`${fileName} file uploaded successfully`);
        setProgressState({
          show: false,
          active: false,
          done: true,
        });
        return;
      }
    } catch (err) {
      message.error(`${info.file.name} file upload failed with error ${err}`);
    }
    return;
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string) => {
        return <Input type="text" defaultValue={name} />;
      },
    },
    {
      title: "Data Type",
      dataIndex: "dataType",
      key: "dataType",
      render: (dataType: string) => {
        return <Input type="text" defaultValue={dataType} />;
      },
    },
    {
      title: "Parameter 1",
      dataIndex: "parameter",
      key: "parameter",
      render: (parameter: string) => {
        return <Input type="text" defaultValue={parameter} />;
      },
    },
    {
      title: "Nullable",
      dataIndex: "nullable",
      key: "nullable",
      render: (nullable: boolean) => {
        return <Checkbox defaultChecked={nullable} />;
      },
    },
  ];

  return (
    <>
      <form action="">
        <NodesList
          setIsmodalVisible={setIsModalVisible}
          components={components}
        />
      </form>
      {isModalVisible && (
        <Modal
          setModalVisible={setIsModalVisible}
          title="Add New Schema"
          className="schema_modal"
        >
          <div className="header">
            <span>Code Editor Mode</span>
            <Switch onChange={(checked) => setShowSchematable(checked)} />
            <span>Table Mode</span>
          </div>
          <div className="content">
            {showSchematable ? (
              <div className="table__container">
                <Table
                  dataSource={tableData}
                  columns={columns}
                  pagination={false}
                />
                <button
                  onClick={() => {
                    setTableData((prev) => [
                      ...prev,
                      {
                        name: "",
                        dataType: "",
                        parameter: "",
                        nullable: false,
                      },
                    ]);
                  }}
                >
                  + Add Schema
                </button>
              </div>
            ) : (
              <div className="editor__container">
                <TextArea
                  value={schemaCode}
                  onChange={(e) => setSchemaCode(e.target.value)}
                />
                <div>
                  <Checkbox>Nullable</Checkbox>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};
