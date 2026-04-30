import type { Ruta } from "./types";

export interface ResultadoAlgoritmo {
  startRoute: Ruta;
  startCost: number;
  iterations: IteracionAlgoritmo[];
  solutionRoute: Ruta;
  solutionCost: number;
  historyBest: number[];
  historyCurrent: number[];
  stopReason: string;
}

export interface IteracionAlgoritmo {
  iteration: number;
  currentRoute: Ruta;
  currentCost: number;
  temp?: number;
}

export function simulatedAnnealing(
  init: Ruta,
  fitnessFn: (s: Ruta) => number,
  neighborFn: (s: Ruta) => Ruta,
  params: {
    T0: number;
    alpha: number;
    L: number;
    maxIter: number;
    Tmin: number;
  }
): ResultadoAlgoritmo {
  let current = [...init];
  let currentFit = fitnessFn(current);
  let best = [...current];
  let bestFit = currentFit;

  const iterations: IteracionAlgoritmo[] = [];
  const historyBest: number[] = [bestFit];
  const historyCurrent: number[] = [currentFit];

  let T = params.T0;
  let iter = 0;

  while (T > params.Tmin && iter < params.maxIter) {
    for (let l = 0; l < params.L; l++) {
      const neighbor = neighborFn(current);
      const neighborFit = fitnessFn(neighbor);
      const delta = neighborFit - currentFit;

      if (delta < 0 || Math.random() < Math.exp(-delta / T)) {
        current = [...neighbor];
        currentFit = neighborFit;

        if (currentFit < bestFit) {
          best = [...current];
          bestFit = currentFit;
        }
      }

      iter++;
      historyBest.push(bestFit);
      historyCurrent.push(currentFit);

      if (iter % 100 === 0 || iter === 1) {
          iterations.push({
            iteration: iter,
            currentRoute: [...current],
            currentCost: currentFit,
            temp: T
          });
      }

      if (iter >= params.maxIter) break;
    }
    T *= params.alpha;
  }

  // Fill up to maxIter if converged early
  while (historyBest.length <= params.maxIter) {
      historyBest.push(bestFit);
      historyCurrent.push(currentFit);
  }

  return {
    startRoute: init,
    startCost: fitnessFn(init),
    iterations,
    solutionRoute: best,
    solutionCost: bestFit,
    historyBest,
    historyCurrent,
    stopReason: T <= params.Tmin ? "Cooled down" : "Max iterations reached"
  };
}

export function hillClimbingGeneric(
  init: Ruta,
  fitnessFn: (s: Ruta) => number,
  neighborFn: (s: Ruta) => Ruta,
  maxIter: number
): ResultadoAlgoritmo {
  let current = [...init];
  let currentFit = fitnessFn(current);
  let best = [...current];
  let bestFit = currentFit;

  const iterations: IteracionAlgoritmo[] = [];
  const historyBest: number[] = [bestFit];
  const historyCurrent: number[] = [currentFit];

  for (let i = 1; i <= maxIter; i++) {
    const neighbor = neighborFn(current);
    const neighborFit = fitnessFn(neighbor);

    if (neighborFit < currentFit) {
      current = [...neighbor];
      currentFit = neighborFit;
      
      if (currentFit < bestFit) {
        best = [...current];
        bestFit = currentFit;
      }
    }

    historyBest.push(bestFit);
    historyCurrent.push(currentFit);

    if (i % 100 === 0 || i === 1) {
        iterations.push({
            iteration: i,
            currentRoute: [...current],
            currentCost: currentFit
        });
    }
  }

  return {
    startRoute: init,
    startCost: fitnessFn(init),
    iterations,
    solutionRoute: best,
    solutionCost: bestFit,
    historyBest,
    historyCurrent,
    stopReason: "Max iterations reached"
  };
}
