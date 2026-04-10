import { useMemo, useRef } from "react";
import { getRouteStepKeys } from "@/lib/hill-climbing";
import {
  clamp,
  getCurveGeometry,
  getEdgeCurvature,
  mergeNodePositions,
  NODE_RADIUS,
  shouldHighlightEdge,
  VIEWBOX_HEIGHT,
  VIEWBOX_WIDTH,
  type GraphPoint,
} from "@/lib/graph-layout";
import type { Route, WeightedGraph } from "@/lib/types";

type EditorMode = "select" | "add-node" | "add-edge" | "delete";

interface GraphCanvasProps {
  graph: WeightedGraph;
  activeRoute?: Route;
  title?: string;
  nodePositions?: Record<number, GraphPoint>;
  nodeLabels?: Record<number, string>;
  selectedNodeId?: number | null;
  pendingEdgeFromId?: number | null;
  mode?: EditorMode;
  onCanvasClick?: (x: number, y: number) => void;
  onNodeClick?: (nodeId: number) => void;
  onEdgeClick?: (edgeId: string) => void;
  onNodePointerDown?: (nodeId: number) => void;
  onPointerMove?: (x: number, y: number) => void;
  onPointerUp?: () => void;
  height?: number;
  highlightTheme?: "start" | "progress" | "optimal" | "stop";
}

export function GraphCanvas({
  graph,
  activeRoute,
  title,
  nodePositions,
  nodeLabels,
  selectedNodeId,
  pendingEdgeFromId,
  mode = "select",
  onCanvasClick,
  onNodeClick,
  onEdgeClick,
  onNodePointerDown,
  onPointerMove,
  onPointerUp,
  height = VIEWBOX_HEIGHT,
  highlightTheme = "progress",
}: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const steps = activeRoute ? getRouteStepKeys(activeRoute) : new Set<string>();

  const positions = useMemo(
    () => mergeNodePositions(graph.nodes, nodePositions),
    [graph.nodes, nodePositions],
  );

  const toSvgPoint = (clientX: number, clientY: number): GraphPoint | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const transformed = point.matrixTransform(matrix.inverse());
    return {
      x: clamp(transformed.x, NODE_RADIUS + 8, VIEWBOX_WIDTH - NODE_RADIUS - 8),
      y: clamp(transformed.y, NODE_RADIUS + 8, VIEWBOX_HEIGHT - NODE_RADIUS - 8),
    };
  };

  return (
    <div className={`graph-panel theme-${highlightTheme} ${mode === "add-node" ? "is-add-mode" : ""}`}>
      {title ? <p className="graph-title">{title}</p> : null}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        style={{ maxHeight: `${height}px` }}
        role="img"
        aria-label="Grafo interactivo"
        onClick={(event) => {
          if (!onCanvasClick) return;
          if (event.target !== event.currentTarget) return;
          const point = toSvgPoint(event.clientX, event.clientY);
          if (point) onCanvasClick(point.x, point.y);
        }}
        onPointerMove={(event) => {
          if (!onPointerMove) return;
          const point = toSvgPoint(event.clientX, event.clientY);
          if (point) onPointerMove(point.x, point.y);
        }}
        onPointerUp={() => {
          if (onPointerUp) onPointerUp();
        }}
      >
        <defs>
          <pattern id="graph-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1.4" cy="1.4" r="1" className="graph-dot" />
          </pattern>
          <marker id="edge-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" className="graph-arrow" />
          </marker>
          <marker id="edge-arrow-active" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" className="graph-arrow-active" />
          </marker>
        </defs>

        <rect x={0} y={0} width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} className="graph-bg" />

        {graph.edges.map((edge) => {
          const from = positions[edge.from];
          const to = positions[edge.to];
          if (!from || !to) return null;

          const curvature = getEdgeCurvature(graph, edge.from, edge.to, edge.bidirectional);
          const geometry = getCurveGeometry(from, to, curvature);
          const highlighted = shouldHighlightEdge(edge.from, edge.to, edge.bidirectional, steps);
          const cls = highlighted ? "graph-edge graph-edge-active" : "graph-edge";
          const markerEnd = edge.bidirectional ? undefined : highlighted ? "url(#edge-arrow-active)" : "url(#edge-arrow)";

          return (
            <g key={edge.id}>
              <path
                d={geometry.path}
                className={cls}
                markerEnd={markerEnd}
                onClick={(event) => {
                  event.stopPropagation();
                  if (onEdgeClick) onEdgeClick(edge.id);
                }}
              />
              <rect
                x={geometry.labelX - 20}
                y={geometry.labelY - 12}
                width={40}
                height={18}
                rx={6}
                className={highlighted ? "graph-weight-bg is-active" : "graph-weight-bg"}
              />
              <text
                x={geometry.labelX}
                y={geometry.labelY - 0.5}
                className={highlighted ? "graph-weight-text is-active" : "graph-weight-text"}
              >
                {edge.weight}
              </text>
            </g>
          );
        })}

        {graph.nodes.map((node) => {
          const point = positions[node];
          if (!point) return null;

          const isSelected = selectedNodeId === node;
          const isPending = pendingEdgeFromId === node;
          const nodeClass = isPending ? "graph-node is-pending" : isSelected ? "graph-node is-selected" : "graph-node";
          const label = nodeLabels?.[node] ?? String(node);

          return (
            <g
              key={node}
              onPointerDown={(event) => {
                event.stopPropagation();
                if (onNodePointerDown) onNodePointerDown(node);
              }}
              onClick={(event) => {
                event.stopPropagation();
                if (onNodeClick) onNodeClick(node);
              }}
            >
              <circle cx={point.x} cy={point.y} r={NODE_RADIUS} className={nodeClass} />
              <text x={point.x} y={point.y + 1} className="graph-node-label">
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export type { EditorMode };
