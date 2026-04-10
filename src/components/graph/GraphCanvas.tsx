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

type ModoEditor = "select" | "add-node" | "add-edge" | "delete";

interface PropiedadesLienzoGrafo {
  graph: GrafoPonderado;
  activeRoute?: Ruta;
  title?: string;
  nodePositions?: Record<number, PuntoGrafo>;
  nodeLabels?: Record<number, string>;
  selectedNodeId?: number | null;
  pendingEdgeFromId?: number | null;
  mode?: ModoEditor;
  onCanvasClick?: (x: number, y: number) => void;
  onNodeClick?: (nodeId: number) => void;
  onEdgeClick?: (edgeId: string) => void;
  onNodePointerDown?: (nodeId: number) => void;
  onPointerMove?: (x: number, y: number) => void;
  onPointerUp?: () => void;
  height?: number;
  highlightTheme?: "start" | "progress" | "optimal" | "stop";
}

export function GraphCanvas({
  graph,
  activeRoute,
  title,
  nodePositions,
  nodeLabels,
  selectedNodeId,
  pendingEdgeFromId,
  mode = "select",
  onCanvasClick,
  onNodeClick,
  onEdgeClick,
  onNodePointerDown,
  onPointerMove,
  onPointerUp,
  height = ALTO_VIEWBOX,
  highlightTheme = "progress",
}: PropiedadesLienzoGrafo) {
  const referenciaSvg = useRef<SVGSVGElement | null>(null);
  const pasosResaltados = activeRoute ? obtenerClavesPasosRuta(activeRoute) : new Set<string>();

  const posiciones = useMemo(
    () => unirPosicionesNodos(graph.nodes, nodePositions),
    [graph.nodes, nodePositions],
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
    <div className={`graph-panel theme-${highlightTheme} ${mode === "add-node" ? "is-add-mode" : ""}`}>
      {title ? <p className="graph-title">{title}</p> : null}
      <svg
        ref={referenciaSvg}
        viewBox={`0 0 ${ANCHO_VIEWBOX} ${ALTO_VIEWBOX}`}
        style={{ maxHeight: `${height}px` }}
        role="img"
        aria-label="Grafo interactivo"
        onClick={(evento) => {
          if (!onCanvasClick) return;
          if (evento.target !== evento.currentTarget) return;
          const punto = convertirAPuntoSvg(evento.clientX, evento.clientY);
          if (punto) onCanvasClick(punto.x, punto.y);
        }}
        onPointerMove={(evento) => {
          if (!onPointerMove) return;
          const punto = convertirAPuntoSvg(evento.clientX, evento.clientY);
          if (punto) onPointerMove(punto.x, punto.y);
        }}
        onPointerUp={() => {
          if (onPointerUp) onPointerUp();
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

        {graph.edges.map((arista) => {
          const desde = posiciones[arista.from];
          const hacia = posiciones[arista.to];
          if (!desde || !hacia) return null;

          const curvatura = obtenerCurvaturaArista(graph, arista.from, arista.to, arista.bidirectional);
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
                  if (onEdgeClick) onEdgeClick(arista.id);
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

        {graph.nodes.map((nodo) => {
          const punto = posiciones[nodo];
          if (!punto) return null;

          const estaSeleccionado = selectedNodeId === nodo;
          const esPendiente = pendingEdgeFromId === nodo;
          const claseNodo = esPendiente
            ? "graph-node is-pending"
            : estaSeleccionado
              ? "graph-node is-selected"
              : "graph-node";
          const etiqueta = nodeLabels?.[nodo] ?? String(nodo);

          return (
            <g
              key={nodo}
              onPointerDown={(evento) => {
                evento.stopPropagation();
                if (onNodePointerDown) onNodePointerDown(nodo);
              }}
              onClick={(evento) => {
                evento.stopPropagation();
                if (onNodeClick) onNodeClick(nodo);
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

export type EditorMode = ModoEditor;
