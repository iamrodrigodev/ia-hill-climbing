import { rutaATexto } from "@/lib/hill-climbing";
import type { CandidatoVecino, IteracionEscalada, ResultadoEscalada } from "@/lib/types";

export interface ConfiguracionDisenoArbol {
  anchoMinimo: number;
  separacionHijos: number;
  margenLateral: number;
  raizY: number;
  separacionNiveles: number;
  caidaRama: number;
  radioNodo: number;
  margenInferior: number;
}

export interface CapaDisenoArbol {
  iteracion: IteracionEscalada;
  padreX: number;
  padreY: number;
  hijoY: number;
  posiciones: number[];
  seleccionadoX: number;
  indiceMejor: number;
}

export interface DisenoArbol {
  ancho: number;
  alto: number;
  raizX: number;
  raizY: number;
  radioNodo: number;
  caidaRama: number;
  capas: CapaDisenoArbol[];
}

const CONFIGURACION_PREDETERMINADA: ConfiguracionDisenoArbol = {
  anchoMinimo: 1000,
  separacionHijos: 175,
  margenLateral: 180,
  raizY: 92,
  separacionNiveles: 188,
  caidaRama: 56,
  radioNodo: 44,
  margenInferior: 130,
};

function esMismoCandidato(a: CandidatoVecino, b: CandidatoVecino): boolean {
  return a.cost === b.cost && rutaATexto(a.route) === rutaATexto(b.route);
}

export function construirDisenoArbol(
  resultado: ResultadoEscalada,
  configuracion: Partial<ConfiguracionDisenoArbol> = {},
): DisenoArbol {
  const c = { ...CONFIGURACION_PREDETERMINADA, ...configuracion };
  const maximoHijos = Math.max(1, ...resultado.iterations.map((iteracion) => iteracion.neighbors.length));
  const ancho = Math.max(c.anchoMinimo, maximoHijos * c.separacionHijos + c.margenLateral);
  const raizX = ancho / 2;
  const raizY = c.raizY;
  const alto = raizY + resultado.iterations.length * c.separacionNiveles + c.margenInferior;

  let padreX = raizX;
  let padreY = raizY;

  const capas: CapaDisenoArbol[] = resultado.iterations.map((iteracion, indice) => {
    const hijoY = raizY + (indice + 1) * c.separacionNiveles;
    const cantidad = iteracion.neighbors.length;
    const separacion = ancho / (cantidad + 1);
    const posiciones = iteracion.neighbors.map((_, indiceHijo) => separacion * (indiceHijo + 1));
    const indiceMejor = iteracion.neighbors.findIndex((candidato) =>
      esMismoCandidato(candidato, iteracion.bestNeighbor),
    );
    const seleccionadoX = indiceMejor >= 0 ? posiciones[indiceMejor] : posiciones[0];
    const capa: CapaDisenoArbol = {
      iteracion,
      padreX,
      padreY,
      hijoY,
      posiciones,
      seleccionadoX,
      indiceMejor,
    };
    padreX = seleccionadoX;
    padreY = hijoY;
    return capa;
  });

  return {
    ancho,
    alto,
    raizX,
    raizY,
    radioNodo: c.radioNodo,
    caidaRama: c.caidaRama,
    capas,
  };
}

export function obtenerClaseNodoArbol(
  textoRuta: string,
  costo: number,
  textoRutaSolucion: string,
  costoSolucion: number,
  esMejor: boolean,
): string {
  if (textoRuta === textoRutaSolucion && costo === costoSolucion) return "tree-node-circle is-solution";
  if (esMejor) return "tree-node-circle is-selected";
  return "tree-node-circle";
}

