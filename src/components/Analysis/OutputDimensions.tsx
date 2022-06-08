import { useAppDispatch, useAppSelector } from "./../../hooks/hooks";
import Dimension from "./Dimension";
import { Node } from "react-flow-renderer";
import { PropertiesIcon } from "../../assets";
import { AllElementTypes } from "./model";
import { Port } from "./model/Storm";
import { FlowNodeData } from "./model/FlowNodeComponent";
import { RefreshDimensions } from "../../redux/builderSlice";
import { FlowElements } from "../../redux/reactFlowSlice";
import _ from "lodash";

/**
 * Get all output ports, ordered by their index.
 */
export function outputPorts(
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

  const ports = _.sortBy(model.data.outputs, ["idx"]) || [];
  // const ports = model.data.outputs.sort((a, b) => a.idx - b.idx)
  return { ports, model };
}

// eslint-disable-next-line
export default function OutputDimensions() {
  const dispatch = useAppDispatch();
  const components = useAppSelector((s) => s.builder.components);
  const selected = useAppSelector((s) => s.builder.selected?.id);
  const diagram = useAppSelector((s) => s.flow);
  const refreshDimensions = useAppSelector((s) => s.builder.refreshDimensions);

  // const [, updateState] = useState<unknown>({});
  // const forceRefresh = useCallback(() => updateState({}), []);

  // useEffect(() => {
  //   forceRefresh();
  // }, [refreshDimensions]);

  const { ports, model } = outputPorts(diagram, selected);

  if (!model || (model && !model.data)) return null;
  const component = components[(model.data as FlowNodeData).componentID];
  // const acceptedTypes = component.acceptedOutputElementTypes?.map(
  //   item => item.elementTypes
  // );
  const children = ports.map((port, i) => {
    const acceptedTypes =
      component.acceptedOutputElementTypes?.[i].elementTypes;
    return (
      <Dimension
        selected={selected}
        key={i}
        name={port.label || `Output ${i}`}
        tensor={port.tensor}
        errors={port.errors}
        setTensor={async (t) => {
          await dispatch({
            type: "UPDATE_TENSOR",
            payload: {
              selected: selected,
              ports: ports,
              port: port,
              tensor: t,
            },
          });
          dispatch(RefreshDimensions());
        }}
        acceptedTypes={acceptedTypes ?? [...AllElementTypes]}
      />
    );
  });

  return (
    <>
      {children.length ? (
        <>
          <div className="StudioBody--right__form__title">
            <div>
              <img src={PropertiesIcon} alt="" />
              <h4>Outputs</h4>
            </div>
          </div>
          <div>{children}</div>
        </>
      ) : null}
    </>
  );
}
