import type {
  AristaGrafo,
  CandidatoVecino,
  GrafoPonderado,
  IteracionEscalada,
  ResultadoEscalada,
  Ruta,
} from "@/lib/types";

export function claveAristaDirigida(desde: number, hacia: number): string {
  return `${desde}->${hacia}`;
}

export function claveAristaNoDirigida(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function clonarGrafo(grafo: GrafoPonderado): GrafoPonderado {
  return {
    nodes: [...grafo.nodes],
    edges: grafo.edges.map((arista) => ({ ...arista })),
  };
}

export function crearArista(
  desde: number,
  hacia: number,
  peso: number,
  bidireccional: boolean,
  id?: string,
): AristaGrafo {
  return {
    id: id ?? `${desde}-${hacia}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    from: desde,
    to: hacia,
    weight: Math.max(1, Math.floor(peso)),
    bidirectional: bidireccional,
  };
}

export function buscarArista(grafo: GrafoPonderado, desde: number, hacia: number): AristaGrafo | null {
  for (const arista of grafo.edges) {
    if (arista.from === desde && arista.to === hacia) return arista;
    if (arista.bidirectional && arista.from === hacia && arista.to === desde) return arista;
  }
  return null;
}

export function obtenerCostoArista(grafo: GrafoPonderado, desde: number, hacia: number): number {
  const arista = buscarArista(grafo, desde, hacia);
  return arista ? arista.weight : Number.POSITIVE_INFINITY;
}

export function calcularCostoRuta(ruta: Ruta, grafo: GrafoPonderado): number {
  if (ruta.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < ruta.length - 1; i += 1) {
    const costoArista = obtenerCostoArista(grafo, ruta[i], ruta[i + 1]);
    total += costoArista;
  }
  return total;
}

export function generarVecinosPorIntercambio(
  ruta: Ruta,
): Array<{ route: Ruta; swap: [number, number] }> {
  const vecinos: Array<{ route: Ruta; swap: [number, number] }> = [];
  for (let i = 0; i < ruta.length - 1; i += 1) {
    for (let j = i + 1; j < ruta.length; j += 1) {
      const siguiente = [...ruta];
      [siguiente[i], siguiente[j]] = [siguiente[j], siguiente[i]];
      vecinos.push({ route: siguiente, swap: [i, j] });
    }
  }
  return vecinos;
}

export function escalarColina(grafo: GrafoPonderado, rutaInicial: Ruta, maxIteraciones = 50): ResultadoEscalada {
  let rutaActual = [...rutaInicial];
  let costoActual = calcularCostoRuta(rutaActual, grafo);
  const iteraciones: IteracionEscalada[] = [];
  const maxIteracionesSeguro = Math.max(1, Math.floor(maxIteraciones));

  // Con menos de 2 nodos no hay vecinos para comparar, por lo que ya es óptimo local.
  if (rutaActual.length < 2) {
    return {
      startRoute: [...rutaInicial],
      startCost: costoActual,
      iterations: iteraciones,
      solutionRoute: rutaActual,
      solutionCost: costoActual,
      solutionIteration: 0,
      stopReason: "local-optimum",
    };
  }

  for (let numeroIteracion = 1; numeroIteracion <= maxIteracionesSeguro; numeroIteracion += 1) {
    const vecinos: CandidatoVecino[] = generarVecinosPorIntercambio(rutaActual).map((vecino) => ({
      route: vecino.route,
      swap: vecino.swap,
      cost: calcularCostoRuta(vecino.route, grafo),
    }));

    if (vecinos.length === 0) {
      return {
        startRoute: [...rutaInicial],
        startCost: calcularCostoRuta(rutaInicial, grafo),
        iterations: iteraciones,
        solutionRoute: rutaActual,
        solutionCost: costoActual,
        solutionIteration: numeroIteracion - 1,
        stopReason: "local-optimum",
      };
    }

    const mejorVecino = vecinos.reduce((mejor, candidato) =>
      candidato.cost < mejor.cost ? candidato : mejor,
    );
    const seMovio = mejorVecino.cost < costoActual;

    iteraciones.push({
      iteration: numeroIteracion,
      currentRoute: [...rutaActual],
      currentCost: costoActual,
      neighbors: vecinos,
      bestNeighbor: mejorVecino,
      moved: seMovio,
    });

    if (!seMovio) {
      return {
        startRoute: [...rutaInicial],
        startCost: calcularCostoRuta(rutaInicial, grafo),
        iterations: iteraciones,
        solutionRoute: rutaActual,
        solutionCost: costoActual,
        solutionIteration: numeroIteracion - 1,
        stopReason: "local-optimum",
      };
    }

    rutaActual = [...mejorVecino.route];
    costoActual = mejorVecino.cost;
  }

  return {
    startRoute: [...rutaInicial],
    startCost: calcularCostoRuta(rutaInicial, grafo),
    iterations: iteraciones,
    solutionRoute: rutaActual,
    solutionCost: costoActual,
    solutionIteration: maxIteracionesSeguro,
    stopReason: "max-iterations",
  };
}

export function rutaATexto(ruta: Ruta): string {
  return ruta.join("");
}

export function parsearRuta(entrada: string): Ruta {
  const texto = entrada.trim();
  if (!texto) return [];

  const tieneSeparadores = /[\s,;-]/.test(texto);
  if (tieneSeparadores) {
    return texto
      .split(/[\s,;-]+/)
      .map((valor) => Number(valor))
      .filter((valor) => Number.isInteger(valor) && valor >= 0);
  }

  return texto
    .split("")
    .map((caracter) => Number(caracter))
    .filter((valor) => Number.isInteger(valor) && valor >= 0);
}

export function esRutaValida(ruta: Ruta, nodos: number[]): boolean {
  if (ruta.length !== nodos.length) return false;
  const conjuntoRuta = new Set(ruta);
  if (conjuntoRuta.size !== ruta.length) return false;
  return ruta.every((nodo) => nodos.includes(nodo));
}

export function grafoCompletoAleatorio(
  nodos: number[],
  minimo = 100,
  maximo = 900,
  paso = 100,
): GrafoPonderado {
  const rango = Math.floor((maximo - minimo) / paso) + 1;
  const aristas: AristaGrafo[] = [];

  for (let i = 0; i < nodos.length; i += 1) {
    for (let j = i + 1; j < nodos.length; j += 1) {
      const peso = minimo + Math.floor(Math.random() * rango) * paso;
      aristas.push(crearArista(nodos[i], nodos[j], peso, true));
    }
  }

  return {
    nodes: [...nodos],
    edges: aristas,
  };
}

export function obtenerClavesPasosRuta(ruta: Ruta): Set<string> {
  const pasos = new Set<string>();
  for (let i = 0; i < ruta.length - 1; i += 1) {
    pasos.add(claveAristaDirigida(ruta[i], ruta[i + 1]));
  }
  return pasos;
}

// Aliases de compatibilidad temporal.
export const directedEdgeKey = claveAristaDirigida;
export const undirectedEdgeKey = claveAristaNoDirigida;
export const cloneGraph = clonarGrafo;
export const createEdge = crearArista;
export const findEdge = buscarArista;
export const getEdgeCost = obtenerCostoArista;
export const calculateRouteCost = calcularCostoRuta;
export const generateSwapNeighbors = generarVecinosPorIntercambio;
export const hillClimb = escalarColina;
export const routeToString = rutaATexto;
export const parseRoute = parsearRuta;
export const isRouteValid = esRutaValida;
export const randomCompleteGraph = grafoCompletoAleatorio;
export const getRouteStepKeys = obtenerClavesPasosRuta;
