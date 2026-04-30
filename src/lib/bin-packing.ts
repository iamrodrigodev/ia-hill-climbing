import type { Ruta } from "./types";

export const BIN_CAPACITY = 100;

export function genBP(n: number, cap: number = BIN_CAPACITY): number[] {
  return Array.from({ length: n }, () => Math.floor(Math.random() * (cap / 2)) + 1);
}

export function bpFitness(assignment: Ruta, weights: number[], cap: number): number {
  const loads: Record<number, number> = {};
  for (let i = 0; i < assignment.length; i++) {
    const b = assignment[i];
    loads[b] = (loads[b] || 0) + weights[i];
    if (loads[b] > cap) return 1000000;
  }
  return new Set(assignment).size;
}

export function bpNeighbor(assignment: Ruta, weights: number[], cap: number): Ruta {
  const newAsgn = [...assignment];
  const n = assignment.length;
  const bins = Array.from(new Set(newAsgn));
  
  const loads: Record<number, number> = {};
  const binItems: Record<number, number[]> = {};
  
  for (let i = 0; i < newAsgn.length; i++) {
    const b = newAsgn[i];
    loads[b] = (loads[b] || 0) + weights[i];
    if (!binItems[b]) binItems[b] = [];
    binItems[b].push(i);
  }

  const r = Math.random();

  if (r < 0.5 && bins.length > 1) {
    const lightest = bins.reduce((a, b) => (loads[a] < loads[b] ? a : b));
    const itemsInLightest = binItems[lightest];
    const itemIdx = itemsInLightest[Math.floor(Math.random() * itemsInLightest.length)];
    
    const candidates = bins.filter(b => b !== lightest && (loads[b] || 0) + weights[itemIdx] <= cap);
    if (candidates.length > 0) {
      newAsgn[itemIdx] = candidates[Math.floor(Math.random() * candidates.length)];
    }
  } else if (r < 0.8 && bins.length > 1) {
    const [b1, b2] = bins.sort(() => 0.5 - Math.random()).slice(0, 2);
    const items1 = binItems[b1];
    const items2 = binItems[b2];
    if (items1 && items2) {
      const i1 = items1[Math.floor(Math.random() * items1.length)];
      const i2 = items2[Math.floor(Math.random() * items2.length)];
      
      const nl1 = loads[b1] - weights[i1] + weights[i2];
      const nl2 = loads[b2] - weights[i2] + weights[i1];
      
      if (nl1 <= cap && nl2 <= cap) {
        newAsgn[i1] = b2;
        newAsgn[i2] = b1;
      }
    }
  } else {
    const itemIdx = Math.floor(Math.random() * n);
    newAsgn[itemIdx] = Math.max(...bins) + 1;
  }

  const remap: Record<number, number> = {};
  let c = 0;
  return newAsgn.map(b => {
    if (remap[b] === undefined) {
      remap[b] = c++;
    }
    return remap[b];
  });
}
