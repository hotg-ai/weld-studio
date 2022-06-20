import _ from "lodash";
import { useCallback, useState } from "react";
import { Col, Tooltip, message, Upload, Button, Select } from "antd";
import { CloudUploadOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "./../../hooks/hooks";
import {
  Component,
  modelProperties,
  outputProperties,
  Property,
} from "./model";
import { PropertiesIcon, QuestionMark } from "../../assets";

import { UploadChangeParam } from "antd/lib/upload";
import { UploadFile } from "antd/lib/upload/interface";
import {
  ResourceComponent,
  uploadWordlist,
} from "../../redux/actions/studio/uploadWordlist";
import { outputPorts } from "./OutputDimensions";
import { FlowNodeData } from "./model/FlowNodeComponent";
import { Node } from "react-flow-renderer";
import { Port } from "./model/Storm";
const { Option } = Select;

type InputType = {
  fileName: string | null;
  name: string;
  property: Property;
  set: (value: string | number) => void;
  value: undefined | number | string;
  onUpload: (info: UploadChangeParam<UploadFile<any>>) => void;
  progressState: {
    show: boolean;
    active: boolean;
    done: boolean;
  };
  disabled?: boolean;
  ports?: Port[];
  error?: Record<string, string | number | undefined>;
};

function NumberInput({
  name,
  property,
  set,
  value,
  ports,
  disabled,
  error,
}: InputType) {
  return (
    <input
      required={property.required}
      type="number"
      name={name}
      id={name}
      className={
        error && error[name] !== undefined
          ? "StudioBody--right__form__input dimention_err"
          : "StudioBody--right__form__input"
      }
      onChange={(e) => {
        const parse = parseFloat(e.target.value);
        if (isFinite(parse)) set(parse);
      }}
      onKeyDownCapture={(e) => {
        if (e.key === "Backspace" || e.key === "Delete") {
          e.stopPropagation();
        }
      }}
      value={value}
      style={{
        color: name === "source" ? "rgba(255, 255, 255, 1)" : "",
      }}
      // disabled={true}
    />
  );
}

function StringInput({
  fileName,
  name,
  property,
  set,
  value,
  onUpload,
  progressState,
  ports,
  error,
}: InputType) {
  if (property.type === "string") {
    return (
      <Col span={12}>
        <input
          required={property.required}
          type="text"
          name={name}
          id={name}
          onKeyDownCapture={(e) => {
            if (e.key === "Backspace" || e.key === "Delete") {
              e.stopPropagation();
            }
          }}
          className={
            error && error[name] !== undefined
              ? "StudioBody--right__form__input dimention_err"
              : "StudioBody--right__form__input"
          }
          onChange={(e) => {
            set(e.target.value.trim());
          }}
          value={value || ""}
          style={{
            color: name === "source" ? "rgba(255, 255, 255, 1)" : "",
          }}
        />
      </Col>
    );
  } else {
    return (
      <Col span={24}>
        <Upload
          customRequest={() => null}
          accept=".txt"
          onChange={(info) => onUpload(info)}
          showUploadList={false}
        >
          <Button
            block
            type="primary"
            icon={<CloudUploadOutlined />}
            disabled={progressState.active}
          >
            Upload Wordlist
          </Button>
          {Boolean(fileName) && <span>{fileName}</span>}
          {/* {progressState.show && (
            <ProgressBar
              active={progressState.active}
              done={progressState.done}
              steps={10}
            />
          )} */}
        </Upload>
      </Col>
    );
  }
}

function SelectInput({
  fileName,
  name,
  property,
  set,
  value,
  onUpload,
  progressState,
  disabled = false,
  ports,
  error,
}: InputType) {
  if (property.type === "string-enum") {
    return (
      <Col span={12}>
        <Select
          defaultValue={property.enumValues[0].name}
          value={value}
          id={`${name}-element-type`}
          style={{ width: 120 }}
          className={
            error && error[name] !== undefined
              ? "StudioBody--right__form__input dimention_err"
              : "StudioBody--right__form__input"
          }
          onChange={(value) => set(value)}
        >
          {property.enumValues.map((e) => (
            <Option key={`${name}-option-${e.name}`} value={e.name}>
              {e.name.startsWith("@PixelFormat::")
                ? e.name.split("@PixelFormat::")[1]
                : e.name}
            </Option>
          ))}
        </Select>
      </Col>
    );
  }
  if (property.type === "string") {
    return (
      <Col span={12}>
        <Select
          defaultValue={property.defaultValue}
          value={value}
          id={`${name}-element-type`}
          style={{ width: 120 }}
          className={
            error && error[name] !== undefined
              ? "StudioBody--right__form__input dimention_err"
              : "StudioBody--right__form__input"
          }
          onChange={(value) => set(value)}
        >
          {property.valueConstraint?.type === "string-enum" &&
            property.valueConstraint?.values.map((e) => (
              <Option key={`${name}-option-${e}`} value={e}>
                {e}
              </Option>
            ))}
        </Select>
      </Col>
    );
  }
  return <></>;
}

function PropertyInput(props: InputType) {
  const { name, property, error } = props;
  return (
    <div className="StudioBody--right__form__infoProject--container">
      <div className="StudioBody--right__form__infoProject">
        <Col span={24}>
          <label
            htmlFor={`${name}-element-type`}
            className="StudioBody--right__form__label main--label"
            // style={{color: "#000", fontWeight: "bold"}}
          >
            {_.startCase(name)}:
          </label>
          <Tooltip placement="bottom" title={property.description}>
            <img src={QuestionMark} alt="" />
          </Tooltip>
        </Col>
      </div>
      <div className="StudioBody--right__form__infoProject">
        <Col span={12}>
          <label
            htmlFor={`${name}-element-type`}
            className="StudioBody--right__form__label sub--label"
            // style={{color: "#55555", fontWeight: "thin"}}
          >
            Property
          </label>
        </Col>
        {property.type &&
        property.type.endsWith("string") &&
        name !== "model-format" ? (
          <StringInput {...props} />
        ) : property.type === "string-enum" || name === "model-format" ? (
          // <StringInput {...props} />
          <SelectInput {...props} />
        ) : (
          <NumberInput {...props} />
        )}
      </div>
    </div>
  );
}

export const calculateSizebyDataType = (
  datatype: string,
  lengthInBytes: number
): number => {
  let bytes = 1;
  if (datatype === "u8" || datatype === "i8") bytes = 1;
  if (datatype === "u16" || datatype === "i16") bytes = 2;
  if (datatype === "u32" || datatype === "i32") bytes = 4;
  if (datatype === "u64" || datatype === "i64") bytes = 8;
  if (datatype === "f32") bytes = 4;
  if (datatype === "f64") bytes = 8;
  return Math.ceil(lengthInBytes / bytes);
};

function componentProperties(component: Component): Record<string, Property> {
  switch (component.type) {
    case "capability":
    case "proc-block":
      return component.properties;
    case "model":
      return modelProperties;
    case "output":
      return outputProperties;
    default:
      throw new Error(
        "Typescript makes sure this is unreachable, but eslint insists on the branch anyway 🤷"
      );
  }
}

export default function PropertiesForm() {
  const dispatch = useAppDispatch();
  const id = useAppSelector((s) => s.builder.selected?.id);
  const components = useAppSelector((s) => s.builder.components);
  const diagram = useAppSelector((e) => e.flow);
  const { ports, model } = outputPorts(diagram, id);
  const [progressState, setProgressState] = useState({
    show: false,
    active: false,
    done: false,
  });
  const [fileName, setFileName] = useState<string | null>(null);
  const onResourceUpload = async (info: UploadChangeParam<UploadFile<any>>) => {
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

      const wordList = await originFileObj?.arrayBuffer();

      const displayName = _.startCase(fileName.replace(/\..*$/, ""));
      let results: ResourceComponent | undefined = undefined;
      if (wordList && fileName && displayName && id) {
        setFileName(fileName);
        // results = await dispatch(
        //   uploadWordlist({
        //     path: fileName,
        //     wordList,
        //     uploadedFilename: id.replace(/\-/g, ""),
        //   })
        // );
      }

      // if (results && results.meta.requestStatus !== "fulfilled") {
      //   setProgressState({
      //     show: false,
      //     active: false,
      //     done: false,
      //   });
      //   message.error(`${info.file.name} file upload failed with error.`);
      //   return;
      // }

      // if (results && results.meta.requestStatus === "fulfilled") {
      //   message.success(`${fileName} file uploaded successfully`);
      //   setProgressState({
      //     show: false,
      //     active: false,
      //     done: true,
      //   });
      //   return;
      // }
    } catch (err) {
      message.error(`${info.file.name} file upload failed with error ${err}`);
    }
    return;
  };

  // Hack: The StormApplication manages the state of the drawing, but because it
  // lives outside of React and Redux, we need to manually trick Redux into
  // rendering.
  const [, updateState] = useState<unknown>({});
  const forceRefresh = useCallback(() => updateState({}), []);

  if (!id) {
    return null;
  }

  const selectedNode =
    diagram.nodes.filter((n) => n.id === id).length > 0
      ? diagram.nodes.filter((n) => n.id === id)[0]
      : undefined;
  if (!selectedNode) return null;

  let properties: Record<string, Property> = {};
  let propertiesValueMap:
    | Record<string, string | number | undefined>
    | undefined;
  if (selectedNode.data && selectedNode.data.propertiesValueMap) {
    if ((selectedNode as Node<FlowNodeData>).data)
      propertiesValueMap = (selectedNode as Node<FlowNodeData>).data
        ?.propertiesValueMap;
    const componentID = (selectedNode as Node<FlowNodeData>).data?.componentID;
    const selectedComponent = components[componentID];
    if (!selectedComponent) return null;
    if (componentID) properties = componentProperties(selectedComponent);
  }
  if (!properties || !propertiesValueMap) return null;

  const hasAnyPropertyField = Object.entries(properties).length;

  const fields = Object.entries(properties).map(([name, property]) => {
    if (!propertiesValueMap) return null;
    const OutputPorts = [...ports];
    // const setter = async (v: number | string) => {};
    const legiblyDisabled = name === "source";
    return (
      <PropertyInput
        fileName={fileName}
        key={name}
        name={name}
        property={property}
        value={propertiesValueMap[name]}
        set={async (value) => {
          await dispatch({
            type: "UPDATE_PROPERTY",
            payload: {
              node: selectedNode,
              name: name,
              value: value,
              components: components,
            },
          });
          // (await setter(value)) === true ? dispatch(RefreshDimensions()) : null;
        }}
        onUpload={onResourceUpload}
        progressState={progressState}
        ports={OutputPorts}
        // disabled={legiblyDisabled}
        error={selectedNode.data.propertiesErrorMap}
      />
    );
  });

  return (
    <>
      {hasAnyPropertyField ? (
        <div className="StudioBody--right__form__title">
          <div>
            <img src={PropertiesIcon} alt="" />
            <h4>Properties</h4>
          </div>
        </div>
      ) : null}
      <div>{fields}</div>
    </>
  );
}
