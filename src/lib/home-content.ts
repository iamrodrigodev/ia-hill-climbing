export const homeContent = {
  hero: {
    title: "Caso base del problema TSP",
    introPrefix: "Solución inicial",
    introMiddle: "con",
    introSuffix: "Hill Climbing evalúa vecinos y termina en",
    introEnd: "con",
  },
  graphCard: {
    title: "Grafo del enunciado",
    description: "Conexiones bidireccionales y pesos del caso de clase.",
    graphTitle: "Ruta inicial: 0231",
  },
  costsCard: {
    title: "Tabla de costos",
    description: "Datos exactos del problema.",
    headers: {
      connection: "Conexión",
      cost: "Costo",
    },
  },
  processCard: {
    title: "Proceso paso a paso",
    description: "Vecinos por iteración, selección y criterio de paro.",
    tabs: {
      steps: "Pasos",
      iterations: "Iteraciones",
      tree: "Árbol",
    },
  },
  stepBlocks: {
    one: {
      title: "1. Inicio",
      prefix: "Estado inicial:",
    },
    two: {
      title: "2. Vecinos",
      text: "En cada iteración se generan swaps y se toma el vecino de menor costo.",
    },
    three: {
      title: "3. Paro",
      prefix: "Se detiene en",
      suffix: "porque ya no hay mejora estricta.",
    },
    bestNeighborPrefix: "Mejor vecino:",
  },
};

export const homeGraphPositions = {
  0: { x: 120, y: 120 },
  1: { x: 350, y: 130 },
  2: { x: 640, y: 130 },
  3: { x: 260, y: 300 },
};

export const homeGraphLabels = {
  0: "0",
  1: "1",
  2: "2",
  3: "3",
};
