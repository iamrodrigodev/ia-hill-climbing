import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, MousePointer2, Play, PlusCircle, Share2, Trash2 } from "lucide-react";
import * as Label from "@radix-ui/react-label";
import { rutaATexto } from "@/lib/hill-climbing";
import { baseGraph, baseRun } from "@/lib/mock-data";
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

  const etapasEjecucion = baseRun.iterations.map((iteration, index) => {
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
          ? iteration.bestNeighbor.cost === baseRun.solutionCost
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

  const stages = useMemo(construirEtapas, []);
  const [stageIndex, setStageIndex] = useState(0);
  const [edgeWeightError, setEdgeWeightError] = useState("");
  const [constructorRunStep, setConstructorRunStep] = useState(0);
  const [exampleMoveEnabled, setExampleMoveEnabled] = useState(false);
  const [exampleDraggingNodeId, setExampleDraggingNodeId] = useState<number | null>(null);
  const [examplePositions, setExamplePositions] = useState(() => ({
    0: { ...posicionesBase[0] },
    1: { ...posicionesBase[1] },
    2: { ...posicionesBase[2] },
    3: { ...posicionesBase[3] },
  }));
  const stage = stages[stageIndex];

  const hasAtLeastOneNode = controlador.grafo.nodes.length > 0;
  const hasAtLeastTwoNodes = controlador.grafo.nodes.length > 1;

  const showFinalAnswer = stageIndex === stages.length - 1 || stage.tone === "stop";
  const treeIterationsToShow = Math.max(0, stageIndex);
  const treeResultForStage = useMemo(
    () => ({
      ...baseRun,
      iterations: baseRun.iterations.slice(0, treeIterationsToShow),
      solutionRoute: showFinalAnswer ? baseRun.solutionRoute : [],
      solutionCost: showFinalAnswer ? baseRun.solutionCost : Number.NaN,
    }),
    [showFinalAnswer, treeIterationsToShow],
  );

  useEffect(() => {
    setConstructorRunStep(0);
  }, [controlador.resultado]);

  const constructorTotalSteps = controlador.resultado ? controlador.resultado.iterations.length + 1 : 1;
  const constructorRunLabel = constructorRunStep === 0 ? "Inicio" : `Iteración ${constructorRunStep}`;
  const constructorShowFinal = !!controlador.resultado && constructorRunStep === constructorTotalSteps - 1;
  const constructorTreeResult = useMemo(() => {
    if (!controlador.resultado) return null;
    return {
      ...controlador.resultado,
      iterations: controlador.resultado.iterations.slice(0, constructorRunStep),
      solutionRoute: constructorShowFinal ? controlador.resultado.solutionRoute : [],
      solutionCost: constructorShowFinal ? controlador.resultado.solutionCost : Number.NaN,
    };
  }, [constructorRunStep, constructorShowFinal, controlador.resultado]);

  const constructorActiveRoute = useMemo(() => {
    if (!controlador.resultado) return controlador.rutaActiva;
    if (constructorRunStep === 0) return undefined;
    return controlador.resultado.iterations[constructorRunStep - 1]?.currentRoute;
  }, [constructorRunStep, controlador.rutaActiva, controlador.resultado]);

  const constructorStatus = !controlador.resultado
    ? controlador.modoEditor === "add-node"
      ? "Haz clic sobre el lienzo para crear nodos."
      : controlador.modoEditor === "add-edge"
        ? controlador.idNodoOrigenPendiente === null
          ? "Selecciona nodo origen y luego nodo destino para crear una conexión."
          : `Origen seleccionado: ${controlador.idNodoOrigenPendiente}. Elige nodo destino.`
        : controlador.modoEditor === "delete"
          ? "Haz clic en un nodo o conexión para eliminar."
          : "Modo mover activo. También puedes ejecutar el algoritmo cuando tengas un grafo válido."
    : constructorRunStep === 0
      ? `Inicio del cálculo: ruta inicial ${rutaATexto(controlador.resultado.startRoute)} con F=${controlador.resultado.startCost}.`
      : (() => {
          const iteration = controlador.resultado.iterations[constructorRunStep - 1];
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

  const handleConfirmEdgeCreation = () => {
    const normalizedWeight = controlador.entradaPesoArista.trim();
    if (!normalizedWeight) {
      setEdgeWeightError("El peso es obligatorio.");
      return;
    }
    const parsedWeight = Number(normalizedWeight);
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      setEdgeWeightError("Ingresa un peso mayor que 0.");
      return;
    }
    setEdgeWeightError("");
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
              </div>
              <div className="stepper-controls">
                <Button
                  variant={exampleMoveEnabled ? "secondary" : "primary"}
                  size="sm"
                  onClick={() => setExampleMoveEnabled((prev) => !prev)}
                >
                  <MousePointer2 size={14} />
                  Mover
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setStageIndex((prev) => Math.max(0, prev - 1))}
                  disabled={stageIndex === 0}
                >
                  <ChevronLeft size={14} />
                  Anterior
                </Button>
                <span className={`step-badge tone-${stage.tone}`}>
                  {etiquetaTono(stage.tone)} - {stageIndex + 1}/{stages.length}
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setStageIndex((prev) => Math.min(stages.length - 1, prev + 1))}
                  disabled={stageIndex === stages.length - 1}
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
              <h3>{isConstructorMode ? "Lienzo del constructor" : stage.title}</h3>
              <p>
                {isConstructorMode
                  ? "El lienzo empieza vacío. Construye nodos y conexiones directamente aquí."
                  : stage.subtitle}
              </p>
              {isConstructorMode ? (
                <GraphCanvas
                  graph={controlador.grafo}
                  activeRoute={constructorActiveRoute}
                  nodePositions={controlador.posiciones}
                  nodeLabels={controlador.etiquetas}
                  selectedNodeId={controlador.idNodoSeleccionado}
                  pendingEdgeFromId={controlador.idNodoOrigenPendiente}
                  mode={controlador.modoEditor}
                  onCanvasClick={controlador.manejarClicEnLienzo}
                  onNodeClick={controlador.manejarClicEnNodo}
                  onEdgeClick={controlador.manejarClicEnArista}
                  onNodePointerDown={(nodeId) => {
                    if (controlador.modoEditor === "select") controlador.setIdNodoArrastrando(nodeId);
                  }}
                  onPointerMove={(x, y) => {
                    if (controlador.idNodoArrastrando === null || controlador.modoEditor !== "select") return;
                    controlador.setPosiciones((prev) => ({ ...prev, [controlador.idNodoArrastrando!]: { x, y } }));
                  }}
                  onPointerUp={() => {
                    if (controlador.idNodoArrastrando !== null) controlador.setIdNodoArrastrando(null);
                  }}
                  height={450}
                />
              ) : (
                <GraphCanvas
                  graph={baseGraph}
                  activeRoute={stage.route ?? undefined}
                  nodePositions={examplePositions}
                  nodeLabels={etiquetasBase}
                  selectedNodeId={exampleDraggingNodeId}
                  highlightTheme={stage.tone}
                  onNodePointerDown={(nodeId) => {
                    if (!exampleMoveEnabled) return;
                    setExampleDraggingNodeId(nodeId);
                  }}
                  onPointerMove={(x, y) => {
                    if (!exampleMoveEnabled || exampleDraggingNodeId === null) return;
                    setExamplePositions((prev) => ({ ...prev, [exampleDraggingNodeId]: { x, y } }));
                  }}
                  onPointerUp={() => {
                    if (exampleDraggingNodeId !== null) setExampleDraggingNodeId(null);
                  }}
                  height={450}
                />
              )}
            </article>

            <article className="case-side-block compact">
              {isConstructorMode && controlador.resultado ? (
                <div className="stepper-controls">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setConstructorRunStep((prev) => Math.max(0, prev - 1))}
                    disabled={constructorRunStep === 0}
                  >
                    <ChevronLeft size={14} />
                    Anterior
                  </Button>
                  <span className="step-badge tone-start">
                    {constructorRunLabel} - {constructorRunStep + 1}/{constructorTotalSteps}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      setConstructorRunStep((prev) => Math.min(constructorTotalSteps - 1, prev + 1))
                    }
                    disabled={constructorRunStep === constructorTotalSteps - 1}
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
                      {(isConstructorMode ? controlador.grafo.edges : baseGraph.edges).length > 0 ? (
                        (isConstructorMode ? controlador.grafo.edges : baseGraph.edges).map((edge) => (
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
                  <p>{constructorStatus}</p>
                ) : (
                  <>
                    <p>
                      Ruta actual: <code>{stage.route ? rutaATexto(stage.route) : "-"}</code> -{" "}
                      <code>F={stage.cost ?? "-"}</code>
                    </p>
                    <p>{stage.decision}</p>
                  </>
                )}
              </div>

              {isConstructorMode ? (
                <div className="case-mini-card compact">
                  <h4>Parámetros e inicio</h4>
                  <div className="control-stack">
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
                  {showFinalAnswer ? (
                    <>
                      <p>
                        X = <strong>[{baseRun.solutionRoute.join(",")}]</strong>
                      </p>
                      <p>
                        F = <strong>{baseRun.solutionCost}</strong>
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
                      {constructorShowFinal ? (
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
                              {constructorShowFinal
                                ? `Visualización completa para tu grafo. Salida exitosa: X=[${controlador.resultado.solutionRoute.join(",")}], F=${controlador.resultado.solutionCost}.`
                                : `Árbol construido hasta ${constructorRunLabel.toLowerCase()}. La salida final aparece en el último paso.`}
                            </DialogDescription>
                          </DialogHeader>
                          {constructorRunStep === 0 || !constructorTreeResult ? (
                            <p className="muted-note">
                              Aún no hay iteraciones visibles. Avanza al siguiente paso.
                            </p>
                          ) : (
                            <SearchTreeView
                              result={constructorTreeResult}
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
                  {stage.neighbors.length > 0 ? (
                    stage.neighbors.map((neighbor, index) => (
                      <span
                        key={`${stageIndex}-${index}`}
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
                          {showFinalAnswer
                            ? `Visualización completa del recorrido para el caso base. Salida exitosa: X=[${baseRun.solutionRoute.join(",")}], F=${baseRun.solutionCost}.`
                            : `Árbol construido hasta la iteración actual (${treeIterationsToShow}). La salida final se muestra al llegar al paso de paro.`}
                        </DialogDescription>
                      </DialogHeader>
                      {treeIterationsToShow === 0 ? (
                        <p className="muted-note">Aún no hay iteraciones en el árbol. Avanza al siguiente paso.</p>
                      ) : (
                        <SearchTreeView result={treeResultForStage} varianteResumen="none" varianteDiseno="compact" />
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
          if (!open) setEdgeWeightError("");
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
                  setEdgeWeightError("El peso es obligatorio.");
                  return;
                }
                const parsed = Number(nextValue);
                if (!Number.isFinite(parsed) || parsed <= 0) {
                  setEdgeWeightError("Ingresa un peso mayor que 0.");
                  return;
                }
                setEdgeWeightError("");
              }}
            />
            {edgeWeightError ? <p className="field-error">{edgeWeightError}</p> : null}

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
              <Button onClick={handleConfirmEdgeCreation}>Guardar conexión</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


