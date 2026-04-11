import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, MousePointer2, Play, PlusCircle, Share2, Trash2 } from "lucide-react";
import * as Label from "@radix-ui/react-label";
import { rutaATexto } from "@/lib/hill-climbing";
import { corridaBase, grafoBase } from "@/lib/mock-data";
import { homeContent } from "@/lib/home-content";
import { useControladorSimulador } from "@/lib/use-simulator-controller";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { SearchTreeView } from "@/components/graph/SearchTreeView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Tono = "start" | "progress" | "optimal" | "stop";

interface EtapaEjemplo {
  title: string;
  subtitle: string;
  route: number[] | null;
  cost: number | null;
  neighbors: Array<{ routeText: string; cost: number; isBest: boolean }>;
  decision: string;
  tone: Tono;
}

const posicionesBase = {
  0: { x: 96, y: 116 },
  1: { x: 432, y: 168 },
  2: { x: 760, y: 118 },
  3: { x: 260, y: 352 },
};

const etiquetasBase = { 0: "0", 1: "1", 2: "2", 3: "3" };

function construirEtapas(): EtapaEjemplo[] {
  const etapaInicial: EtapaEjemplo = {
    title: "Estado inicial",
    subtitle: "Presentación del grafo base para empezar el ejemplo.",
    route: null,
    cost: null,
    neighbors: [],
    decision: "Aquí solo observamos el grafo. Presiona Siguiente para comenzar con la Iteración 1.",
    tone: "start",
  };

  const etapasEjecucion = corridaBase.iterations.map((iteration, index) => {
    const currentText = rutaATexto(iteration.currentRoute);
    const bestText = rutaATexto(iteration.bestNeighbor.route);
    const comparisonText = `${iteration.bestNeighbor.cost} ${
      iteration.bestNeighbor.cost < iteration.currentCost ? "<" : ">="
    } ${iteration.currentCost}`;
    const neighbors = iteration.neighbors.map((neighbor) => ({
      routeText: rutaATexto(neighbor.route),
      cost: neighbor.cost,
      isBest:
        rutaATexto(neighbor.route) === bestText && neighbor.cost === iteration.bestNeighbor.cost,
    }));

    const tone: Tono =
      index === 0
        ? "start"
        : iteration.moved
          ? iteration.bestNeighbor.cost === corridaBase.solutionCost
            ? "optimal"
            : "progress"
          : "stop";

    return {
      title: `Iteración ${iteration.iteration}`,
      subtitle: `Ruta actual ${currentText} con F=${iteration.currentCost}`,
      route: iteration.currentRoute,
      cost: iteration.currentCost,
      neighbors,
      decision: iteration.moved
        ? `Se elige ${bestText} porque es el menor costo entre los vecinos (F=${iteration.bestNeighbor.cost}) y mejora a la ruta actual ${currentText} (F=${iteration.currentCost}). Regla aplicada: ${comparisonText}, entonces sí se mueve.`
        : `Se detiene porque no hay mejora estricta: el mejor vecino es ${bestText} con F=${iteration.bestNeighbor.cost} y la ruta actual ${currentText} tiene F=${iteration.currentCost}. Regla aplicada: ${comparisonText}, entonces no se mueve (óptimo local).`,
      tone,
    } satisfies EtapaEjemplo;
  });

  return [etapaInicial, ...etapasEjecucion];
}

function etiquetaTono(tone: Tono): string {
  if (tone === "start") return "Inicio";
  if (tone === "progress") return "Mejora";
  if (tone === "optimal") return "Mejor encontrado";
  return "Paro";
}

