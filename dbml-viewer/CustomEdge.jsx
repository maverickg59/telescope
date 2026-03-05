import React from 'react';
import { getSmoothStepPath, BaseEdge } from '@xyflow/react';

export default function CustomEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style,
}) {
  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 8,
  });

  return <BaseEdge id={id} path={edgePath} style={style} />;
}
