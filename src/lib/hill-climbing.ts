import type {
  GraphEdge,
  HillClimbIteration,
  HillClimbResult,
  NeighborCandidate,
  Route,
  WeightedGraph,
} from "@/lib/types";

export function directedEdgeKey(from: number, to: number): string {
  return `${from}->${to}`;
}

export function undirectedEdgeKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function cloneGraph(graph: WeightedGraph): WeightedGraph {
  return {
    nodes: [...graph.nodes],
    edges: graph.edges.map((edge) => ({ ...edge })),
  };
}

export function createEdge(
  from: number,
  to: number,
  weight: number,
  bidirectional: boolean,
  id?: string,
): GraphEdge {
  return {
    id: id ?? `${from}-${to}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    from,
    to,
    weight: Math.max(1, Math.floor(weight)),
    bidirectional,
  };
}

export function findEdge(graph: WeightedGraph, from: number, to: number): GraphEdge | null {
  for (const edge of graph.edges) {
    if (edge.from === from && edge.to === to) return edge;
    if (edge.bidirectional && edge.from === to && edge.to === from) return edge;
  }
  return null;
}

export function getEdgeCost(graph: WeightedGraph, from: number, to: number): number {
  const edge = findEdge(graph, from, to);
  return edge ? edge.weight : Number.POSITIVE_INFINITY;
}

export function calculateRouteCost(route: Route, graph: WeightedGraph): number {
  if (route.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < route.length - 1; i += 1) {
    const edgeCost = getEdgeCost(graph, route[i], route[i + 1]);
    total += edgeCost;
  }
  return total;
}

export function generateSwapNeighbors(route: Route): Array<{ route: Route; swap: [number, number] }> {
  const neighbors: Array<{ route: Route; swap: [number, number] }> = [];
  for (let i = 0; i < route.length - 1; i += 1) {
    for (let j = i + 1; j < route.length; j += 1) {
      const next = [...route];
      [next[i], next[j]] = [next[j], next[i]];
      neighbors.push({ route: next, swap: [i, j] });
    }
  }
  return neighbors;
}

export function hillClimb(graph: WeightedGraph, startRoute: Route, maxIterations = 50): HillClimbResult {
  let currentRoute = [...startRoute];
  let currentCost = calculateRouteCost(currentRoute, graph);
  const iterations: HillClimbIteration[] = [];

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const neighbors: NeighborCandidate[] = generateSwapNeighbors(currentRoute).map((neighbor) => ({
      route: neighbor.route,
      swap: neighbor.swap,
      cost: calculateRouteCost(neighbor.route, graph),
    }));

    const bestNeighbor = neighbors.reduce((best, candidate) => (candidate.cost < best.cost ? candidate : best));
    const moved = bestNeighbor.cost < currentCost;

    iterations.push({
      iteration,
      currentRoute: [...currentRoute],
      currentCost,
      neighbors,
      bestNeighbor,
      moved,
    });

    if (!moved) {
      return {
        startRoute: [...startRoute],
        startCost: calculateRouteCost(startRoute, graph),
        iterations,
        solutionRoute: currentRoute,
        solutionCost: currentCost,
        solutionIteration: iteration - 1,
        stopReason: "local-optimum",
      };
    }

    currentRoute = [...bestNeighbor.route];
    currentCost = bestNeighbor.cost;
  }

  return {
    startRoute: [...startRoute],
    startCost: calculateRouteCost(startRoute, graph),
    iterations,
    solutionRoute: currentRoute,
    solutionCost: currentCost,
    solutionIteration: maxIterations,
    stopReason: "max-iterations",
  };
}

export function routeToString(route: Route): string {
  return route.join("");
}

export function parseRoute(input: string): Route {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const hasSeparators = /[\s,;-]/.test(trimmed);
  if (hasSeparators) {
    return trimmed
      .split(/[\s,;-]+/)
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= 0);
  }

  return trimmed
    .split("")
    .map((char) => Number(char))
    .filter((value) => Number.isInteger(value) && value >= 0);
}

export function isRouteValid(route: Route, nodes: number[]): boolean {
  if (route.length !== nodes.length) return false;
  const routeSet = new Set(route);
  if (routeSet.size !== route.length) return false;
  return route.every((node) => nodes.includes(node));
}

export function randomCompleteGraph(nodes: number[], min = 100, max = 900, step = 100): WeightedGraph {
  const span = Math.floor((max - min) / step) + 1;
  const edges: GraphEdge[] = [];

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const weight = min + Math.floor(Math.random() * span) * step;
      edges.push(createEdge(nodes[i], nodes[j], weight, true));
    }
  }

  return {
    nodes: [...nodes],
    edges,
  };
}

export function getRouteStepKeys(route: Route): Set<string> {
  const steps = new Set<string>();
  for (let i = 0; i < route.length - 1; i += 1) {
    steps.add(directedEdgeKey(route[i], route[i + 1]));
  }
  return steps;
}