export function HomePage() {
  const location = useLocation();
  const isConstructorMode = location.pathname !== "/";
  const controlador = useControladorSimulador();

  const etapas = useMemo(construirEtapas, []);
  const [indiceEtapa, setIndiceEtapa] = useState(0);
  const [errorPesoArista, setErrorPesoArista] = useState("");
  const [pasoConstructor, setPasoConstructor] = useState(0);
  const [movimientoEjemploHabilitado, setMovimientoEjemploHabilitado] = useState(false);
  const [idNodoArrastrandoEjemplo, setIdNodoArrastrandoEjemplo] = useState<number | null>(null);
  const [posicionesEjemplo, setPosicionesEjemplo] = useState(() => ({
    0: { ...posicionesBase[0] },
    1: { ...posicionesBase[1] },
    2: { ...posicionesBase[2] },
    3: { ...posicionesBase[3] },
  }));
  const etapa = etapas[indiceEtapa];

  const hasAtLeastOneNode = controlador.grafo.nodes.length > 0;
  const hasAtLeastTwoNodes = controlador.grafo.nodes.length > 1;

  const mostrarRespuestaFinal = indiceEtapa === etapas.length - 1 || etapa.tone === "stop";
  const iteracionesArbolAMostrar = Math.max(0, indiceEtapa);
  const resultadoArbolPorEtapa = useMemo(
    () => ({
      ...corridaBase,
      iterations: corridaBase.iterations.slice(0, iteracionesArbolAMostrar),
      solutionRoute: mostrarRespuestaFinal ? corridaBase.solutionRoute : [],
      solutionCost: mostrarRespuestaFinal ? corridaBase.solutionCost : Number.NaN,
    }),
    [mostrarRespuestaFinal, iteracionesArbolAMostrar],
  );

  useEffect(() => {
    setPasoConstructor(0);
  }, [controlador.resultado]);

  const pasosConstructorTotales = controlador.resultado ? controlador.resultado.iterations.length + 1 : 1;
  const etiquetaPasoConstructor = pasoConstructor === 0 ? "Inicio" : `Iteración ${pasoConstructor}`;
  const mostrarFinalConstructor = !!controlador.resultado && pasoConstructor === pasosConstructorTotales - 1;
  const resultadoArbolConstructor = useMemo(() => {
    if (!controlador.resultado) return null;
    return {
      ...controlador.resultado,
      iterations: controlador.resultado.iterations.slice(0, pasoConstructor),
      solutionRoute: mostrarFinalConstructor ? controlador.resultado.solutionRoute : [],
      solutionCost: mostrarFinalConstructor ? controlador.resultado.solutionCost : Number.NaN,
    };
  }, [pasoConstructor, mostrarFinalConstructor, controlador.resultado]);

  const rutaActivaConstructor = useMemo(() => {
    if (!controlador.resultado) return controlador.rutaActiva;
    if (pasoConstructor === 0) return undefined;
    return controlador.resultado.iterations[pasoConstructor - 1]?.currentRoute;
  }, [pasoConstructor, controlador.rutaActiva, controlador.resultado]);

  const estadoConstructor = !controlador.resultado
    ? controlador.modoEditor === "add-node"
      ? controlador.modoEtiquetaNodo === "city"
        ? "Haz clic sobre el lienzo para crear un nodo de ciudad."
        : "Haz clic sobre el lienzo para crear nodos numéricos."
      : controlador.modoEditor === "add-edge"
        ? controlador.idNodoOrigenPendiente === null
          ? "Selecciona nodo origen y luego nodo destino para crear una conexión."
          : `Origen seleccionado: ${controlador.idNodoOrigenPendiente}. Elige nodo destino.`
        : controlador.modoEditor === "delete"
          ? "Haz clic en un nodo o conexión para eliminar."
          : "Modo mover activo. También puedes ejecutar el algoritmo cuando tengas un grafo válido."
    : pasoConstructor === 0
      ? `Inicio del cálculo: ruta inicial ${rutaATexto(controlador.resultado.startRoute)} con F=${controlador.resultado.startCost}.`
      : (() => {
          const iteration = controlador.resultado.iterations[pasoConstructor - 1];
          if (!iteration) return "Resultado generado.";
          const currentText = rutaATexto(iteration.currentRoute);
          const bestText = rutaATexto(iteration.bestNeighbor.route);
          const comparison = `${iteration.bestNeighbor.cost} ${
            iteration.bestNeighbor.cost < iteration.currentCost ? "<" : ">="
          } ${iteration.currentCost}`;
          return iteration.moved
            ? `Iteración ${iteration.iteration}: se elige ${bestText} porque ${comparison}.`
            : `Iteración ${iteration.iteration}: se detiene porque ${comparison} (sin mejora estricta).`;
        })();

  const manejarConfirmacionCreacionArista = () => {
    const pesoNormalizado = controlador.entradaPesoArista.trim();
    if (!pesoNormalizado) {
      setErrorPesoArista("El peso es obligatorio.");
      return;
    }
    const pesoParseado = Number(pesoNormalizado);
    if (!Number.isFinite(pesoParseado) || pesoParseado <= 0) {
      setErrorPesoArista("Ingresa un peso mayor que 0.");
      return;
    }
    setErrorPesoArista("");
    controlador.confirmarCreacionArista();
  };

  return (
    <div className="container page-stack">
      <Card>
        <CardHeader>
          {isConstructorMode ? (
            <div className="case-topbar">
              <div>
                <CardTitle>Constructor</CardTitle>
                <CardDescription>
                  Crea tu grafo en el mismo lienzo, agrega conexiones y ejecuta Hill Climbing.
                </CardDescription>
              </div>
              <div className="mode-toolbar">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => controlador.fijarModoEditor("select")}
                  disabled={controlador.modoEditor === "select" || !hasAtLeastOneNode}
                >
                  <MousePointer2 size={14} />
                  Mover
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => controlador.fijarModoEditor("add-node")}
                  disabled={controlador.modoEditor === "add-node"}
                >
                  <PlusCircle size={14} />
                  Nodo
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => controlador.fijarModoEditor("add-edge")}
                  disabled={controlador.modoEditor === "add-edge" || !hasAtLeastTwoNodes}
                >
                  <Share2 size={14} />
                  Conexión
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => controlador.fijarModoEditor("delete")}
                  disabled={controlador.modoEditor === "delete" || !hasAtLeastOneNode}
                >
                  <Trash2 size={14} />
                  Eliminar
                </Button>
                <Button variant="primary" size="sm" onClick={controlador.limpiarTodo}>
                  Limpiar
                </Button>
              </div>
            </div>
          ) : (
            <div className="case-topbar">
              <div>
                <CardTitle>Ejemplo guiado del caso base</CardTitle>
                <CardDescription>
                  Avanza paso a paso para ver costos, vecinos y decisiones del algoritmo.
                </CardDescription>
                <p className="case-note">
                  {homeContent.hero.algorithmExplanation}
                </p>
              </div>
              <div className="stepper-controls">
                <Button
                  variant={movimientoEjemploHabilitado ? "secondary" : "primary"}
                  size="sm"
                  onClick={() => setMovimientoEjemploHabilitado((prev) => !prev)}
                >
                  <MousePointer2 size={14} />
                  Mover
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIndiceEtapa((prev) => Math.max(0, prev - 1))}
                  disabled={indiceEtapa === 0}
                >
                  <ChevronLeft size={14} />
                  Anterior
                </Button>
                <span className={`step-badge tone-${etapa.tone}`}>
                  {etiquetaTono(etapa.tone)} - {indiceEtapa + 1}/{etapas.length}
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIndiceEtapa((prev) => Math.min(etapas.length - 1, prev + 1))}
                  disabled={indiceEtapa === etapas.length - 1}
                >
                  Siguiente
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="case-interactive-content">
          <section className="case-grid">
            <article className="case-graph-block">
              <h3>{isConstructorMode ? "Lienzo del constructor" : etapa.title}</h3>
              <p>
                {isConstructorMode
                  ? "El lienzo empieza vacío. Construye nodos y conexiones directamente aquí."
                  : etapa.subtitle}
              </p>
              {isConstructorMode ? (
                <GraphCanvas
                  grafo={controlador.grafo}
                  rutaActiva={rutaActivaConstructor}
                  posicionesNodos={controlador.posiciones}
                  etiquetasNodos={controlador.etiquetas}
                  idNodoSeleccionado={controlador.idNodoSeleccionado}
                  idOrigenAristaPendiente={controlador.idNodoOrigenPendiente}
                  modo={controlador.modoEditor}
                  onClickLienzo={controlador.manejarClicEnLienzo}
                  onClickNodo={controlador.manejarClicEnNodo}
                  onClickArista={controlador.manejarClicEnArista}
                  onPresionarNodo={(nodeId) => {
                    if (controlador.modoEditor === "select") controlador.setIdNodoArrastrando(nodeId);
                  }}
                  onMovimientoPuntero={(x, y) => {
                    if (controlador.idNodoArrastrando === null || controlador.modoEditor !== "select") return;
                    controlador.setPosiciones((prev) => ({ ...prev, [controlador.idNodoArrastrando!]: { x, y } }));
                  }}
                  onSoltarPuntero={() => {
                    if (controlador.idNodoArrastrando !== null) controlador.setIdNodoArrastrando(null);
                  }}
                  altura={450}
                />
              ) : (
                <GraphCanvas
                  grafo={grafoBase}
                  rutaActiva={etapa.route ?? undefined}
                  posicionesNodos={posicionesEjemplo}
                  etiquetasNodos={etiquetasBase}
                  idNodoSeleccionado={idNodoArrastrandoEjemplo}
                  temaResaltado={etapa.tone}
                  onPresionarNodo={(nodeId) => {
                    if (!movimientoEjemploHabilitado) return;
                    setIdNodoArrastrandoEjemplo(nodeId);
                  }}
                  onMovimientoPuntero={(x, y) => {
                    if (!movimientoEjemploHabilitado || idNodoArrastrandoEjemplo === null) return;
                    setPosicionesEjemplo((prev) => ({ ...prev, [idNodoArrastrandoEjemplo]: { x, y } }));
                  }}
                  onSoltarPuntero={() => {
                    if (idNodoArrastrandoEjemplo !== null) setIdNodoArrastrandoEjemplo(null);
                  }}
                  altura={450}
                />
              )}
            </article>

            <article className="case-side-block compact">
              {isConstructorMode && controlador.resultado ? (
                <div className="stepper-controls">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setPasoConstructor((prev) => Math.max(0, prev - 1))}
                    disabled={pasoConstructor === 0}
                  >
                    <ChevronLeft size={14} />
                    Anterior
                  </Button>
                  <span className="step-badge tone-start">
                    {etiquetaPasoConstructor} - {pasoConstructor + 1}/{pasosConstructorTotales}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      setPasoConstructor((prev) => Math.min(pasosConstructorTotales - 1, prev + 1))
                    }
                    disabled={pasoConstructor === pasosConstructorTotales - 1}
                  >
                    Siguiente
                    <ChevronRight size={14} />
                  </Button>
                </div>
              ) : null}

              <div className="case-mini-card cost-table-card">
                <h4>Tabla de costos</h4>
                <div className="table-wrap">
                  <table className="data-table cost-table">
                    <thead>
                      <tr>
                        <th>Conexión</th>
                        <th>Costo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(isConstructorMode ? controlador.grafo.edges : grafoBase.edges).length > 0 ? (
                        (isConstructorMode ? controlador.grafo.edges : grafoBase.edges).map((edge) => (
                          <tr key={edge.id}>
                            <td>
                              {edge.from} {edge.bidirectional ? "\u2194" : "\u2192"} {edge.to}
                            </td>
                            <td>{edge.weight}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2}>Sin conexiones todavía.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="case-mini-card compact">
                <h4>¿Qué está pasando?</h4>
                {isConstructorMode ? (
                  <p>{estadoConstructor}</p>
                ) : (
                  <>
                    <p>
                      Ruta actual: <code>{etapa.route ? rutaATexto(etapa.route) : "-"}</code> -{" "}
                      <code>F={etapa.cost ?? "-"}</code>
                    </p>
                    <p>{etapa.decision}</p>
                  </>
                )}
              </div>

              {isConstructorMode ? (
                <div className="case-mini-card compact">
                  <h4>Parámetros e inicio</h4>
                  <div className="control-stack">
                    <Label.Root htmlFor="node-label-mode-inline" className="field-label">
                      Etiqueta de nodo
                    </Label.Root>
                    <select
                      id="node-label-mode-inline"
                      className="ui-input"
                      value={controlador.modoEtiquetaNodo}
                      onChange={(event) => controlador.setModoEtiquetaNodo(event.target.value as "numeric" | "city")}
                      disabled={controlador.grafo.nodes.length > 0}
                    >
                      <option value="numeric">Número</option>
                      <option value="city">Ciudad</option>
                    </select>
                    <Label.Root htmlFor="route-input-inline" className="field-label">
                      Ruta inicial (entrada)
                    </Label.Root>
                    <Input
                      id="route-input-inline"
                      placeholder="Pon una ruta inicial válida"
                      value={controlador.entradaRuta}
                      onChange={(event) => controlador.setEntradaRuta(event.target.value)}
                    />
                    <p>
                      Ruta sugerida válida: <code>{controlador.vistaPreviaRutaAutomatica || "-"}</code>
                    </p>
                    <Button onClick={controlador.ejecutarAlgoritmo}>
                      <Play size={14} />
                      Iniciar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="case-mini-card compact final-answer">
                  <h4>Respuesta final</h4>
                  {mostrarRespuestaFinal ? (
                    <>
                      <p>
                        X = <strong>[{corridaBase.solutionRoute.join(",")}]</strong>
                      </p>
                      <p>
                        F = <strong>{corridaBase.solutionCost}</strong>
                      </p>
                    </>
                  ) : (
                    <p>Se muestra cuando llegues al paso de paro.</p>
                  )}
                </div>
              )}
            </article>
          </section>

          <section className="neighbors-inline">
            {isConstructorMode ? (
              <>
                <h4>Resultado del constructor</h4>
                {controlador.resultado ? (
                  <>
                    <div className="neighbor-pills">
                      {mostrarFinalConstructor ? (
                        <span className="neighbor-pill is-best">
                          Salida exitosa: X = [{controlador.resultado.solutionRoute.join(",")}], F ={" "}
                          {controlador.resultado.solutionCost}
                        </span>
                      ) : (
                        <span className="neighbor-pill">
                          Avanza con Siguiente para mostrar la salida final del cálculo.
                        </span>
                      )}
                    </div>
                    <div className="inline-actions">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="primary" size="sm">
                            Ver árbol generado
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="tree-modal-content">
                          <DialogHeader>
                            <DialogTitle>Árbol de búsqueda generado</DialogTitle>
                            <DialogDescription>
                              {mostrarFinalConstructor
                                ? `Visualización completa para tu grafo. Salida exitosa: X=[${controlador.resultado.solutionRoute.join(",")}], F=${controlador.resultado.solutionCost}.`
                                : `Árbol construido hasta ${etiquetaPasoConstructor.toLowerCase()}. La salida final aparece en el último paso.`}
                            </DialogDescription>
                          </DialogHeader>
                          {pasoConstructor === 0 || !resultadoArbolConstructor ? (
                            <p className="muted-note">
                              Aún no hay iteraciones visibles. Avanza al siguiente paso.
                            </p>
                          ) : (
                            <SearchTreeView
                              result={resultadoArbolConstructor}
                              varianteResumen="none"
                              varianteDiseno="compact"
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </>
                ) : (
                  <p className="muted-note">
                    Construye el grafo, configura parámetros y pulsa Iniciar para obtener el árbol.
                  </p>
                )}
              </>
            ) : (
              <>
                <h4>Vecinos evaluados en esta iteración</h4>
                <div className="neighbor-pills">
                  {etapa.neighbors.length > 0 ? (
                    etapa.neighbors.map((neighbor, index) => (
                      <span
                        key={`${indiceEtapa}-${index}`}
                        className={`neighbor-pill ${neighbor.isBest ? "is-best" : ""}`}
                      >
                        {neighbor.routeText} = {neighbor.cost}
                      </span>
                    ))
                  ) : (
                    <span className="neighbor-pill">Aún sin vecinos (Paso 0).</span>
                  )}
                </div>
                <div className="inline-actions">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="primary" size="sm">
                        Ver árbol completo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="tree-modal-content">
                      <DialogHeader>
                        <DialogTitle>Árbol de búsqueda del caso base</DialogTitle>
                        <DialogDescription>
                          {mostrarRespuestaFinal
                            ? `Visualización completa del recorrido para el caso base. Salida exitosa: X=[${corridaBase.solutionRoute.join(",")}], F=${corridaBase.solutionCost}.`
                            : `Árbol construido hasta la iteración actual (${iteracionesArbolAMostrar}). La salida final se muestra al llegar al paso de paro.`}
                        </DialogDescription>
                      </DialogHeader>
                      {iteracionesArbolAMostrar === 0 ? (
                        <p className="muted-note">Aún no hay iteraciones en el árbol. Avanza al siguiente paso.</p>
                      ) : (
                        <SearchTreeView result={resultadoArbolPorEtapa} varianteResumen="none" varianteDiseno="compact" />
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </>
            )}
          </section>
        </CardContent>
      </Card>

      <Dialog
        open={controlador.dialogoAristaAbierto}
        onOpenChange={(open) => {
          controlador.manejarCambioDialogoArista(open);
          if (!open) setErrorPesoArista("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva conexión</DialogTitle>
            <DialogDescription>
              {controlador.idNodoOrigenPendiente !== null && controlador.objetivoDialogoArista !== null
                ? `${controlador.idNodoOrigenPendiente} -> ${controlador.objetivoDialogoArista}`
                : "Define peso y dirección"}
            </DialogDescription>
          </DialogHeader>
          <div className="control-stack">
            <Label.Root htmlFor="edge-weight-input-home" className="field-label">
              Peso
            </Label.Root>
            <Input
              id="edge-weight-input-home"
              type="number"
              min={1}
              value={controlador.entradaPesoArista}
              onChange={(event) => {
                const nextValue = event.target.value;
                controlador.setEntradaPesoArista(nextValue);
                if (!nextValue.trim()) {
                  setErrorPesoArista("El peso es obligatorio.");
                  return;
                }
                const parsed = Number(nextValue);
                if (!Number.isFinite(parsed) || parsed <= 0) {
                  setErrorPesoArista("Ingresa un peso mayor que 0.");
                  return;
                }
                setErrorPesoArista("");
              }}
            />
            {errorPesoArista ? <p className="field-error">{errorPesoArista}</p> : null}

            <label className="toggle-line light">
              <input
                type="checkbox"
                checked={controlador.aristaBidireccional}
                onChange={(event) => controlador.setAristaBidireccional(event.target.checked)}
              />
              Bidireccional
            </label>

            <div className="inline-actions">
              <Button variant="outline" onClick={() => controlador.setDialogoAristaAbierto(false)}>
                Cancelar
              </Button>
              <Button onClick={manejarConfirmacionCreacionArista}>Guardar conexión</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={controlador.dialogoNodoAbierto} onOpenChange={controlador.manejarCambioDialogoNodo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nombre de la ciudad</DialogTitle>
            <DialogDescription>Ingresa el nombre que se mostrará para el nodo.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              controlador.confirmarCreacionNodo();
            }}
            className="control-stack"
          >
            <Label.Root htmlFor="city-name-input-home" className="field-label">
              Ciudad
            </Label.Root>
            <Input
              id="city-name-input-home"
              value={controlador.entradaNombreNodo}
              onChange={(event) => controlador.setEntradaNombreNodo(event.target.value)}
            />
            <div className="inline-actions">
              <Button variant="outline" type="button" onClick={() => controlador.manejarCambioDialogoNodo(false)}>
                Cancelar
              </Button>
              <Button type="submit">Agregar nodo</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


