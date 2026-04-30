import type { Ruta } from "./types";

export const N_PROC_DEF = 4;

export function genTS(n: number): number[] {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 50) + 1);
}

export function tsFitness(assignment: Ruta, durations: number[], m: number): number {
  const loads = new Array(m).fill(0);
  for (let i = 0; i < assignment.length; i++) {
    loads[assignment[i]] += durations[i];
  }
  return Math.max(...loads);
}

export function tsNeighbor(assignment: Ruta, durations: number[], m: number): Ruta {
  const newAsgn = [...assignment];
  const n = assignment.length;
  const loads = new Array(m).fill(0);
  for (let i = 0; i < n; i++) {
    loads[newAsgn[i]] += durations[i];
  }

  if (Math.random() < 0.6) {
    let heavy = 0;
    let light = 0;
    for (let i = 1; i < m; i++) {
      if (loads[i] > loads[heavy]) heavy = i;
      if (loads[i] < loads[light]) light = i;
    }
    
    if (heavy === light) return newAsgn;
    
    const tasksInHeavy = [];
    for (let i = 0; i < n; i++) {
      if (newAsgn[i] === heavy) tasksInHeavy.push(i);
    }
    
    if (tasksInHeavy.length > 0) {
      const taskIdx = tasksInHeavy[Math.floor(Math.random() * tasksInHeavy.length)];
      newAsgn[taskIdx] = light;
    }
  } else {
    const i = Math.floor(Math.random() * n);
    const j = Math.floor(Math.random() * n);
    if (newAsgn[i] !== newAsgn[j]) {
      const temp = newAsgn[i];
      newAsgn[i] = newAsgn[j];
      newAsgn[j] = temp;
    }
  }

  return newAsgn;
}
