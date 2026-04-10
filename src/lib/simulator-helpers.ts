import type { WeightedGraph } from "@/lib/types";
import { createEdge } from "@/lib/hill-climbing";

export interface Point {
  x: number;
  y: number;
}

export function nextNodeId(nodes: number[]): number {
  if (nodes.length === 0) return 0;
  return Math.max(...nodes) + 1;
}

export function formatDefaultRoute(nodes: number[]): string {
  return nodes.join(",");
}

export function parseIterations(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 30;
  return Math.max(1, Math.min(200, Math.floor(parsed)));
}

export function removeNode(graph: WeightedGraph, nodeId: number): WeightedGraph {
  return {
    nodes: graph.nodes.filter((node) => node !== nodeId),
    edges: graph.edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId),
  };
}

export function upsertEdge(
  graph: WeightedGraph,
  from: number,
  to: number,
  weight: number,
  bidirectional: boolean,
): WeightedGraph {
  const kept = graph.edges.filter((edge) => {
    const same = edge.from === from && edge.to === to;
    const reverse = edge.from === to && edge.to === from;
    if (bidirectional) return !(same || reverse);
    if (same) return false;
    if (edge.bidirectional && (same || reverse)) return false;
    return true;
  });

  return {
    ...graph,
    edges: [...kept, createEdge(from, to, weight, bidirectional)],
  };
}

export const BASE_POSITIONS: Record<number, Point> = {
  0: { x: 120, y: 120 },
  1: { x: 350, y: 130 },
  2: { x: 640, y: 130 },
  3: { x: 260, y: 300 },
};
