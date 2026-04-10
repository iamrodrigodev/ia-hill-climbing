import { rutaATexto } from "@/lib/hill-climbing";
import { construirDisenoArbol, obtenerClaseNodoArbol } from "@/lib/tree-layout";
import type { ResultadoEscalada } from "@/lib/types";

interface PropiedadesVistaArbolBusqueda {
  result: ResultadoEscalada;
  varianteResumen?: "box" | "text" | "none";
  varianteDiseno?: "default" | "compact";
}

export function SearchTreeView({
  result,
  varianteResumen = "box",
  varianteDiseno = "default",
}: PropiedadesVistaArbolBusqueda) {
  const diseno = construirDisenoArbol(
    result,
    varianteDiseno === "compact"
      ? {
          anchoMinimo: 860,
          separacionHijos: 142,
          margenLateral: 120,
          raizY: 74,
          separacionNiveles: 138,
          caidaRama: 42,
          radioNodo: 34,
          margenInferior: 88,
        }
      : {},
  );

  const textoRutaSolucion = rutaATexto(result.solutionRoute);
  const raizEsSolucion =
    rutaATexto(result.startRoute) === textoRutaSolucion && result.startCost === result.solutionCost;
  const claseResumen = varianteResumen === "text" ? "tree-result-text" : "tree-result-box";
  const claseContenedorArbol = varianteDiseno === "compact" ? "tree-shell compact" : "tree-shell";

  return (
    <div className="tree-layout">
      {varianteResumen === "none" ? null : (
        <aside className={claseResumen}>
          <p>X = [{result.solutionRoute.join(",")}]</p>
          <p>F = {result.solutionCost}</p>
        </aside>
      )}

      <div className={claseContenedorArbol}>
        <svg viewBox={`0 0 ${diseno.ancho} ${diseno.alto}`} role="img" aria-label="Árbol de exploración hill climbing">
          <rect x="0" y="0" width={diseno.ancho} height={diseno.alto} className="tree-bg" />

          <g>
            <circle
              cx={diseno.raizX}
              cy={diseno.raizY}
              r={diseno.radioNodo}
              className={raizEsSolucion ? "tree-node-circle is-solution" : "tree-node-circle is-root"}
            />
            <text x={diseno.raizX} y={diseno.raizY - 8} className="tree-node-route">
              {rutaATexto(result.startRoute)}
            </text>
            <text x={diseno.raizX} y={diseno.raizY + 16} className="tree-node-cost">
              {result.startCost}
            </text>
          </g>

          {diseno.capas.map((capa, indiceCapa) => {
            const ramaY = capa.padreY + diseno.caidaRama;
            const primerX = capa.posiciones[0];
            const ultimoX = capa.posiciones[capa.posiciones.length - 1];
            const esUltimaCapa = indiceCapa === diseno.capas.length - 1;
            const esCapaMejora = capa.iteracion.moved;
            const esCapaParo = !capa.iteracion.moved && esUltimaCapa;
            const esCapaRecorrido = esCapaMejora || esUltimaCapa;
            const seleccionadoX = capa.seleccionadoX;
            const claseTronco = esCapaParo
              ? "tree-link is-stop"
              : esCapaRecorrido
                ? "tree-link is-best"
                : "tree-link";

            return (
              <g key={capa.iteracion.iteration}>
                <line
                  x1={capa.padreX}
                  y1={capa.padreY + diseno.radioNodo}
                  x2={capa.padreX}
                  y2={ramaY}
                  className={claseTronco}
                />
                <line x1={primerX} y1={ramaY} x2={ultimoX} y2={ramaY} className="tree-link" />
                {esCapaRecorrido ? (
                  <line
                    x1={Math.min(capa.padreX, seleccionadoX)}
                    y1={ramaY}
                    x2={Math.max(capa.padreX, seleccionadoX)}
                    y2={ramaY}
                    className={claseTronco}
                  />
                ) : null}

                {capa.iteracion.neighbors.map((vecino, indiceHijo) => {
                  const x = capa.posiciones[indiceHijo];
                  const y = capa.hijoY;
                  const esMejor = indiceHijo === capa.indiceMejor;
                  const esSeleccionRecorrido = esMejor && esCapaRecorrido;
                  const esSeleccionParo = esMejor && esCapaParo;
                  const textoRuta = rutaATexto(vecino.route);
                  const claseNodo = obtenerClaseNodoArbol(
                    textoRuta,
                    vecino.cost,
                    textoRutaSolucion,
                    result.solutionCost,
                    esSeleccionRecorrido,
                  );
                  const claseRama = esSeleccionRecorrido
                    ? "tree-link is-best"
                    : esSeleccionParo
                      ? "tree-link is-stop"
                      : "tree-link";

                  return (
                    <g key={`${indiceCapa}-${indiceHijo}`}>
                      <line x1={x} y1={ramaY} x2={x} y2={y - diseno.radioNodo} className={claseRama} />
                      <circle cx={x} cy={y} r={diseno.radioNodo} className={claseNodo} />
                      <text x={x} y={y - 8} className="tree-node-route">
                        {textoRuta}
                      </text>
                      <text x={x} y={y + 16} className="tree-node-cost">
                        {vecino.cost}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
