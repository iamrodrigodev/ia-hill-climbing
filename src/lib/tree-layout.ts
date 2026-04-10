import { routeToString } from "@/lib/hill-climbing";
import type { HillClimbIteration, HillClimbResult, NeighborCandidate } from "@/lib/types";

export interface TreeLayoutConfig {
  minWidth: number;
  childSpacing: number;
  sidePadding: number;
  rootY: number;
  levelGap: number;
  branchDrop: number;
  nodeRadius: number;
  bottomPadding: number;
}

export interface TreeLayerLayout {
  iteration: HillClimbIteration;
  parentX: number;
  parentY: number;
  childY: number;
  positions: number[];
  selectedX: number;
  bestIndex: number;
}

export interface TreeLayout {
  width: number;
  height: number;
  rootX: number;
  rootY: number;
  nodeRadius: number;
  branchDrop: number;
  layers: TreeLayerLayout[];
}

const DEFAULT_CONFIG: TreeLayoutConfig = {
  minWidth: 1000,
  childSpacing: 175,
  sidePadding: 180,
  rootY: 92,
  levelGap: 188,
  branchDrop: 56,
  nodeRadius: 44,
  bottomPadding: 130,
};

function sameCandidate(a: NeighborCandidate, b: NeighborCandidate): boolean {
  return a.cost === b.cost && routeToString(a.route) === routeToString(b.route);
}

export function buildTreeLayout(result: HillClimbResult, config: Partial<TreeLayoutConfig> = {}): TreeLayout {
  const c = { ...DEFAULT_CONFIG, ...config };
  const maxChildren = Math.max(1, ...result.iterations.map((iteration) => iteration.neighbors.length));
  const width = Math.max(c.minWidth, maxChildren * c.childSpacing + c.sidePadding);
  const rootX = width / 2;
  const rootY = c.rootY;
  const height = rootY + result.iterations.length * c.levelGap + c.bottomPadding;

  let parentX = rootX;
  let parentY = rootY;

  const layers: TreeLayerLayout[] = result.iterations.map((iteration, index) => {
    const childY = rootY + (index + 1) * c.levelGap;
    const n = iteration.neighbors.length;
    const spacing = width / (n + 1);
    const positions = iteration.neighbors.map((_, childIndex) => spacing * (childIndex + 1));
    const bestIndex = iteration.neighbors.findIndex((candidate) => sameCandidate(candidate, iteration.bestNeighbor));
    const selectedX = bestIndex >= 0 ? positions[bestIndex] : positions[0];
    const layer: TreeLayerLayout = {
      iteration,
      parentX,
      parentY,
      childY,
      positions,
      selectedX,
      bestIndex,
    };
    parentX = selectedX;
    parentY = childY;
    return layer;
  });

  return {
    width,
    height,
    rootX,
    rootY,
    nodeRadius: c.nodeRadius,
    branchDrop: c.branchDrop,
    layers,
  };
}

export function getTreeNodeClass(
  routeText: string,
  cost: number,
  solutionRouteText: string,
  solutionCost: number,
  isBest: boolean,
): string {
  if (routeText === solutionRouteText && cost === solutionCost) return "tree-node-circle is-solution";
  if (isBest) return "tree-node-circle is-selected";
  return "tree-node-circle";
}
