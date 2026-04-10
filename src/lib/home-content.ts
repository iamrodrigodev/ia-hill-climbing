export const homeContent = {
  hero: {
    title: "Caso base guiado del problema TSP",
    introPrefix: "Solución inicial",
    introMiddle: "con",
    introSuffix: "Hill Climbing evalúa vecinos generados por swaps y termina en",
    introEnd: "con",
    tspExplanation:
      "Este es un ejemplo del Problema del Viajante de Comercio (TSP): visitar cada nodo una vez y regresar al punto de partida con el menor costo total.",
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
    description: "Avanza paso a paso para ver costos, vecinos y decisiones del algoritmo Hill Climbing.",
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
      text: "En cada iteración se generan vecinos intercambiando dos nodos en la ruta actual. Cada vecino recibe un costo total F y se elige el más bajo.",
    },
    three: {
      title: "3. Paro",
      prefix: "Se detiene en",
      suffix: "porque no existe un vecino con costo menor.",
    },
    bestNeighborPrefix: "Mejor vecino:",
    bestNeighborAction: {
      moved: "Se mueve porque hay mejora.",
      stopped: "No se mueve porque no hay mejora.",
    },
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
