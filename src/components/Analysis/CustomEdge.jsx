import React from "react";
import {
  getBezierPath,
  getEdgeCenter,
  getMarkerEnd,
} from "react-flow-renderer";
import { useAppDispatch, useAppSelector } from "src/hooks/hooks";
import { ClearSelectedNode } from "src/redux/builderSlice";

import "./styles.scss";
import deleteSvg from "./img/icons/delete.svg";

const foreignObjectSize = 40;

const onEdgeClick = (evt, id) => {
  evt.stopPropagation();
  alert(`remove ${id}`);
};

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) {
  const dispatch = useAppDispatch();
  const edgePath = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
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
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <foreignObject
        width={foreignObjectSize}
        height={foreignObjectSize}
        x={edgeCenterX - foreignObjectSize / 2}
        y={edgeCenterY - foreignObjectSize / 2}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <body>
          <button className="edgebutton" onClick={removeEdge}>
            <img src={deleteSvg} alt="" />
          </button>
        </body>
      </foreignObject>
    </>
  );
}
