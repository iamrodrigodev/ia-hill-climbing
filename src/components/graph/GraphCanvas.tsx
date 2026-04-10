import { useMemo, useRef } from "react";
import { obtenerClavesPasosRuta } from "@/lib/hill-climbing";
import {
  ALTO_VIEWBOX,
  ANCHO_VIEWBOX,
  RADIO_NODO,
  debeResaltarArista,
  limitar,
  obtenerCurvaturaArista,
  obtenerGeometriaCurva,
  unirPosicionesNodos,
  type PuntoGrafo,
} from "@/lib/graph-layout";
import type { GrafoPonderado, Ruta } from "@/lib/types";

type ModoEditorInterno = "select" | "add-node" | "add-edge" | "delete";

interface PropiedadesLienzoGrafo {
  grafo: GrafoPonderado;
  rutaActiva?: Ruta;
  titulo?: string;
  posicionesNodos?: Record<number, PuntoGrafo>;
  etiquetasNodos?: Record<number, string>;
  idNodoSeleccionado?: number | null;
  idOrigenAristaPendiente?: number | null;
  modo?: ModoEditorInterno;
  onClickLienzo?: (x: number, y: number) => void;
  onClickNodo?: (nodeId: number) => void;
  onClickArista?: (edgeId: string) => void;
  onPresionarNodo?: (nodeId: number) => void;
  onMovimientoPuntero?: (x: number, y: number) => void;
  onSoltarPuntero?: () => void;
  altura?: number;
  temaResaltado?: "start" | "progress" | "optimal" | "stop";
}

export function GraphCanvas({
  grafo,
  rutaActiva,
  titulo,
  posicionesNodos,
  etiquetasNodos,
  idNodoSeleccionado,
  idOrigenAristaPendiente,
  modo = "select",
  onClickLienzo,
  onClickNodo,
  onClickArista,
  onPresionarNodo,
  onMovimientoPuntero,
  onSoltarPuntero,
  altura = ALTO_VIEWBOX,
  temaResaltado = "progress",
}: PropiedadesLienzoGrafo) {
  const referenciaSvg = useRef<SVGSVGElement | null>(null);
  const pasosResaltados = rutaActiva ? obtenerClavesPasosRuta(rutaActiva) : new Set<string>();

  const posiciones = useMemo(
    () => unirPosicionesNodos(grafo.nodes, posicionesNodos),
    [grafo.nodes, posicionesNodos],
  );

  const convertirAPuntoSvg = (clienteX: number, clienteY: number): PuntoGrafo | null => {
    const svg = referenciaSvg.current;
    if (!svg) return null;
    const matriz = svg.getScreenCTM();
    if (!matriz) return null;
    const punto = svg.createSVGPoint();
    punto.x = clienteX;
    punto.y = clienteY;
    const transformado = punto.matrixTransform(matriz.inverse());
    return {
      x: limitar(transformado.x, RADIO_NODO + 8, ANCHO_VIEWBOX - RADIO_NODO - 8),
      y: limitar(transformado.y, RADIO_NODO + 8, ALTO_VIEWBOX - RADIO_NODO - 8),
    };
  };

  return (
    <div className={`graph-panel theme-${temaResaltado} ${modo === "add-node" ? "is-add-mode" : ""}`}>
      {titulo ? <p className="graph-title">{titulo}</p> : null}
      <svg
        ref={referenciaSvg}
        viewBox={`0 0 ${ANCHO_VIEWBOX} ${ALTO_VIEWBOX}`}
        style={{ maxHeight: `${altura}px` }}
        role="img"
        aria-label="Grafo interactivo"
        onClick={(evento) => {
          if (!onClickLienzo) return;
          const punto = convertirAPuntoSvg(evento.clientX, evento.clientY);
          if (punto) onClickLienzo(punto.x, punto.y);
        }}
        onPointerMove={(evento) => {
          if (!onMovimientoPuntero) return;
          const punto = convertirAPuntoSvg(evento.clientX, evento.clientY);
          if (punto) onMovimientoPuntero(punto.x, punto.y);
        }}
        onPointerUp={() => {
          if (onSoltarPuntero) onSoltarPuntero();
        }}
      >
        <defs>
          <pattern id="graph-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1.4" cy="1.4" r="1" className="graph-dot" />
          </pattern>
          <marker id="edge-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" className="graph-arrow" />
          </marker>
          <marker id="edge-arrow-active" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" className="graph-arrow-active" />
          </marker>
        </defs>

        <rect x={0} y={0} width={ANCHO_VIEWBOX} height={ALTO_VIEWBOX} className="graph-bg" />

        {grafo.edges.map((arista) => {
          const desde = posiciones[arista.from];
          const hacia = posiciones[arista.to];
          if (!desde || !hacia) return null;

          const curvatura = obtenerCurvaturaArista(grafo, arista.from, arista.to, arista.bidirectional);
          const geometria = obtenerGeometriaCurva(desde, hacia, curvatura);
          const resaltada = debeResaltarArista(arista.from, arista.to, arista.bidirectional, pasosResaltados);
          const claseArista = resaltada ? "graph-edge graph-edge-active" : "graph-edge";
          const marcadorFinal = arista.bidirectional
            ? undefined
            : resaltada
              ? "url(#edge-arrow-active)"
              : "url(#edge-arrow)";

          return (
            <g key={arista.id}>
              <path
                d={geometria.ruta}
                className={claseArista}
                markerEnd={marcadorFinal}
                onClick={(evento) => {
                  evento.stopPropagation();
                  if (onClickArista) onClickArista(arista.id);
                }}
              />
              <rect
                x={geometria.etiquetaX - 20}
                y={geometria.etiquetaY - 12}
                width={40}
                height={18}
                rx={6}
                className={resaltada ? "graph-weight-bg is-active" : "graph-weight-bg"}
              />
              <text
                x={geometria.etiquetaX}
                y={geometria.etiquetaY - 0.5}
                className={resaltada ? "graph-weight-text is-active" : "graph-weight-text"}
              >
                {arista.weight}
              </text>
            </g>
          );
        })}

        {grafo.nodes.map((nodo) => {
          const punto = posiciones[nodo];
          if (!punto) return null;

          const estaSeleccionado = idNodoSeleccionado === nodo;
          const esPendiente = idOrigenAristaPendiente === nodo;
          const claseNodo = esPendiente
            ? "graph-node is-pending"
            : estaSeleccionado
              ? "graph-node is-selected"
              : "graph-node";
          const etiqueta = etiquetasNodos?.[nodo] ?? String(nodo);

          return (
            <g
              key={nodo}
              onPointerDown={(evento) => {
                evento.stopPropagation();
                if (onPresionarNodo) onPresionarNodo(nodo);
              }}
              onClick={(evento) => {
                evento.stopPropagation();
                if (onClickNodo) onClickNodo(nodo);
              }}
            >
              <circle cx={punto.x} cy={punto.y} r={RADIO_NODO} className={claseNodo} />
              <text x={punto.x} y={punto.y + 1} className="graph-node-label">
                {etiqueta}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export type ModoEditor = ModoEditorInterno;
