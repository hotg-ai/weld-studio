import {
  getBezierPath,
  getEdgeCenter,
  useReactFlow,
} from "react-flow-renderer";
import { useAppDispatch } from "../../hooks/hooks";
import { ClearSelectedNode } from "../../redux/builderSlice";

// import "./styles.scss";
import deleteSvg from "./icons/delete.svg";

const foreignObjectSize = 40;

type CustomEdgeProps = {
  id: any;
  sourceX: any;
  sourceY: any;
  targetX: any;
  targetY: any;
  sourcePosition: any;
  targetPosition: any;
  style?: any;
  markerEnd?: any;
};

export default function CustomEdge(props: CustomEdgeProps) {
  const dispatch = useAppDispatch();
  const {
    id,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  } = props;

  const pathData = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  };
  const edgePath = getBezierPath(pathData);
  const [edgeCenterX, edgeCenterY] = getEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });
  const { getEdges, setEdges } = useReactFlow();

  const removeEdge = async (e) => {
    await dispatch(ClearSelectedNode());
    const newEdges = getEdges().filter((edge) => edge.id !== id);
    await setEdges(newEdges);
    await dispatch({ type: "SET_EDGES", payload: newEdges });
  };

  return (
    <>
      <path
        id={id}
        style={props.style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={props.markerEnd}
      />
      <foreignObject
        width={foreignObjectSize}
        height={foreignObjectSize}
        x={edgeCenterX - foreignObjectSize / 2}
        y={edgeCenterY - foreignObjectSize / 2}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div className="body">
          <button
            className="edgebutton"
            onClick={(e) => {
              removeEdge(e);
            }}
          >
            <img
              width="8px"
              height="8px"
              style={{ marginTop: "-10px", marginLeft: "-1px" }}
              src={deleteSvg}
              alt=""
            />
          </button>
        </div>
      </foreignObject>
    </>
  );
}
