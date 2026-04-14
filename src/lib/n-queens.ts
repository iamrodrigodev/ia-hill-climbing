import type { CandidatoVecino, IteracionEscalada, ResultadoEscalada, Ruta } from "@/lib/types";

export function calcularAtaques(estado: Ruta): number {
  let ataques = 0;
  const n = estado.length;
  
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (estado[i] === estado[j]) ataques += 1;
      if (Math.abs(estado[i] - estado[j]) === Math.abs(i - j)) ataques += 1;
    }
  }
  
  return ataques;
}

export function generarVecinosNReinas(estado: Ruta): CandidatoVecino[] {
  const vecinos: CandidatoVecino[] = [];
  const n = estado.length;

  for (let col = 0; col < n; col += 1) {
    for (let fila = 0; fila < n; fila += 1) {
      if (estado[col] !== fila) {
        const nuevoEstado = [...estado];
        nuevoEstado[col] = fila;
        vecinos.push({
          route: nuevoEstado,
          cost: calcularAtaques(nuevoEstado),
          swap: [col, fila],
        });
      }
    }
  }
  
  return vecinos;
}

export function escalarColinaNReinas(estadoInicial: Ruta, maxIteraciones = 100): ResultadoEscalada {
  let estadoActual = [...estadoInicial];
  let costoActual = calcularAtaques(estadoActual);
  const iteraciones: IteracionEscalada[] = [];

  for (let i = 1; i <= maxIteraciones; i += 1) {
    const vecinos = generarVecinosNReinas(estadoActual);
    
    if (costoActual === 0 || vecinos.length === 0) break;

    const mejorVecino = vecinos.reduce((mejor, candidato) =>
      candidato.cost < mejor.cost ? candidato : mejor
    );

    const seMovio = mejorVecino.cost < costoActual;

    iteraciones.push({
      iteration: i,
      currentRoute: [...estadoActual],
      currentCost: costoActual,
      neighbors: vecinos,
      bestNeighbor: mejorVecino,
      moved: seMovio,
    });

    if (!seMovio) {
      return {
        startRoute: [...estadoInicial],
        startCost: calcularAtaques(estadoInicial),
        iterations: iteraciones,
        solutionRoute: estadoActual,
        solutionCost: costoActual,
        solutionIteration: i - 1,
        stopReason: "local-optimum",
      };
    }

    estadoActual = [...mejorVecino.route];
    costoActual = mejorVecino.cost;
  }

  return {
    startRoute: [...estadoInicial],
    startCost: calcularAtaques(estadoInicial),
    iterations: iteraciones,
    solutionRoute: estadoActual,
    solutionCost: costoActual,
    solutionIteration: iteraciones.length,
    stopReason: costoActual === 0 ? "local-optimum" : "max-iterations",
  };
}

export function generarEstadoAleatorio(n: number): Ruta {
  return Array.from({ length: n }, () => Math.floor(Math.random() * n));
}