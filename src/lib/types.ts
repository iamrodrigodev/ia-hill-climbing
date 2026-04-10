export type NodeId = number;
export type Route = NodeId[];

export interface GraphEdge {
  id: string;
  from: NodeId;
  to: NodeId;
  weight: number;
  bidirectional: boolean;
}

export interface WeightedGraph {
  nodes: NodeId[];
  edges: GraphEdge[];
}

export interface NeighborCandidate {
  route: Route;
  cost: number;
  swap: [number, number];
}

export interface HillClimbIteration {
  iteration: number;
  currentRoute: Route;
  currentCost: number;
  neighbors: NeighborCandidate[];
  bestNeighbor: NeighborCandidate;
  moved: boolean;
}

export interface HillClimbResult {
  startRoute: Route;
  startCost: number;
  iterations: HillClimbIteration[];
  solutionRoute: Route;
  solutionCost: number;
  solutionIteration: number;
  stopReason: "local-optimum" | "max-iterations";
}

export interface GraphPreset {
  id: string;
  label: string;
  description: string;
  graph: WeightedGraph;
  defaultRoute: Route;
}
