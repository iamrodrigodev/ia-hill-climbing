export type IdNodo = number;
export type Ruta = IdNodo[];

export interface AristaGrafo {
  id: string;
  from: IdNodo;
  to: IdNodo;
  weight: number;
  bidirectional: boolean;
}

export interface GrafoPonderado {
  nodes: IdNodo[];
  edges: AristaGrafo[];
}

export interface CandidatoVecino {
  route: Ruta;
  cost: number;
  swap: [number, number];
}

export interface IteracionEscalada {
  iteration: number;
  currentRoute: Ruta;
  currentCost: number;
  neighbors: CandidatoVecino[];
  bestNeighbor: CandidatoVecino;
  moved: boolean;
}

export interface ResultadoEscalada {
  startRoute: Ruta;
  startCost: number;
  iterations: IteracionEscalada[];
  solutionRoute: Ruta;
  solutionCost: number;
  solutionIteration: number;
  stopReason: "local-optimum" | "max-iterations";
}

export interface PreajusteGrafo {
  id: string;
  label: string;
  description: string;
  graph: GrafoPonderado;
  defaultRoute: Ruta;
}

