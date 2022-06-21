import { useAppSelector } from "./../../hooks/hooks";
import { Node } from "react-flow-renderer";
import _ from "lodash";
import { FlowNodeData } from "./model/FlowNodeComponent";
import { Port } from "./model/Legacy";
import { FlowElements } from "../../redux/reactFlowSlice";

// eslint-disable-next-line
export default function InputDimensions() {
  const components = useAppSelector((s) => s.builder.components);
  const selected = useAppSelector((s) => s.builder.selected?.id);
  const diagram = useAppSelector((s) => s.flow);
  /**
   * Get all input ports, ordered by their index.
   */
  function inputPorts(
    diagram: FlowElements,
    selected: string | undefined
  ): { ports: Port[]; model: Node<FlowNodeData> | undefined } {
    if (!selected) {
      return { ports: [], model: undefined };
    }

    const model: Node<FlowNodeData> = diagram.nodes.filter(
      (e) => e.id === selected
    )[0] as Node<FlowNodeData>;

    if (!model || !model.data) {
      return { ports: [], model: undefined };
    }
    const ports = model.data?.inputs.sort((a, b) => a.idx - b.idx) || [];

    return { ports, model };
  }

  const { ports, model } = inputPorts(diagram, selected);
  if (!model || !model?.data) return null;
  const component = components[(model.data as FlowNodeData).componentID];
  if (!component) return null;

  const children = ports.map((port, i) => {
    const acceptedTypes = component.acceptedInputElementTypes?.[i]
      .elementTypes || [model.data?.inputs[i].tensor.elementType];

    return {
      acceptedTypes,
      name: port.label || `Input ${i}`,
      description: model.data?.inputs[i].tensor.description,
      tensor: port.tensor,
      selected,
    };
  });

  return (
    <>
      {children.length ? (
        <>
          <h3>Node Inputs</h3>
          {children.map(
            ({ name, tensor, selected, description, acceptedTypes }, i) => (
              <div
                className="input-container ant-tag ant-tag-paragraph"
                style={{ width: "100%", marginBottom: "5px" }}
                key={`input_tensor_${i}`}
              >
                <h4>{_.startCase(name)}</h4>
                <h5>Accepted Types</h5>
                <span>{acceptedTypes?.join(", ")}</span>
                <h5>Tensor Shape Example</h5>
                <span>
                  {tensor?.dimensions
                    .map((v, i) => (v === 0 ? "?" : v))
                    .join(", ")}
                </span>
                {description ? (
                  <>
                    <h5>Description</h5>
                    <p>{description}</p>
                  </>
                ) : (
                  <></>
                )}
              </div>
            )
          )}
        </>
      ) : null}
    </>
  );
}
