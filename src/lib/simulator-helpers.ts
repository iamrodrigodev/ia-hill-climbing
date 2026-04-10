import type { GrafoPonderado } from "@/lib/types";
import { crearArista } from "@/lib/hill-climbing";

export interface Punto {
  x: number;
  y: number;
}

export function siguienteIdNodo(nodos: number[]): number {
  if (nodos.length === 0) return 0;
  return Math.max(...nodos) + 1;
}

export function formatearRutaPorDefecto(nodos: number[]): string {
  return nodos.join(",");
}

export function parsearIteraciones(valor: string): number {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return 30;
  return Math.max(1, Math.min(200, Math.floor(numero)));
}

export function eliminarNodo(grafo: GrafoPonderado, idNodo: number): GrafoPonderado {
  return {
    nodes: grafo.nodes.filter((nodo) => nodo !== idNodo),
    edges: grafo.edges.filter((arista) => arista.from !== idNodo && arista.to !== idNodo),
  };
}

export function agregarOActualizarArista(
  grafo: GrafoPonderado,
  desde: number,
  hacia: number,
  peso: number,
  bidireccional: boolean,
): GrafoPonderado {
  const aristasMantenidas = grafo.edges.filter((arista) => {
    const misma = arista.from === desde && arista.to === hacia;
    const reversa = arista.from === hacia && arista.to === desde;
    if (bidireccional) return !(misma || reversa);
    if (misma) return false;
    if (arista.bidirectional && (misma || reversa)) return false;
    return true;
  });

  return {
    ...grafo,
    edges: [...aristasMantenidas, crearArista(desde, hacia, peso, bidireccional)],
  };
}

export const POSICIONES_BASE: Record<number, Punto> = {
  0: { x: 120, y: 120 },
  1: { x: 350, y: 130 },
  2: { x: 640, y: 130 },
  3: { x: 260, y: 300 },
};

