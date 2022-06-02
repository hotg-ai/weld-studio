import _, { trim } from "lodash";
import { KeyboardEvent, useEffect, useState } from "react";
import { Col, Select, Tooltip } from "antd";
import { Tensor, ElementType } from "./model";
import { QuestionMark } from "../../assets";
import { Node } from "react-flow-renderer";
import { calculateSizebyDataType } from "./Properties";
import { FlowNodeData } from "./model/FlowNodeComponent";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
// import { StormApplication } from "../Analysis/StormApplication";
import { PortErrorComponent } from "../Analysis/model/Storm";
import { detectInvalidNodesPort, expressValidationHinting } from "../../utils";
import { isDiagramValid } from "./utils/FlowValidator";
const { Option } = Select;
type Props = {
  name: string;
  tensor: Tensor;
  setTensor: (tensor: Tensor) => void;
  acceptedTypes: ElementType[] | ElementType;
  errors?: PortErrorComponent; // node, component, error message
  kind?: "input" | "output";
  selected?: string;
};

function sanitizeDimensionInput(raw: string): number[] | undefined {
  const numbers = raw
    .split(",")
    .map((word) => word.trim())
    .filter((word) => word.length > 0)
    .map(Number);

  return numbers.every(isFinite) ? numbers : undefined;
}

export default function Dimension({
  name,
  tensor,
  setTensor,
  acceptedTypes,
  kind = "output",
  errors = {}, //Record<string, Record<errorComponent, string>>
  selected,
}: Props) {
  const components = useAppSelector((s) => s.builder.components);
  const diagram = useAppSelector((s) => s.flow);
  const dispatch = useAppDispatch();
  const { elementType, dimensions, description } = tensor;

  const [dimensionText, setDimensionText] = useState("");

  // We need to make sure that whenever our dimension prop changes, the
  // input box is updated to show the new dimensions instead of whatever was
  // there previously.
  //
  // I'm not sure whether this is valid or just a hack because output tensors
  // are attached to the StormApplication instead of React/Redux.
  useEffect(() => {
    setDimensionText(dimensions.join(", "));
  }, [dimensions]);

  useEffect(() => {
    if (dimensions && dimensionText) {
      const result = isDiagramValid(diagram, components);
      if (result.error)
        expressValidationHinting(result.error, undefined, dispatch, [], false);
    }
  }, [dimensionText]);

  if (typeof acceptedTypes === "string") acceptedTypes = [acceptedTypes];
  acceptedTypes = _.flatten(acceptedTypes);

  const onCommitDimensionsText = () => {
    const sanitized = sanitizeDimensionInput(dimensionText);

    if (sanitized) {
      // The user entered a valid list of dimensions, commit the change
      setTensor({ elementType, dimensions: sanitized, description });
    } else {
      // the dimensions were invalid, throw them away
      setDimensionText(dimensions.join(", "));
    }
  };

  // Hack: The canvas listens for *all* backspaces and will delete your
  // current node!
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" || e.key === "Delete") {
      e.stopPropagation();
    } else if (e.key === "Enter") {
      // users tend to press enter when they've finished entering input
      e.stopPropagation();
      onCommitDimensionsText();
    }
  };

  const node: Node<FlowNodeData> = diagram.nodes.filter(
    (e) => e.id === selected
  )[0] as Node<FlowNodeData>;

  const legiblyDisabled =
    (kind === "output" && node.data.type === "model") ||
    (kind === "output" &&
      node.data.type === "capability" &&
      [
        "capability/accel",
        "capability/raw",
        "capability/image",
        "capability/sound",
      ].includes(node.data.componentID, 0));

  const elementTypes = acceptedTypes?.map((e) => (
    <Option key={e} value={e}>
      {e}
    </Option>
  ));

  if (node && node.data)
    return (
      <div>
        <div className="StudioBody--right__form__infoProject">
          <Col span={24}>
            <label
              htmlFor={`${name}-element-type`}
              className="StudioBody--right__form__label"
            >
              {_.startCase(name)}
            </label>
            {tensor?.description && (
              <Tooltip placement="bottom" title={tensor.description}>
                <img src={QuestionMark} alt="" />
              </Tooltip>
            )}
          </Col>
        </div>
        <div className="StudioBody--right__form__infoProject">
          <Col span={12}>
            <div className={errors?.type !== undefined ? "dimention_err" : ""}>
              <label
                htmlFor={`${name}-element-type`}
                className="StudioBody--right__form__label"
              >
                Element Type
              </label>
            </div>
          </Col>
          <Col span={12}>
            <Select
              disabled={true}
              style={{
                color: legiblyDisabled ? "rgba(255, 255, 255, 1)" : "",
              }}
              defaultValue={elementType}
              value={elementType}
              id={`${name}-element-type`}
              onBlur={() => {
                // if (errors.dims === undefined && errors.type === undefined) {
                //   detectInvalidNodesPort(errors.portId, "valid");
                // }
              }}
              className={
                errors?.type !== undefined
                  ? "StudioBody--right__form__input dimention_err"
                  : "StudioBody--right__form__input"
              }
              onChange={(value) => {
                let s = dimensions;
                if (name === "data") {
                  const length = node.data?.propertiesValueMap[
                    "length"
                  ] as number;
                  const dimText = calculateSizebyDataType(
                    value,
                    length
                  ).toString();
                  setDimensionText(dimText);
                  const sanitized = sanitizeDimensionInput(dimText);
                  if (sanitized) s = sanitized;
                }
                setTensor({
                  elementType: value,
                  dimensions: s,
                  description,
                });
              }}
            >
              {elementTypes}
            </Select>
          </Col>
        </div>
        <div className="StudioBody--right__form__infoProject">
          <Col span={12}>
            <div className={errors?.dims !== undefined ? "dimention_err" : ""}>
              <label
                htmlFor={`${name}-dimensions`}
                className="StudioBody--right__form__label"
              >
                Dimensions
              </label>
            </div>
          </Col>
          <Col span={12}>
            <input
              disabled={true}
              style={{
                color: legiblyDisabled ? "rgba(255, 255, 255, 1)" : "",
              }}
              type="text"
              className={
                errors?.dims !== undefined
                  ? "StudioBody--right__form__input dimention_err"
                  : "StudioBody--right__form__input"
              }
              name={`${name}-dimensions`}
              id={`${name}-dimensions`}
              value={dimensionText}
              onChange={(e) => {
                setDimensionText(e.target.value);
              }}
              onBlur={() => {
                onCommitDimensionsText();
              }}
              onKeyDownCapture={onKeyDown}
              pattern="\d*|(\d+\s*,\s*)|(\d+(\s*,\s*\d+)*)"
            />
          </Col>
        </div>
        {errors?.type !== undefined ? (
          <label style={{ fontSize: "10px", color: "#ff00e5" }}>
            Invalid type ({tensor.elementType}) selected for downstream port
            which accepts: ({errors?.type}){" "}
          </label>
        ) : (
          <></>
        )}
        {errors?.dims !== undefined ? (
          <label style={{ fontSize: "10px", color: "#ff00e5" }}>
            Invalid dims [{tensor.dimensions.join(",")}] selected for downstream
            port which accepts: [{errors?.dims}]{" "}
          </label>
        ) : (
          <></>
        )}
      </div>
    );
  else return null;
}
