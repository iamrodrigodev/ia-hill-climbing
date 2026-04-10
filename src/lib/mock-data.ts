import { crearArista, escalarColina } from "@/lib/hill-climbing";
import type { GrafoPonderado, PreajusteGrafo, ResultadoEscalada } from "@/lib/types";

export const grafoBase: GrafoPonderado = {
  nodes: [0, 1, 2, 3],
  edges: [
    crearArista(0, 1, 200, true, "e01"),
    crearArista(0, 2, 600, true, "e02"),
    crearArista(0, 3, 100, true, "e03"),
    crearArista(1, 2, 300, true, "e12"),
    crearArista(1, 3, 100, true, "e13"),
    crearArista(2, 3, 400, true, "e23"),
  ],
};

const grafoDenso: GrafoPonderado = {
  nodes: [0, 1, 2, 3],
  edges: [
    crearArista(0, 1, 500, true, "d01"),
    crearArista(0, 2, 200, true, "d02"),
    crearArista(0, 3, 300, true, "d03"),
    crearArista(1, 2, 100, true, "d12"),
    crearArista(1, 3, 450, true, "d13"),
    crearArista(2, 3, 150, true, "d23"),
  ],
};

export const preajustes: PreajusteGrafo[] = [
  {
    id: "base",
    label: "Caso base clase",
    description: "El ejemplo exacto del enunciado, con ruta inicial 0231.",
    graph: grafoBase,
    defaultRoute: [0, 2, 3, 1],
  },
  {
    id: "dense",
    label: "Caso alternativo",
    description: "Escenario adicional para validar el flujo con otros costos.",
    graph: grafoDenso,
    defaultRoute: [0, 3, 1, 2],
  },
];

export const corridaBase: ResultadoEscalada = escalarColina(grafoBase, [0, 2, 3, 1], 1000);

export const textoEsperadoCasoBase = {
  rutaInicio: corridaBase.startRoute.join(""),
  costoInicio: corridaBase.startCost,
  rutaOptimoLocal: corridaBase.solutionRoute.join(""),
  costoOptimoLocal: corridaBase.solutionCost,
};

