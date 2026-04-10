import { createEdge } from "@/lib/hill-climbing";
import type { GraphPreset, HillClimbResult, WeightedGraph } from "@/lib/types";

export const baseGraph: WeightedGraph = {
  nodes: [0, 1, 2, 3],
  edges: [
    createEdge(0, 1, 200, true, "e01"),
    createEdge(0, 2, 600, true, "e02"),
    createEdge(0, 3, 100, true, "e03"),
    createEdge(1, 2, 300, true, "e12"),
    createEdge(1, 3, 100, true, "e13"),
    createEdge(2, 3, 400, true, "e23"),
  ],
};

const denseGraph: WeightedGraph = {
  nodes: [0, 1, 2, 3],
  edges: [
    createEdge(0, 1, 500, true, "d01"),
    createEdge(0, 2, 200, true, "d02"),
    createEdge(0, 3, 300, true, "d03"),
    createEdge(1, 2, 100, true, "d12"),
    createEdge(1, 3, 450, true, "d13"),
    createEdge(2, 3, 150, true, "d23"),
  ],
};

export const presets: GraphPreset[] = [
  {
    id: "base",
    label: "Caso base clase",
    description: "El ejemplo exacto del enunciado, con ruta inicial 0231.",
    graph: baseGraph,
    defaultRoute: [0, 2, 3, 1],
  },
  {
    id: "dense",
    label: "Caso alternativo",
    description: "Escenario adicional para validar el flujo con otros costos.",
    graph: denseGraph,
    defaultRoute: [0, 3, 1, 2],
  },
];

export const baseRun: HillClimbResult = {
  startRoute: [0, 2, 3, 1],
  startCost: 1100,
  iterations: [
    {
      iteration: 1,
      currentRoute: [0, 2, 3, 1],
      currentCost: 1100,
      neighbors: [
        { route: [2, 0, 3, 1], cost: 800, swap: [0, 1] },
        { route: [3, 2, 0, 1], cost: 1200, swap: [0, 2] },
        { route: [1, 2, 3, 0], cost: 800, swap: [0, 3] },
        { route: [0, 3, 2, 1], cost: 800, swap: [1, 2] },
        { route: [0, 1, 3, 2], cost: 700, swap: [1, 3] },
        { route: [0, 2, 1, 3], cost: 1000, swap: [2, 3] },
      ],
      bestNeighbor: { route: [0, 1, 3, 2], cost: 700, swap: [1, 3] },
      moved: true,
    },
    {
      iteration: 2,
      currentRoute: [0, 1, 3, 2],
      currentCost: 700,
      neighbors: [
        { route: [1, 0, 3, 2], cost: 700, swap: [0, 1] },
        { route: [3, 1, 0, 2], cost: 900, swap: [0, 2] },
        { route: [2, 1, 3, 0], cost: 500, swap: [0, 3] },
        { route: [0, 3, 1, 2], cost: 500, swap: [1, 2] },
        { route: [0, 2, 3, 1], cost: 1100, swap: [1, 3] },
        { route: [0, 1, 2, 3], cost: 900, swap: [2, 3] },
      ],
      bestNeighbor: { route: [2, 1, 3, 0], cost: 500, swap: [0, 3] },
      moved: true,
    },
    {
      iteration: 3,
      currentRoute: [2, 1, 3, 0],
      currentCost: 500,
      neighbors: [
        { route: [1, 2, 3, 0], cost: 800, swap: [0, 1] },
        { route: [3, 1, 2, 0], cost: 1000, swap: [0, 2] },
        { route: [0, 1, 3, 2], cost: 700, swap: [0, 3] },
        { route: [2, 3, 1, 0], cost: 700, swap: [1, 2] },
        { route: [2, 0, 3, 1], cost: 800, swap: [1, 3] },
        { route: [2, 1, 0, 3], cost: 500, swap: [2, 3] },
      ],
      bestNeighbor: { route: [2, 3, 1, 0], cost: 700, swap: [1, 2] },
      moved: false,
    },
  ],
  solutionRoute: [2, 1, 3, 0],
  solutionCost: 500,
  solutionIteration: 2,
  stopReason: "local-optimum",
};

export const baseCaseExpectedText = {
  startRoute: "0231",
  startCost: 1100,
  bestLocalRoute: "2130",
  bestLocalCost: 500,
};
