import { claveAristaDirigida } from "@/lib/hill-climbing";
import type { GrafoPonderado } from "@/lib/types";

export interface PuntoGrafo {
  x: number;
  y: number;
}

export interface GeometriaCurva {
  desdeX: number;
  desdeY: number;
  haciaX: number;
  haciaY: number;
  controlX: number;
  controlY: number;
  ruta: string;
  etiquetaX: number;
  etiquetaY: number;
}

export const ANCHO_VIEWBOX = 860;
export const ALTO_VIEWBOX = 520;
export const RADIO_NODO = 26;

export function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.max(minimo, Math.min(maximo, valor));
}

export function obtenerPosicionesAutomaticas(nodos: number[]): Record<number, PuntoGrafo> {
  if (nodos.length === 0) return {};
  if (nodos.length === 1) return { [nodos[0]]: { x: ANCHO_VIEWBOX / 2, y: ALTO_VIEWBOX / 2 } };

  const centroX = ANCHO_VIEWBOX / 2;
  const centroY = ALTO_VIEWBOX / 2;
  const radio = Math.min(210, 120 + nodos.length * 16);
  const posiciones: Record<number, PuntoGrafo> = {};

  nodos.forEach((nodo, indice) => {
    const angulo = (Math.PI * 2 * indice) / nodos.length - Math.PI / 2;
    posiciones[nodo] = {
      x: centroX + Math.cos(angulo) * radio,
      y: centroY + Math.sin(angulo) * radio,
    };
  });

  return posiciones;
}

export function unirPosicionesNodos(
  nodos: number[],
  posicionesPersonalizadas?: Record<number, PuntoGrafo>,
): Record<number, PuntoGrafo> {
  const automaticas = obtenerPosicionesAutomaticas(nodos);
  if (!posicionesPersonalizadas) return automaticas;

  const combinadas: Record<number, PuntoGrafo> = {};
  nodos.forEach((nodo) => {
    combinadas[nodo] = posicionesPersonalizadas[nodo] ?? automaticas[nodo];
  });
  return combinadas;
}

export function tieneReversaDirigida(grafo: GrafoPonderado, desde: number, hacia: number): boolean {
  return grafo.edges.some((arista) => !arista.bidirectional && arista.from === hacia && arista.to === desde);
}

export function obtenerCurvaturaArista(
  grafo: GrafoPonderado,
  desde: number,
  hacia: number,
  bidireccional: boolean,
): number {
  const existeReversa = tieneReversaDirigida(grafo, desde, hacia);
  const signo = desde < hacia ? 1 : -1;
  return bidireccional ? 18 * signo : existeReversa ? 36 * signo : 24 * signo;
}

export function obtenerGeometriaCurva(
  desde: PuntoGrafo,
  hacia: PuntoGrafo,
  curvatura: number,
  radio = RADIO_NODO,
): GeometriaCurva {
  const dx = hacia.x - desde.x;
  const dy = hacia.y - desde.y;
  const largo = Math.hypot(dx, dy) || 1;
  const ux = dx / largo;
  const uy = dy / largo;
  const nx = -uy;
  const ny = ux;

  const desdeX = desde.x + ux * radio;
  const desdeY = desde.y + uy * radio;
  const haciaX = hacia.x - ux * radio;
  const haciaY = hacia.y - uy * radio;

  const medioX = (desdeX + haciaX) / 2;
  const medioY = (desdeY + haciaY) / 2;
  const controlX = medioX + nx * curvatura;
  const controlY = medioY + ny * curvatura;

  const t = 0.5;
  const baseEtiquetaX = (1 - t) * (1 - t) * desdeX + 2 * (1 - t) * t * controlX + t * t * haciaX;
  const baseEtiquetaY = (1 - t) * (1 - t) * desdeY + 2 * (1 - t) * t * controlY + t * t * haciaY;
  const longitudNormal = Math.hypot(nx, ny) || 1;
  const desplazamiento = -Math.sign(curvatura || 1) * 6;
  const etiquetaX = baseEtiquetaX + (nx / longitudNormal) * desplazamiento;
  const etiquetaY = baseEtiquetaY + (ny / longitudNormal) * desplazamiento;

  return {
    desdeX,
    desdeY,
    haciaX,
    haciaY,
    controlX,
    controlY,
    ruta: `M ${desdeX} ${desdeY} Q ${controlX} ${controlY} ${haciaX} ${haciaY}`,
    etiquetaX,
    etiquetaY,
  };
}

export function debeResaltarArista(
  desdeArista: number,
  haciaArista: number,
  bidireccional: boolean,
  pasos: Set<string>,
): boolean {
  if (pasos.has(claveAristaDirigida(desdeArista, haciaArista))) return true;
  if (bidireccional && pasos.has(claveAristaDirigida(haciaArista, desdeArista))) return true;
  return false;
}

