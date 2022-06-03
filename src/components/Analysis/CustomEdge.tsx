import React from "react";
import {
  getBezierPath,
  getEdgeCenter,
  getMarkerEnd,
} from "react-flow-renderer";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { ClearSelectedNode } from "../../redux/builderSlice";

// import "./styles.scss";
import deleteSvg from "./icons/delete.svg";

const foreignObjectSize = 40;

const onEdgeClick = (evt, id) => {
  evt.stopPropagation();
  alert(`remove ${id}`);
};

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
  const edges = useAppSelector((s) => s.flow.edges);

  const removeEdge = async () => {
    await dispatch(ClearSelectedNode());
    await dispatch({ type: "DELETE_EDGE", payload: id });
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
        <div>
          <button className="edgebutton" onClick={removeEdge}>
            <img src={deleteSvg} alt="" />
          </button>
        </div>
      </foreignObject>
    </>
  );
}
