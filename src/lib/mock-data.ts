import { createEdge, hillClimb } from "@/lib/hill-climbing";
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

export const baseRun: HillClimbResult = hillClimb(baseGraph, [0, 2, 3, 1], 1000);

export const baseCaseExpectedText = {
  startRoute: baseRun.startRoute.join(""),
  startCost: baseRun.startCost,
  bestLocalRoute: baseRun.solutionRoute.join(""),
  bestLocalCost: baseRun.solutionCost,
};
