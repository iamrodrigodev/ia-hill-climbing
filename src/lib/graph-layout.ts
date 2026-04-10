import { directedEdgeKey } from "@/lib/hill-climbing";
import type { WeightedGraph } from "@/lib/types";

export interface GraphPoint {
  x: number;
  y: number;
}

export interface CurveGeometry {
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

export const VIEWBOX_WIDTH = 860;
export const VIEWBOX_HEIGHT = 520;
export const NODE_RADIUS = 26;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getAutoPositions(nodes: number[]): Record<number, GraphPoint> {
  if (nodes.length === 0) return {};
  if (nodes.length === 1) return { [nodes[0]]: { x: VIEWBOX_WIDTH / 2, y: VIEWBOX_HEIGHT / 2 } };

  const centerX = VIEWBOX_WIDTH / 2;
  const centerY = VIEWBOX_HEIGHT / 2;
  const radius = Math.min(210, 120 + nodes.length * 16);
  const result: Record<number, GraphPoint> = {};

  nodes.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / nodes.length - Math.PI / 2;
    result[node] = {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  });

  return result;
}

export function mergeNodePositions(
  nodes: number[],
  customPositions?: Record<number, GraphPoint>,
): Record<number, GraphPoint> {
  const auto = getAutoPositions(nodes);
  if (!customPositions) return auto;

  const merged: Record<number, GraphPoint> = {};
  nodes.forEach((node) => {
    merged[node] = customPositions[node] ?? auto[node];
  });
  return merged;
}

export function hasDirectedReverse(graph: WeightedGraph, from: number, to: number): boolean {
  return graph.edges.some((edge) => !edge.bidirectional && edge.from === to && edge.to === from);
}

export function getEdgeCurvature(graph: WeightedGraph, from: number, to: number, bidirectional: boolean): number {
  const reverseDirected = hasDirectedReverse(graph, from, to);
  const sign = from < to ? 1 : -1;
  return bidirectional ? 18 * sign : reverseDirected ? 36 * sign : 24 * sign;
}

export function getCurveGeometry(
  from: GraphPoint,
  to: GraphPoint,
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
  const baseLabelX = (1 - t) * (1 - t) * fromX + 2 * (1 - t) * t * controlX + t * t * toX;
  const baseLabelY = (1 - t) * (1 - t) * fromY + 2 * (1 - t) * t * controlY + t * t * toY;
  const normalLength = Math.hypot(nx, ny) || 1;
  // Keep label visually attached to its edge while still avoiding nearby nodes.
  const offset = -Math.sign(curvature || 1) * 6;
  const labelX = baseLabelX + (nx / normalLength) * offset;
  const labelY = baseLabelY + (ny / normalLength) * offset;

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

export function shouldHighlightEdge(
  edgeFrom: number,
  edgeTo: number,
  bidirectional: boolean,
  steps: Set<string>,
): boolean {
  if (steps.has(directedEdgeKey(edgeFrom, edgeTo))) return true;
  if (bidirectional && steps.has(directedEdgeKey(edgeTo, edgeFrom))) return true;
  return false;
}
