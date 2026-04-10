import { useMemo, useRef } from "react";
import { directedEdgeKey, getRouteStepKeys } from "@/lib/hill-climbing";
import type { Route, WeightedGraph } from "@/lib/types";

type EditorMode = "select" | "add-node" | "add-edge" | "delete";

interface Position {
  x: number;
  y: number;
}

interface GraphCanvasProps {
  graph: WeightedGraph;
  activeRoute?: Route;
  title?: string;
  nodePositions?: Record<number, Position>;
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
}

interface CurveGeometry {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  controlX: number;
  controlY: number;
  path: string;
  labelX: number;
  labelY: number;
}

const VIEWBOX_WIDTH = 860;
const VIEWBOX_HEIGHT = 520;
const NODE_RADIUS = 26;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getAutoPositions(nodes: number[]): Record<number, Position> {
  if (nodes.length === 0) return {};
  if (nodes.length === 1) return { [nodes[0]]: { x: VIEWBOX_WIDTH / 2, y: VIEWBOX_HEIGHT / 2 } };

  const centerX = VIEWBOX_WIDTH / 2;
  const centerY = VIEWBOX_HEIGHT / 2;
  const radius = Math.min(210, 120 + nodes.length * 16);
  const result: Record<number, Position> = {};

  nodes.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / nodes.length - Math.PI / 2;
    result[node] = {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  });

  return result;
}

function hasDirectedReverse(graph: WeightedGraph, from: number, to: number): boolean {
  return graph.edges.some((edge) => !edge.bidirectional && edge.from === to && edge.to === from);
}

function getCurveGeometry(
  from: Position,
  to: Position,
  curvature: number,
  radius = NODE_RADIUS,
): CurveGeometry {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;

  const fromX = from.x + ux * radius;
  const fromY = from.y + uy * radius;
  const toX = to.x - ux * radius;
  const toY = to.y - uy * radius;

  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  const controlX = midX + nx * curvature;
  const controlY = midY + ny * curvature;

  const t = 0.5;
  const labelX = (1 - t) * (1 - t) * fromX + 2 * (1 - t) * t * controlX + t * t * toX;
  const labelY = (1 - t) * (1 - t) * fromY + 2 * (1 - t) * t * controlY + t * t * toY;

  return {
    fromX,
    fromY,
    toX,
    toY,
    controlX,
    controlY,
    path: `M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`,
    labelX,
    labelY,
  };
}

function shouldHighlightEdge(edgeFrom: number, edgeTo: number, bidirectional: boolean, steps: Set<string>): boolean {
  if (steps.has(directedEdgeKey(edgeFrom, edgeTo))) return true;
  if (bidirectional && steps.has(directedEdgeKey(edgeTo, edgeFrom))) return true;
  return false;
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
}: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const steps = activeRoute ? getRouteStepKeys(activeRoute) : new Set<string>();

  const positions = useMemo(() => {
    const base = getAutoPositions(graph.nodes);
    if (!nodePositions) return base;
    const merged: Record<number, Position> = {};
    graph.nodes.forEach((node) => {
      const custom = nodePositions[node];
      merged[node] = custom ?? base[node];
    });
    return merged;
  }, [graph.nodes, nodePositions]);

  const toSvgPoint = (clientX: number, clientY: number): Position | null => {
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
    <div className={`graph-panel ${mode === "add-node" ? "is-add-mode" : ""}`}>
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

          const reverseDirected = hasDirectedReverse(graph, edge.from, edge.to);
          const sign = edge.from < edge.to ? 1 : -1;
          const curvature = edge.bidirectional ? 18 * sign : reverseDirected ? 36 * sign : 24 * sign;
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
              <rect x={geometry.labelX - 20} y={geometry.labelY - 12} width={40} height={18} rx={6} className="graph-weight-bg" />
              <text x={geometry.labelX} y={geometry.labelY - 0.5} className="graph-weight-text">
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
