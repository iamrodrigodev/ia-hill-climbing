<div align="center">
  <table>
    <thead>
      <tr>
        <th>
          <img src="https://github.com/RodrigoStranger/imagenes-la-salle/blob/main/logo_secundario_color.png?raw=true" width="150" />
        </th>
        <th>
          <span style="font-weight:bold;">UNIVERSIDAD LA SALLE DE AREQUIPA</span><br />
          <span style="font-weight:bold;">FACULTAD DE INGENIERÍAS Y ARQUITECTURA</span><br />
          <span style="font-weight:bold;">DEPARTAMENTO ACADEMICO DE INGENIERÍA Y MATEMÁTICAS</span><br />
          <span style="font-weight:bold;">CARRERA PROFESIONAL DE INGENIERÍA DE SOFTWARE</span>
        </th>
      </tr>
    </thead>
  </table>
</div>

<div align="center">
  <h2 style="font-weight:bold;">TAREA 1</h2>
</div>

## Curso

- Curso: Inteligencia Artificial
- Docente: Vicente Enrique Machaca Arceda
- Semestre: 10 mo semestre

## Integrantes

1. Rodrigo Emerson Infanzon Acosta
2. Carlos Daniel Aguilar Chirinos
3. Diego Alessandro Alvarez Cruz
4. Piero Omar De La Cruz Mancilla
5. Iben Omar Flores Polanco

## Tecnologias utilizadas

[![React][React]][react-site]
[![TypeScript][TypeScript]][ts-site]
[![Vite][Vite]][vite-site]
[![React Router][ReactRouter]][rr-site]
[![Radix UI][RadixUI]][radix-site]
[![Framer Motion][FramerMotion]][framer-site]
[![Lucide][Lucide]][lucide-site]
[![Tailwind Merge][TailwindMerge]][twmerge-site]
[![CVA][CVA]][cva-site]
[![Sonner][Sonner]][sonner-site]
[![Git][Git]][git-site]
[![GitHub][GitHub]][github-site]

[React]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[react-site]: https://react.dev/
[TypeScript]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[ts-site]: https://www.typescriptlang.org/
[Vite]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[vite-site]: https://vitejs.dev/
[ReactRouter]: https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white
[rr-site]: https://reactrouter.com/
[RadixUI]: https://img.shields.io/badge/Radix_UI-111827?style=for-the-badge
[radix-site]: https://www.radix-ui.com/
[FramerMotion]: https://img.shields.io/badge/Framer_Motion-000000?style=for-the-badge&logo=framer&logoColor=white
[framer-site]: https://www.framer.com/motion/
[Lucide]: https://img.shields.io/badge/Lucide-111827?style=for-the-badge
[lucide-site]: https://lucide.dev/
[TailwindMerge]: https://img.shields.io/badge/tailwind--merge-0EA5E9?style=for-the-badge
[twmerge-site]: https://github.com/dcastil/tailwind-merge
[CVA]: https://img.shields.io/badge/class--variance--authority-111827?style=for-the-badge
[cva-site]: https://cva.style/docs
[Sonner]: https://img.shields.io/badge/Sonner-111827?style=for-the-badge
[sonner-site]: https://sonner.emilkowal.ski/
[Git]: https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white
[git-site]: https://git-scm.com/
[GitHub]: https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white
[github-site]: https://github.com/

## TAREA 1

| Criterio de rúbrica | Cumplimiento |
|---|---|
| Implementación del algoritmo | Se implementó Hill Climbing para TSP (viajero) con evaluación de vecinos, selección del mejor vecino y condición de parada por óptimo local. |
| Implementación de un visualizador del árbol de soluciones (similar a clase) | Se implementó visualización del árbol por iteraciones con nodo raíz, vecinos, camino seleccionado y navegación paso a paso. |
| Evaluar HC en otro problema diferente a TSP | Se implementó y evaluó Hill Climbing para N-Reinas en la ruta `/n-reinas`, mostrando estado inicial, iteraciones, costos y estado final. |

## Algoritmos implementados (qué, cómo y dónde)

### 1) Hill Climbing para TSP

- Qué resuelve: minimiza el costo total de una ruta que recorre todos los nodos del grafo.
- Dónde está en código TypeScript: `src/lib/hill-climbing.ts`.
- Cómo funciona:
1. Calcula el costo de la ruta actual con `calcularCostoRuta`.
2. Genera vecinos intercambiando posiciones de nodos con `generarVecinosPorIntercambio`.
3. Evalúa todos los vecinos y selecciona el mejor (menor costo) en `escalarColina`.
4. Si el mejor vecino mejora estrictamente (`<`), se mueve a ese vecino.
5. Si no mejora, se detiene en óptimo local.

Código base (fragmento):

```ts
const mejorVecino = vecinos.reduce((mejor, candidato) =>
  candidato.cost < mejor.cost ? candidato : mejor,
);

const seMovio = mejorVecino.cost < costoActual;

if (!seMovio) {
  return {
    solutionRoute: rutaActual,
    solutionCost: costoActual,
    stopReason: "local-optimum",
  };
}
```

### 2) Hill Climbing para N-Reinas

- Qué resuelve: minimiza la cantidad de ataques entre reinas en un tablero de tamaño `N x N`.
- Dónde está en código TypeScript: `src/lib/n-queens.ts`.
- Cómo funciona:
1. Representa un estado como arreglo: índice = columna, valor = fila de la reina.
2. Calcula conflictos con `calcularAtaques`.
3. Genera vecinos moviendo una reina dentro de su columna con `generarVecinosNReinas`.
4. En `escalarColinaNReinas`, elige el vecino con menor número de ataques.
5. Si hay mejora estricta (`<`), avanza; si no, se detiene en óptimo local.

Código base (fragmento):

```ts
export function calcularAtaques(estado: number[]): number {
  let ataques = 0;
  for (let i = 0; i < estado.length; i += 1) {
    for (let j = i + 1; j < estado.length; j += 1) {
      if (estado[i] === estado[j]) ataques += 1;
      if (Math.abs(estado[i] - estado[j]) === Math.abs(i - j)) ataques += 1;
    }
  }
  return ataques;
}
```

## Ejecución del proyecto

```bash
npm install
npm run dev
```

## Rutas principales

- `/`: Inicio y caso base TSP con explicación paso a paso.
- `/constructor`: Constructor interactivo de grafos y ejecución de Hill Climbing.
- `/n-reinas`: Evaluación de Hill Climbing en N-Reinas.
