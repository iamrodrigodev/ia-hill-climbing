import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { routeToString } from "@/lib/hill-climbing";
import { baseGraph, baseRun } from "@/lib/mock-data";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { SearchTreeView } from "@/components/graph/SearchTreeView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Tone = "start" | "progress" | "optimal" | "stop";

interface ExampleStage {
  title: string;
  subtitle: string;
  route: number[] | null;
  cost: number | null;
  neighbors: Array<{ routeText: string; cost: number; isBest: boolean }>;
  decision: string;
  tone: Tone;
}

const basePositions = {
  0: { x: 96, y: 116 },
  1: { x: 432, y: 168 },
  2: { x: 760, y: 118 },
  3: { x: 260, y: 352 },
};

const baseLabels = { 0: "0", 1: "1", 2: "2", 3: "3" };

function buildStages(): ExampleStage[] {
  const initialStage: ExampleStage = {
    title: "Estado inicial",
    subtitle: "Presentación del grafo base para empezar el ejemplo.",
    route: null,
    cost: null,
    neighbors: [],
    decision: "Aquí solo observamos el grafo. Presiona Siguiente para comenzar con la Iteración 1.",
    tone: "start",
  };

  const runStages = baseRun.iterations.map((iteration, index) => {
    const currentText = routeToString(iteration.currentRoute);
    const bestText = routeToString(iteration.bestNeighbor.route);
    const comparisonText = `${iteration.bestNeighbor.cost} ${iteration.bestNeighbor.cost < iteration.currentCost ? "<" : ">="} ${iteration.currentCost}`;
    const neighbors = iteration.neighbors.map((neighbor) => ({
      routeText: routeToString(neighbor.route),
      cost: neighbor.cost,
      isBest:
        routeToString(neighbor.route) === bestText && neighbor.cost === iteration.bestNeighbor.cost,
    }));

    const tone: Tone =
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
    } satisfies ExampleStage;
  });

  return [initialStage, ...runStages];
}

function toneLabel(tone: Tone): string {
  if (tone === "start") return "Inicio";
  if (tone === "progress") return "Mejora";
  if (tone === "optimal") return "Mejor encontrado";
  return "Paro";
}

export function HomePage() {
  const stages = useMemo(buildStages, []);
  const [stageIndex, setStageIndex] = useState(0);
  const stage = stages[stageIndex];
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

  return (
    <div className="container page-stack">
      <Card>
        <CardHeader>
          <div className="case-topbar">
            <div>
              <CardTitle>Ejemplo guiado del caso base</CardTitle>
              <CardDescription>
                Avanza paso a paso para ver costos, vecinos y decisiones del algoritmo.
              </CardDescription>
            </div>
            <div className="stepper-controls">
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
                {toneLabel(stage.tone)} - {stageIndex + 1}/{stages.length}
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
        </CardHeader>

        <CardContent className="case-interactive-content">
          <section className="case-grid">
            <article className="case-graph-block">
              <h3>{stage.title}</h3>
              <p>{stage.subtitle}</p>
              <GraphCanvas
                graph={baseGraph}
                activeRoute={stage.route ?? undefined}
                nodePositions={basePositions}
                nodeLabels={baseLabels}
                highlightTheme={stage.tone}
                height={450}
              />
            </article>

            <article className="case-side-block compact">
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
                      {baseGraph.edges.map((edge) => (
                        <tr key={edge.id}>
                          <td>
                            {edge.from} {"\u2194"} {edge.to}
                          </td>
                          <td>{edge.weight}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="case-mini-card compact">
                <h4>¿Qué está pasando?</h4>
                <p>
                  Ruta actual: <code>{stage.route ? routeToString(stage.route) : "-"}</code> -{" "}
                  <code>F={stage.cost ?? "-"}</code>
                </p>
                <p>{stage.decision}</p>
              </div>

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
            </article>
          </section>

          <section className="neighbors-inline">
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
                    <SearchTreeView result={treeResultForStage} summaryVariant="none" layoutVariant="compact" />
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
